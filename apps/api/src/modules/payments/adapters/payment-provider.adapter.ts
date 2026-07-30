import type { PaymentMethod } from '@dividelo/db';

// ==========================
// PUERTO: PaymentProviderAdapter
// Interfaz común para todas las pasarelas
// ==========================

export type CreateCheckoutInput = {
  internalPaymentId: string;
  amountCOP: number;
  currency: 'COP';
  method: PaymentMethod;
  reference: string;
  description: string;
  // URLs
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  webhookUrl: string;
  // Datos usuario
  customer: {
    name?: string;
    email: string;
    phone?: string;
    document?: { type: string; number: string };
  };
  metadata: Record<string, unknown>;
};

export type CheckoutResult = {
  ok: boolean;
  providerPaymentId?: string;
  redirectUrl?: string;
  rawData?: unknown;
  expiresAt?: Date;
  error?: string;
};

export type ConfirmPaymentResult = {
  ok: boolean;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'EXPIRED';
  amountCOP: number;
  providerPaymentId: string;
  internalRef: string;
  paidAt?: Date;
  method?: PaymentMethod;
  gatewayFeesCOP?: number;
  rawData?: unknown;
  error?: string;
};

export type PayoutInput = {
  internalPayoutId: string;
  amountCOP: number;
  method: PaymentMethod;
  destinationRef: string; // phone Nequi, account bank
  description: string;
  beneficiary: {
    name: string;
    document?: { type: string; number: string };
  };
  metadata: Record<string, unknown>;
};

export type PayoutResult = {
  ok: boolean;
  providerPayoutId?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  rawData?: unknown;
  error?: string;
};

export type RefundInput = {
  internalRefundId: string;
  providerPaymentId: string;
  amountCOP: number;
  reason: string;
};

export type RefundResult = {
  ok: boolean;
  providerRefundId?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  rawData?: unknown;
  error?: string;
};

export type WebhookVerificationResult = {
  isValid: boolean;
  event: {
    type:
      | 'payment.approved'
      | 'payment.pending'
      | 'payment.failed'
      | 'payment.chargeback'
      | 'payout.completed'
      | 'payout.failed'
      | 'refund.completed'
      | 'refund.failed'
      | string;
    providerRef: string;
    internalRef?: string;
    amountCOP?: number;
    paidAt?: Date;
    rawData: unknown;
  } | null;
};

export interface PaymentProviderAdapter {
  readonly providerName: 'wompi' | 'placetopay' | 'mercadopago';

  supportsMethod(method: PaymentMethod): boolean;

  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;

  getPaymentStatus(providerPaymentId: string): Promise<ConfirmPaymentResult>;

  createRefund(input: RefundInput): Promise<RefundResult>;

  createPayout?(input: PayoutInput): Promise<PayoutResult>;

  verifyWebhook(rawBody: string | Buffer, headers: Record<string, string | string[] | undefined>): Promise<WebhookVerificationResult>;
}
