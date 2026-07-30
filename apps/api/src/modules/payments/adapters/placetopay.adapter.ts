import axios, { AxiosInstance } from 'axios';
import {
  PaymentProviderAdapter,
  CreateCheckoutInput,
  CheckoutResult,
  ConfirmPaymentResult,
  RefundInput,
  RefundResult,
  PayoutInput,
  PayoutResult,
  WebhookVerificationResult,
} from './payment-provider.adapter';
import type { PaymentMethod } from '@dividelo/db';
import { createHmac } from 'crypto';

/**
 * PLACETOPAY ADAPTER (Evertec / Redirection)
 * Soporte: PSE, Tarjetas, Bancolombia, Daviplata, Nequi
 * Fallback primario si Wompi falla
 */
export class PlaceToPayAdapter implements PaymentProviderAdapter {
  readonly providerName = 'placetopay' as const;

  private readonly client: AxiosInstance;
  private readonly login: string;
  private readonly tranKey: string;
  private readonly webhookSecret: string;

  constructor(opts: {
    login: string;
    tranKey: string;
    baseURL?: string;
    webhookSecret: string;
  }) {
    this.login = opts.login;
    this.tranKey = opts.tranKey;
    this.webhookSecret = opts.webhookSecret;
    this.client = axios.create({
      baseURL: opts.baseURL ?? 'https://test.placetopay.com/redirection',
      headers: { 'Content-Type': 'application/json' },
      timeout: 45_000,
    });
  }

  private readonly methodMap: Record<PaymentMethod, string | null> = {
    PSE: 'PSE',
    NEQUI: 'NEQUI',
    DAVIPLATA: 'DAVIPLATA',
    CREDIT_CARD: 'CARD',
    DEBIT_CARD: 'CARD',
    BANK_TRANSFER: 'BANCOLOMBIA',
    WALLET_BALANCE: null,
    ADDI_BNPL: null,
    RAPPI_PAY: null,
    EFECTY: 'EFECTY',
  };

  supportsMethod(method: PaymentMethod): boolean {
    return this.methodMap[method] !== null;
  }

  private auth(seed = Date.now() / 1000) {
    const nonce = Math.random().toString(36).slice(2, 10);
    const tranKey = createHmac('sha256', this.tranKey)
      .update(nonce + seed)
      .digest('base64');
    return {
      login: this.login,
      tranKey,
      nonce: Buffer.from(nonce).toString('base64'),
      seed: new Date(seed * 1000).toISOString(),
    };
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const wompiMethod = this.methodMap[input.method];
    if (!wompiMethod) {
      return { ok: false, error: 'Método no soportado por PlaceToPay' };
    }
    try {
      const body = {
        auth: this.auth(),
        locale: 'es_CO',
        buyer: {
          name: input.customer.name ?? 'Cliente Dividelo',
          surname: '',
          email: input.customer.email,
          document: input.customer.document?.number ?? '00000000',
          documentType: input.customer.document?.type ?? 'CC',
          mobile: input.customer.phone ?? '+573000000000',
        },
        payment: {
          reference: input.reference,
          description: input.description,
          amount: {
            currency: input.currency ?? 'COP',
            total: input.amountCOP,
          },
          allowPartial: false,
          // Filtrar método permitido
          paymentMethods: [wompiMethod],
        },
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // 4h
        returnUrl: input.successUrl,
        cancelUrl: input.failureUrl,
        skipResult: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Dividelo/1.0',
        additional: {
          ...input.metadata,
          internal_payment_id: input.internalPaymentId,
        },
      };
      const res = await this.client.post('/api/session', body);
      const session = res.data;
      if (session.status?.status !== 'OK') {
        return { ok: false, error: session.status?.message ?? 'Error P2P' };
      }
      return {
        ok: true,
        providerPaymentId: String(session.requestId),
        redirectUrl: session.processUrl,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4),
        rawData: session,
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.status?.message ?? e.message,
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<ConfirmPaymentResult> {
    try {
      const res = await this.client.post(`/api/session/${providerPaymentId}`, {
        auth: this.auth(),
      });
      const session = res.data;
      const status = session.status?.status;
      const payment = session.payment?.[0] ?? session.payment;

      const map: Record<string, ConfirmPaymentResult['status']> = {
        OK: 'PAID',
        APPROVED: 'PAID',
        PENDING: 'PENDING',
        FAILED: 'FAILED',
        REJECTED: 'FAILED',
        REFUNDED: 'FAILED',
      };
      return {
        ok: true,
        status: map[status] ?? (payment?.status ? map[payment.status] : 'PENDING'),
        amountCOP: payment?.amount?.total ?? session.payment?.amount?.total ?? 0,
        providerPaymentId,
        internalRef: session.additional?.internal_payment_id ?? payment?.reference,
        paidAt: payment?.status === 'OK' || payment?.status === 'APPROVED'
          ? new Date(payment.statusDate ?? Date.now())
          : undefined,
        rawData: session,
      };
    } catch (e: any) {
      return {
        ok: false,
        status: 'FAILED',
        amountCOP: 0,
        providerPaymentId,
        internalRef: '',
        error: e.message,
      };
    }
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    try {
      const body = {
        auth: this.auth(),
        action: 'reverse',
        total: input.amountCOP,
        reason: input.reason,
      };
      const res = await this.client.post(`/api/session/${input.providerPaymentId}/reverse`, body);
      return {
        ok: true,
        providerRefundId: String(res.data?.requestId ?? input.providerPaymentId),
        status: res.data?.status?.status === 'OK' ? 'COMPLETED' : 'PENDING',
        rawData: res.data,
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.status?.message ?? e.message,
      };
    }
  }

  async createPayout?(_input: PayoutInput): Promise<PayoutResult> {
    // PlaceToPay tiene API de dispersión (Dispersiones)
    return {
      ok: false,
      error: 'Payouts via PlaceToPay requiere módulo Dispersiones habilitado',
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    const signature = String(headers['x-placetopay-signature'] ?? headers['X-Signature'] ?? '');
    if (!signature) {
      return { isValid: false, event: null };
    }
    try {
      const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const expected = createHmac('sha256', this.webhookSecret).update(body).digest('hex');
      if (signature !== expected) {
        return { isValid: false, event: null };
      }
      const data = JSON.parse(body);
      const status = data.status?.status;
      const payment = data.payment?.[0] ?? data.payment;

      let type: string = 'payment.pending';
      if (status === 'APPROVED' || status === 'OK') type = 'payment.approved';
      else if (status === 'REJECTED' || status === 'FAILED') type = 'payment.failed';
      else if (data.action === 'reverse') type = 'refund.completed';

      return {
        isValid: true,
        event: {
          type,
          providerRef: String(data.requestId),
          internalRef: data.additional?.internal_payment_id ?? payment?.reference,
          amountCOP: payment?.amount?.total ?? 0,
          paidAt: payment?.statusDate ? new Date(payment.statusDate) : undefined,
          rawData: data,
        },
      };
    } catch {
      return { isValid: false, event: null };
    }
  }
}
