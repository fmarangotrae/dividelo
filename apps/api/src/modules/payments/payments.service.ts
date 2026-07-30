import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRouterService } from './adapters/payment-router.service';
import { prisma } from '@dividelo/db';
import type { PaymentMethod } from '@dividelo/db';
import {
  calcPriceBreakdown as calc,
  getEscrowReleaseHours,
  decimalToNumber,
} from '@dividelo/shared';
import { BillingEscrowService } from '../billing/billing-escrow.service';

/**
 * PaymentsService
 *
 * Conecta:
 * 1) Marketplace (listing, membership)
 * 2) Pricing @dividelo/shared (fees 9% + $1.200 COP
 * 3) Payment Router (dual gateway Wompi + PlaceToPay)
 * 4) Billing Escrow (ledger de doble entrada)
 */

@Injectable()
export class PaymentsService {
  constructor(
    private readonly router: PaymentRouterService,
    private readonly escrow: BillingEscrowService,
  ) {}

  async initCheckout(input: {
    listingId: string;
    guestId: string;
    method: PaymentMethod;
    preferredGateway?: string;
    customer: { email: string; name?: string; phone?: string; document?: { type: string; number: string } };
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
    webhookBaseUrl: string;
  }) {
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { subscriptionService: true, host: { include: { wallet: true } } },
    });
    if (!listing) throw new NotFoundException('Listing no encontrado');
    if (listing.availableSlots <= 0) throw new BadRequestException('Sin cupos disponibles');

    const guest = await prisma.user.findUnique({ where: { id: input.guestId } });
    if (!guest) throw new NotFoundException('Huésped no encontrado');

    const pricing = calc({
      baseSlotPriceCOP: decimalToNumber(listing.baseSlotPriceCOP),
      markupPercent: listing.markupPercent,
      category: listing.subscriptionService.category,
      method: input.method,
      gateway: this.router.selectBestProvider(
        decimalToNumber(listing.baseSlotPriceCOP),
        input.method,
        input.preferredGateway,
      ).name,
    });

    // 1. Crear Payment (estado INITIATED)
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const payment = await prisma.payment.create({
      data: {
        guestId: guest.id,
        listingId: listing.id,
        baseSlotPriceCOP: pricing.baseSlotPriceCOP,
        markupCOP: pricing.markupCOP,
        platformFeePercent: pricing.platformFeePercent,
        platformFeeCOP: pricing.platformFeeCOP,
        fixedFeeCOP: pricing.fixedFeeCOP,
        gatewayFeeCOP: pricing.gatewayFeeCOP,
        protectionFeeCOP: 0,
        totalGuestPriceCOP: pricing.totalGuestPriceCOP,
        hostPayoutCOP: pricing.hostPayoutCOP,
        method: input.method,
        gateway: 'wompi',
        status: 'INITIATED',
        periodStart,
        periodEnd,
      },
    });

    // 2. Crear checkout con el router
    const webhookUrl = `${input.webhookBaseUrl}/api/payments/webhooks`;
    const { gateway, result } = await this.router.createCheckoutWithFallback({
      internalPaymentId: payment.id,
      amountCOP: pricing.totalGuestPriceCOP,
      currency: 'COP',
      method: input.method,
      reference: `DIV-${payment.id.slice(-8).toUpperCase()}`,
      description: `${listing.subscriptionService.name} ${listing.planName} - Cupo`,
      successUrl: input.successUrl + `?paymentId=${payment.id}`,
      failureUrl: input.failureUrl + `?paymentId=${payment.id}`,
      pendingUrl: input.pendingUrl + `?paymentId=${payment.id}`,
      webhookUrl,
      customer: input.customer,
      metadata: { listingId: listing.id, guestId: guest.id },
    });

    if (!result.ok) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failReason: result.error },
      });
      throw new BadRequestException(result.error ?? 'Fallo al crear pago');
    }

    // 3. Actualizar payment con ref del gateway
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gateway,
        gatewayPaymentRef: result.providerPaymentId,
        status: 'PENDING',
        expirationAt: result.expiresAt,
        initiatedAt: new Date(),
      },
    });

    return {
      paymentId: payment.id,
      redirectUrl: result.redirectUrl,
      expiresAt: result.expiresAt,
      pricing,
    };
  }

  async getPayment(id: string) {
    const p = await prisma.payment.findUnique({
      where: { id },
      include: {
        guest: { select: { id: true, name: true, email: true } },
        listing: { include: { subscriptionService: true, host: true } },
        ledgerEntries: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException('Pago no encontrado');
    return p;
  }

  /**
   * Huésped marca "Acceso OK" → libera escrow a anfitrión
   * Prioridad alta: optimiza cash flow
   */
  async confirmGuestAccessOK(paymentId: string, confirmedByGuestId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.guestId !== confirmedByGuestId) throw new BadRequestException('No autorizado');
    if (payment.status !== 'PAID_PENDING_CONFIRMATION') {
      throw new BadRequestException('El pago no está en estado de confirmación');
    }

    await this.escrow.releaseEscrowToHost(payment.id, {
      hours: 0,
      reason: 'guest-confirmed',
    });

    return { ok: true, escrowReleasedAt: new Date() };
  }

  async handleWebhook(
    providerName: 'wompi' | 'placetopay',
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const provider = this.router.getProvider(providerName);
    const v = await provider.verifyWebhook(rawBody, headers);
    if (!v.isValid || !v.event) return { ok: false };

    const evt = v.event;
    const internalId = evt.internalRef;

    if (!internalId) return { ok: true };

    const payment = await prisma.payment.findUnique({ where: { id: internalId } });
    if (!payment) return { ok: true };

    switch (evt.type) {
      case 'payment.approved': {
        // 1. Marcar pago PAID
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID_PENDING_CONFIRMATION',
            paidAt: evt.paidAt ?? new Date(),
          },
        });
        // 2. Registrar entradas ledger (CASH_IN + ESCROW_HOLD)
        await this.escrow.recordCashInAndEscrowHold(payment.id);

        // 3. Programar liberación de escrow según reputación del host
        const listing = await prisma.listing.findUnique({ where: { id: payment.listingId } });
        const host = listing && (await prisma.user.findUnique({ where: { id: listing.hostId } }));
        const release = getEscrowReleaseHours(host?.reputationScore ?? 50, host?.successfulTransactions ?? 0);
        this.escrow.scheduleEscrowRelease(payment.id, release.hours, release.reason);
        break;
      }
      case 'payment.pending':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING' } });
        break;
      case 'payment.failed':
      case 'payment.chargeback': {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: evt.type === 'payment.chargeback' ? 'CHARGEBACK' : 'FAILED' },
        });
        if (evt.type === 'payment.chargeback') {
          await this.escrow.recordChargeback(payment.id);
        }
        break;
      }
      case 'refund.completed':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PARTIALLY_REFUNDED' } });
        break;
    }

    return { ok: true };
  }
}
