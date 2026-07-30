import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@dividelo/db';
import type { PaymentMethod } from '@dividelo/db';
import { BillingLedgerService } from './billing-ledger.service';
import { FEES } from '@dividelo/shared';

@Injectable()
export class BillingPayoutsService {
  constructor(private readonly ledger: BillingLedgerService) {}

  async requestPayout(input: {
    userId: string;
    amountCOP: number;
    method: PaymentMethod;
    destinationRef: string;
    expedited?: boolean;
    beneficiary?: { name: string; document?: { type: string; number: string } };
  }) {
    if (!['NEQUI', 'DAVIPLATA', 'BANK_TRANSFER'].includes(input.method)) {
      throw new BadRequestException('Método de retiro no permitido');
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: input.userId } });
    if (!wallet) throw new NotFoundException('Wallet no encontrada');

    const available = Number(wallet.availableCOP);
    if (available < input.amountCOP) {
      throw new BadRequestException('Saldo disponible insuficiente');
    }

    // Calcular fees
    let feeCOP = 0;
    if (input.expedited) {
      feeCOP = Math.round(input.amountCOP * (FEES.PAYOUT_EXPEDITED_FEE_PERCENT / 100));
    } else if (input.method === 'BANK_TRANSFER') {
      feeCOP = FEES.PAYOUT_STANDARD_FEE_BANK_COP;
    }

    const netAmount = input.amountCOP - feeCOP;
    if (netAmount <= 0) throw new BadRequestException('Monto neto debe ser > 0');

    const payout = await prisma.payout.create({
      data: {
        userId: input.userId,
        amountCOP: input.amountCOP,
        feeCOP,
        netAmountCOP: netAmount,
        method: input.method,
        destinationRef: input.destinationRef,
        status: 'PENDING',
        gateway: 'manual',
        expedited: !!input.expedited,
      },
    });

    // Bloquear saldo en wallet
    await prisma.wallet.update({
      where: { userId: input.userId },
      data: {
        availableCOP: { decrement: input.amountCOP },
        lockedCOP: { increment: input.amountCOP },
      },
    });

    // Ledger
    const transactionId = `tx-payout-${payout.id}`;
    await this.ledger.writeDoubleEntry({
      transactionId,
      payoutId: payout.id,
      entryType: 'HOST_PAYOUT',
      description: `Retiro a ${input.method} ${input.destinationRef}`,
      entries: [
        {
          accountType: 'PAYABLE_HOST',
          accountOwnerId: input.userId,
          debitCOP: input.amountCOP,
          creditCOP: 0,
        },
        {
          accountType: 'USER_WALLET_LOCKED',
          accountOwnerId: input.userId,
          debitCOP: 0,
          creditCOP: input.amountCOP,
        },
      ],
    });

    // TODO: integrar con Wompi / P2P dispersión en producción.
    // Por ahora marcamos como COMPLETED automáticamente (mock + hook para manual)
    setTimeout(async () => {
      try {
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        await prisma.wallet.update({
          where: { userId: input.userId },
          data: { lockedCOP: { decrement: input.amountCOP } },
        });
      } catch (_) {}
    }, 2000);

    return payout;
  }

  async getUserPayouts(userId: string) {
    return prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
