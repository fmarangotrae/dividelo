import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '@dividelo/db';
import type {
  LedgerAccountType,
  LedgerEntryType,
} from '@prisma/client';

/**
 * BillingLedgerService
 *
 * Reglas INVARIANTES (nunca romperlas):
 *   1. Nunca hacemos UPDATE ni DELETE en la tabla ledger_entries.
 *      Solo INSERTS (y SOFT DELETE si es estrictamente necesario).
 *   2. Cada operación financiera genera SIEMPRE 2 entradas:
 *      una de débito y una de crédito, por el MISMO MONTO.
 *   3. En cualquier momento: Σ(débito) − Σ(crédito) = 0.
 *   4. Todas las entradas comparten el mismo `transactionId`
 *      para trazabilidad end-to-end.
 */

@Injectable()
export class BillingLedgerService {
  /**
   * Escribe una transacción de doble entrada en el ledger.
   * Solo esta función debería hacer inserts directos en ledger_entries.
   */
  async writeDoubleEntry(input: {
    transactionId: string;
    paymentId?: string;
    payoutId?: string;
    refundId?: string;
    entryType: LedgerEntryType;
    description?: string;
    metadata?: Record<string, unknown>;
    createdByUserId?: string;
    entries: Array<{
      accountType: LedgerAccountType;
      accountOwnerId?: string;
      debitCOP: number;
      creditCOP: number;
    }>;
  }) {
    const totalDebit = input.entries.reduce((s, e) => s + e.debitCOP, 0);
    const totalCredit = input.entries.reduce((s, e) => s + e.creditCOP, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new InternalServerErrorException(
        `[LEDGER] Doble partida inconsistente: debit=${totalDebit} credit=${totalCredit}`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const rows = input.entries
        .filter((e) => e.debitCOP > 0 || e.creditCOP > 0)
        .map((e) => ({
          transactionId: input.transactionId,
          paymentId: input.paymentId,
          payoutId: input.payoutId,
          refundId: input.refundId,
          accountType: e.accountType,
          accountOwnerId: e.accountOwnerId,
          debitAmountCOP: e.debitCOP,
          creditAmountCOP: e.creditCOP,
          currency: 'COP',
          entryType: input.entryType,
          description: input.description,
          metadata: input.metadata as any,
          createdByUserId: input.createdByUserId,
        }));

      return tx.ledgerEntry.createMany({ data: rows });
    });
  }

  /**
   * Función de auditoría: verifica que todas las transacciones cierren en cero.
   * Debe correrse en cron nocturno.
   */
  async auditConsistency(fromDate?: Date, toDate?: Date): Promise<{
    totalDebit: number;
    totalCredit: number;
    diff: number;
    healthy: boolean;
    perTransaction: Array<{ transactionId: string; diff: number }>;
  }> {
    const where: any = { createdAt: {} };
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;

    const rows = await prisma.ledgerEntry.groupBy({
      by: ['transactionId'],
      where,
      _sum: { debitAmountCOP: true, creditAmountCOP: true },
    });

    let totalDebit = 0;
    let totalCredit = 0;
    const perTransaction: Array<{ transactionId: string; diff: number }> = [];

    for (const r of rows) {
      const d = Number(r._sum.debitAmountCOP ?? 0);
      const c = Number(r._sum.creditAmountCOP ?? 0);
      totalDebit += d;
      totalCredit += c;
      const diff = Math.abs(d - c);
      if (diff > 0.001) {
        perTransaction.push({ transactionId: r.transactionId ?? '(none)', diff });
      }
    }

    return {
      totalDebit,
      totalCredit,
      diff: Math.abs(totalDebit - totalCredit),
      healthy: perTransaction.length === 0,
      perTransaction,
    };
  }
}
