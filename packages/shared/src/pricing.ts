import { Decimal } from '@prisma/client/runtime/library';
import { CATEGORY_FEE_PERCENT, FEES, GATEWAY_FEE_ESTIMATES } from './fees';
import type { PaymentMethod } from '@dividelo/db';

export interface PriceBreakdown {
  baseSlotPriceCOP: number;
  markupPercent: number;
  markupCOP: number;
  platformFeePercent: number;
  platformFeeCOP: number;
  fixedFeeCOP: number;
  protectionFeeCOP: number;
  gatewayFeeCOP: number;
  totalGuestPriceCOP: number;
  hostPayoutCOP: number;
  platformRevenueCOP: number;
  platformNetProfitCOP: number;
}

export interface PriceBreakdownInput {
  baseSlotPriceCOP: number;
  markupPercent?: number; // 0-10
  category?: string;
  isGuestPlus?: boolean; // suscripción Plus Huésped
  method: PaymentMethod;
  gateway: string;
}

const roundCOP = (n: number): number => Math.round(n * 100) / 100;

/**
 * Calcula el desglose completo de precios
 *
 * REGLA NUEVA (prioridad alta:
 * - Fee plataforma: 9% por categoría
 * - Fee fijo: $1.200 COP (exento para Plus)
 * - Plus Guest: 3% dto + sin fee fijo
 *
 * @example
 * calcPriceBreakdown({
 *   baseSlotPriceCOP: 13725,
 *   markupPercent: 5,
 *   category: 'STREAMING_VIDEO',
 *   method: PaymentMethod.NEQUI,
 *   gateway: 'wompi',
 * });
 */
export function calcPriceBreakdown(input: PriceBreakdownInput): PriceBreakdown {
  const {
    baseSlotPriceCOP,
    markupPercent = 0,
    category = 'OTHER',
    isGuestPlus = false,
    method,
    gateway,
  } = input;

  // 1) Markup anfitrión (0-10%)
  const markupCOP = roundCOP(baseSlotPriceCOP * (markupPercent / 100));

  // 2) Fee de plataforma por categoría
  let platformFeePercent = CATEGORY_FEE_PERCENT[category] ?? FEES.DEFAULT_PLATFORM_FEE_PERCENT;
  if (isGuestPlus) {
    platformFeePercent = Math.max(0, platformFeePercent - FEES.PLUS_GUEST_DISCOUNT_PERCENT);
  }
  const hostSlotPlusMarkup = baseSlotPriceCOP + markupCOP;
  const platformFeeCOP = roundCOP(hostSlotPlusMarkup * (platformFeePercent / 100));

  // 3) Fee fijo (exento para Plus Guest)
  const fixedFeeCOP = isGuestPlus && FEES.PLUS_GUEST_WAIVE_FIXED_FEE ? 0 : FEES.DEFAULT_FIXED_FEE_COP;

  // 4) Protección (incluida en el take rate, no visible separado
  const protectionFeeCOP = 0;

  // 5) Costo de pasarela estimado
  const gw = GATEWAY_FEE_ESTIMATES[gateway]?.[method];
  const gatewayPct = gw?.percent ?? 3.5;
  const gatewayFixed = gw?.fixedCOP ?? 800;
  const subtotal = hostSlotPlusMarkup + platformFeeCOP + fixedFeeCOP;
  const gatewayFeeCOP = roundCOP(subtotal * (gatewayPct / 100) + gatewayFixed);

  // 6) Precio final huésped
  const totalGuestPriceCOP = roundCOP(subtotal + gatewayFeeCOP);

  // 7) Payout al anfitrión (cuota base + markup
  const hostPayoutCOP = roundCOP(hostSlotPlusMarkup);

  // 8) Ingreso y margen plataforma
  const platformRevenueCOP = roundCOP(platformFeeCOP + fixedFeeCOP);
  const platformNetProfitCOP = roundCOP(platformRevenueCOP - gatewayFeeCOP);

  return {
    baseSlotPriceCOP,
    markupPercent,
    markupCOP,
    platformFeePercent,
    platformFeeCOP,
    fixedFeeCOP,
    protectionFeeCOP,
    gatewayFeeCOP,
    totalGuestPriceCOP,
    hostPayoutCOP,
    platformRevenueCOP,
    platformNetProfitCOP,
  };
}

/**
 * Calcula el ahorro % del huésped vs suscripción individual
 */
export function calcGuestSavings(totalGuestPriceCOP: number, individualPriceCOP: number): number {
  if (individualPriceCOP <= 0) return 0;
  return Math.max(0, 1 - totalGuestPriceCOP / individualPriceCOP);
}

/**
 * Calcula el costo neto del anfitrión y su ahorro
 */
export function calcHostNetCost(
  totalPlanPriceCOP: number,
  totalHostPayoutFromGuestsCOP: number,
): { netCostCOP: number; savingsPercent: number } {
  const netCostCOP = Math.max(0, totalPlanPriceCOP - totalHostPayoutFromGuestsCOP);
  const savingsPercent = totalPlanPriceCOP > 0 ? Math.min(1, totalHostPayoutFromGuestsCOP / totalPlanPriceCOP) : 0;
  return { netCostCOP, savingsPercent };
}

/**
 * Smart Routing: elige el gateway óptimo según monto y método
 * Prioridad alta: dual gateway para reducir costos
 */
export function selectOptimalGateway(
  amountCOP: number,
  method: PaymentMethod,
): { gateway: string; reason: string } {
  const wompi = GATEWAY_FEE_ESTIMATES.wompi[method];
  const ptp = GATEWAY_FEE_ESTIMATES.placetopay[method];

  if (!wompi && !ptp) {
    return { gateway: 'wompi', reason: 'fallback-default' };
  }

  if (!ptp) return { gateway: 'wompi', reason: 'only-wompi-only' };
  if (!wompi) return { gateway: 'placetopay', reason: 'only-placetopay-only' };

  const wompiCost = amountCOP * (wompi.percent / 100) + wompi.fixedCOP;
  const ptpCost = amountCOP * (ptp.percent / 100) + ptp.fixedCOP;

  if (amountCOP < 20000) {
    // Monto pequeño: favorece menor costo fijo proporcional
    return wompiCost <= ptpCost
      ? { gateway: 'wompi', reason: 'optimal-low-amount' }
      : { gateway: 'placetopay', reason: 'optimal-low-amount' };
  }

  if (amountCOP > 100000) {
    // Monto alto: favorece menor porcentual
    return wompi.percent <= ptp.percent
      ? { gateway: 'wompi', reason: 'optimal-high-amount' }
      : { gateway: 'placetopay', reason: 'optimal-high-amount' };
  }

  return wompiCost <= ptpCost
    ? { gateway: 'wompi', reason: 'optimal-default' }
    : { gateway: 'placetopay', reason: 'optimal-default' };
}

export function decimalToNumber(d: Decimal | number): number {
  return typeof d === 'number' ? d : d.toNumber();
}
