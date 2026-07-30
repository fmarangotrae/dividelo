import { PaymentMethod } from '@dividelo/db';

/**
 * ESTRUCTURA DE FEES - PRIORIDAD ALTA
 * Ajuste para mejorar unit economics: 8% → 9% fee, fee fijo $900 → $1.200 COP
 * Ver plan empresarial, sección de monetización
 */

export const FEES = {
  DEFAULT_PLATFORM_FEE_PERCENT: 9, // ← mejora: 8% → 9%
  DEFAULT_FIXED_FEE_COP: 1200, // ← mejora: $900 → $1.200 COP
  PROTECTION_FEE_PERCENT: 0, // incluido dentro del take rate, no visible
  // Payouts
  PAYOUT_EXPEDITED_FEE_PERCENT: 2, // fee por retiro instantáneo Nequi <1h
  PAYOUT_STANDARD_FEE_BANK_COP: 1500, // transferencia bancaria 24-48h
  PAYOUT_STANDARD_FEE_NEQUI_COP: 0, // sin costo base
  // Suscripciones Pro (opcional, monetización capa 2
  PRO_HOST_MONTHLY_FEE_COP: 9900, // $9.900 COP
  PLUS_GUEST_MONTHLY_FEE_COP: 4900, // $4.900 COP
  PLUS_GUEST_DISCOUNT_PERCENT: 3,
  PLUS_GUEST_WAIVE_FIXED_FEE: true,
  // Featured listings
  FEATURED_LISTING_7_DAYS_COP: 2500,
} as const;

/**
 * Gateway fee promedio esperada por proveedor y método
 * (valores típicos Colombia - ajustar con proveedor real
 */
export const GATEWAY_FEE_ESTIMATES: Record<
  string,
  Partial<Record<PaymentMethod, { percent: number; fixedCOP: number }>>
> = {
  wompi: {
    [PaymentMethod.PSE]: { percent: 2.65, fixedCOP: 700 },
    [PaymentMethod.NEQUI]: { percent: 2.5, fixedCOP: 600 },
    [PaymentMethod.CREDIT_CARD]: { percent: 2.85, fixedCOP: 800 },
    [PaymentMethod.DEBIT_CARD]: { percent: 2.65, fixedCOP: 700 },
    [PaymentMethod.DAVIPLATA]: { percent: 2.5, fixedCOP: 600 },
    [PaymentMethod.BANK_TRANSFER]: { percent: 1.8, fixedCOP: 500 },
    [PaymentMethod.WALLET_BALANCE]: { percent: 0.5, fixedCOP: 200 },
    [PaymentMethod.ADDI_BNPL]: { percent: 4.5, fixedCOP: 1000 },
    [PaymentMethod.RAPPI_PAY]: { percent: 3.2, fixedCOP: 800 },
    [PaymentMethod.EFECTY]: { percent: 3.5, fixedCOP: 1500 },
  },
  placetopay: {
    [PaymentMethod.PSE]: { percent: 2.75, fixedCOP: 750 },
    [PaymentMethod.CREDIT_CARD]: { percent: 2.95, fixedCOP: 850 },
    [PaymentMethod.DEBIT_CARD]: { percent: 2.75, fixedCOP: 750 },
    [PaymentMethod.NEQUI]: { percent: 2.6, fixedCOP: 700 },
    [PaymentMethod.BANK_TRANSFER]: { percent: 1.9, fixedCOP: 600 },
    [PaymentMethod.WALLET_BALANCE]: { percent: 0.6, fixedCOP: 250 },
  },
  mercadopago: {
    [PaymentMethod.PSE]: { percent: 3.09, fixedCOP: 600 },
    [PaymentMethod.CREDIT_CARD]: { percent: 3.49, fixedCOP: 700 },
  },
};

/**
 * Categorías: take rate dinámico por tipo de suscripción
 */
export const CATEGORY_FEE_PERCENT: Record<string, number> = {
  STREAMING_VIDEO: 9,
  STREAMING_MUSIC: 9,
  GAMING: 10,
  PRODUCTIVITY: 7,
  SOFTWARE: 6,
  EDUCATION: 8,
  FITNESS: 8,
  NEWS: 9,
  OTHER: 9,
};
