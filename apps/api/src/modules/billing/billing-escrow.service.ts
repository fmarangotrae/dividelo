import { Injectable, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { prisma } from '@dividelo/db';
import { BillingLedgerService } from './billing-ledger.service';
import { decimalToNumber } from '@dividelo/shared';

/**
 * BillingEscrowService
 *
 * Gestiona todo el ciclo de vida del escrow lógico:
 *   1. CASH_IN  → fondos entran vía pasarela.
 *   2. ESCROW_HOLD → se retienen mientras el huésped confirma acceso
 *      o transcurren X horas según reputación del anfitrión.
 *   3. ESCROW_RELEASE → se libera a wallet del anfitrión (available).
 *   4. REVERSAL / REFUND → si disputa a favor del huésped.
 */

@Injectable()
export class BillingEscrowService {
  constructor(
    private readonly ledger: BillingLedgerService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async getWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, availableCOP: 0, pendingCOP: 0, lockedCOP: 0 },
      });
    }
    return wallet;
  }

  async getUserLedger(userId: string, limit = 50) {
    return prisma.ledgerEntry.findMany({
      where: { accountOwnerId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * PASO 1 + 2: Registrar cash in + escrow hold
   * Llamado desde payments.service cuando webhook payment.approved llega.
   */
  async recordCashInAndEscrowHold(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        listing: { include: { host: true } },
      },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    const host = payment.listing.host;

    const totalGuest = decimalToNumber(payment.totalGuestPriceCOP);
    const platformRevenue =
      decimalToNumber(payment.platformFeeCOP) + decimalToNumber(payment.fixedFeeCOP);
    const hostPayout = decimalToNumber(payment.hostPayoutCOP);
    const gwFee = decimalToNumber(payment.gatewayFeeCOP);

    const transactionId = `tx-cashin-${paymentId}-${Date.now()}`;

    // Doble partida del cash in (simplificado para MVP)
    await this.ledger.writeDoubleEntry({
      transactionId,
      paymentId,
      entryType: 'CASH_IN_GATEWAY',
      description: `Cobro huésped ${payment.guestId} vía ${payment.gateway}`,
      createdByUserId: payment.guestId,
      entries: [
        {
          accountType: 'GATEWAY_PAYABLE',
          debitCOP: totalGuest,
          creditCOP: 0,
        },
        {
          accountType: 'ESCROW_HOLDING',
          accountOwnerId: host.id,
          debitCOP: 0,
          creditCOP: hostPayout,
        },
        {
          accountType: 'PLATFORM_REVENUE',
          accountOwnerId: 'platform',
          debitCOP: 0,
          creditCOP: platformRevenue,
        },
        {
          accountType: 'OPERATIONAL_EXPENSE',
          accountOwnerId: 'platform',
          debitCOP: gwFee,
          creditCOP: 0,
        },
        {
          accountType: 'GATEWAY_PAYABLE',
          debitCOP: 0,
          creditCOP: gwFee,
        },
      ],
    });

    // Actualizar bolsillos: host tiene saldo PENDING hasta liberar
    await this.ensureWallet(host.id);
    await prisma.wallet.update({
      where: { userId: host.id },
      data: {
        pendingCOP: { increment: hostPayout },
      },
    });

    return { ok: true, transactionId };
  }

  /**
   * PASO 3: Liberar escrow a wallet available del host (inmediatamente o con delay)
   */
  scheduleEscrowRelease(paymentId: string, releaseHours: number, reason: string) {
    if (releaseHours <= 0) {
      return this.releaseEscrowToHost(paymentId, { hours: 0, reason: `${reason}-now` });
    }
    const ms = releaseHours * 60 * 60 * 1000;
    const timeout = setTimeout(async () => {
      try {
        await this.releaseEscrowToHost(paymentId, { hours: releaseHours, reason });
      } catch (e) {
        console.error(`[EscrowRelease ${paymentId}] failed`, e);
      }
    }, ms);
    this.scheduler.addTimeout(`escrow-release-${paymentId}`, timeout);
    return { ok: true, scheduledForMs: ms };
  }

  async releaseEscrowToHost(
    paymentId: string,
    opts: { hours: number; reason: string },
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { listing: { include: { host: true } } },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    const statusStr = payment.status as string;
    if (
      statusStr !== 'PAID_PENDING_CONFIRMATION' &&
      statusStr !== 'ESCROW_RELEASED'
    ) {
      // No lanzar error si ya está liberado; idempotencia
      if (statusStr === 'ESCROW_RELEASED') return { ok: true, alreadyReleased: true };
    }

    const host = payment.listing.host;
    const hostPayout = decimalToNumber(payment.hostPayoutCOP);

    const transactionId = `tx-escrow-rel-${paymentId}-${Date.now()}`;
    await this.ledger.writeDoubleEntry({
      transactionId,
      paymentId,
      entryType: 'ESCROW_RELEASE_TO_HOST',
      description: `Liberación escrow host:${host.id} via ${opts.reason} after ${opts.hours}h`,
      entries: [
        {
          accountType: 'ESCROW_HOLDING',
          accountOwnerId: host.id,
          debitCOP: hostPayout,
          creditCOP: 0,
        },
        {
          accountType: 'PAYABLE_HOST',
          accountOwnerId: host.id,
          debitCOP: 0,
          creditCOP: hostPayout,
        },
      ],
    });

    // Mover de PENDING → AVAILABLE en wallet del host
    await this.ensureWallet(host.id);
    await prisma.wallet.update({
      where: { userId: host.id },
      data: {
        pendingCOP: { decrement: hostPayout },
        availableCOP: { increment: hostPayout },
      },
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'ESCROW_RELEASED', escrowReleasedAt: new Date() },
    });

    return { ok: true, releasedAt: new Date() };
  }

  /**
   * DISPUTA: Reembolso total o parcial al huésped
   */
  async refundGuestFromEscrow(
    paymentId: string,
    refundPercent: number, // 0 - 1
    reason: string,
    resolvedByUserId: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { listing: { include: { host: true } } },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    const host = payment.listing.host;
    const hostPayout = decimalToNumber(payment.hostPayoutCOP);
    const refundAmount = Math.round(hostPayout * refundPercent * 100) / 100;
    const backToHost = hostPayout - refundAmount;

    const transactionId = `tx-refund-${paymentId}-${Date.now()}`;
    await this.ledger.writeDoubleEntry({
      transactionId,
      paymentId,
      entryType: refundPercent >= 1 ? 'GUEST_REFUND_FULL' : 'GUEST_REFUND_PARTIAL',
      description: `Reembolso ${(refundPercent * 100).toFixed(0)}% via disputa: ${reason}`,
      createdByUserId: resolvedByUserId,
      entries: [
        {
          accountType: 'ESCROW_HOLDING',
          accountOwnerId: host.id,
          debitCOP: hostPayout,
          creditCOP: 0,
        },
        {
          accountType: 'REFUND_PAYABLE',
          accountOwnerId: payment.guestId,
          debitCOP: 0,
          creditCOP: refundAmount,
        },
        {
          accountType: 'PAYABLE_HOST',
          accountOwnerId: host.id,
          debitCOP: 0,
          creditCOP: backToHost,
        },
      ],
    });

    await this.ensureWallet(host.id);
    await prisma.wallet.update({
      where: { userId: host.id },
      data: {
        pendingCOP: { decrement: hostPayout },
        availableCOP: { increment: backToHost },
      },
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: refundPercent >= 1 ? 'FULLY_REFUNDED' : 'PARTIALLY_REFUNDED' },
    });

    return { ok: true, refundAmount, backToHost };
  }

  async recordChargeback(paymentId: string) {
    const transactionId = `tx-chb-${paymentId}-${Date.now()}`;
    await this.ledger.writeDoubleEntry({
      transactionId,
      paymentId,
      entryType: 'CHARGEBACK_DEBIT',
      description: 'Contracargo pasarela',
      entries: [
        {
          accountType: 'CHARGEBACK_LOSS',
          accountOwnerId: 'platform',
          debitCOP: 1,
          creditCOP: 0,
        },
        {
          accountType: 'GATEWAY_PAYABLE',
          debitCOP: 0,
          creditCOP: 1,
        },
      ],
    });
  }

  // =================== helpers ===================

  private async ensureWallet(userId: string) {
    const exists = await prisma.wallet.findUnique({ where: { userId } });
    if (!exists) {
      await prisma.wallet.create({
        data: { userId, availableCOP: 0, pendingCOP: 0, lockedCOP: 0 },
      });
    }
  }
}
