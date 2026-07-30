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
 * WOMPI ADAPTER (Bancolombia)
 * Soporte nativo: PSE, Nequi, Daviplata, Tarjetas, Bancolombia Transfer
 * Documentación: https://docs.wompi.co/docs/es
 */
export class WompiAdapter implements PaymentProviderAdapter {
  readonly providerName = 'wompi' as const;

  private readonly client: AxiosInstance;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly webhookSecret: string;
  private readonly environment: 'sandbox' | 'production';

  constructor(opts: {
    publicKey: string;
    privateKey: string;
    webhookSecret: string;
    environment?: 'sandbox' | 'production';
  }) {
    this.publicKey = opts.publicKey;
    this.privateKey = opts.privateKey;
    this.webhookSecret = opts.webhookSecret;
    this.environment = opts.environment ?? 'sandbox';
    const baseURL =
      this.environment === 'sandbox'
        ? 'https://api-sandbox.co.uat.wompi.dev/v1'
        : 'https://api.wompi.sv/co/v1';
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  private readonly methodMap: Record<PaymentMethod, string | null> = {
    PSE: 'PSE',
    NEQUI: 'NEQUI',
    DAVIPLATA: 'DAVIPLATA',
    CREDIT_CARD: 'CARD',
    DEBIT_CARD: 'CARD',
    BANK_TRANSFER: 'BANCOLOMBIA_TRANSFER',
    WALLET_BALANCE: null,
    ADDI_BNPL: 'ADDI',
    RAPPI_PAY: 'RAPPI',
    EFECTY: 'EFECTY',
  };

  supportsMethod(method: PaymentMethod): boolean {
    return this.methodMap[method] !== null;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const wompiMethod = this.methodMap[input.method];
    if (!wompiMethod) {
      return { ok: false, error: 'Método no soportado por Wompi' };
    }
    try {
      // 1. Crear token de aceptación (requisito Wompi
      const accept = await this.client.get('/merchants', {
        headers: { Authorization: `Bearer ${this.publicKey}` },
      });
      const acceptanceToken = accept.data.data.presigned_acceptance?.acceptance_token;

      // 2. Crear transacción
      const body = {
        acceptance_token: acceptanceToken,
        amount_in_cents: Math.round(input.amountCOP * 100),
        currency: input.currency ?? 'COP',
        customer_email: input.customer.email,
        customer_data: {
          full_name: input.customer.name,
          phone_number: input.customer.phone,
          legal_id: input.customer.document?.number,
          legal_id_type: input.customer.document?.type,
        },
        reference: input.reference,
        payment_method: {
          type: wompiMethod,
          // extras por método
          ...(input.method === 'PSE'
            ? {
                user_type: input.customer.document?.type === 'CC' ? '0' : '1',
                user_legal_id_type: input.customer.document?.type,
                user_legal_id: input.customer.document?.number,
                financial_institution_code: '',
                payment_description: input.description,
              }
            : {}),
          ...(input.method === 'NEQUI' || input.method === 'DAVIPLATA'
            ? { phone_number: input.customer.phone }
            : {}),
        },
        redirect_url: input.successUrl,
        metadata: {
          ...input.metadata,
          internal_payment_id: input.internalPaymentId,
        },
      };

      const res = await this.client.post('/transactions', body);
      const tx = res.data.data;
      return {
        ok: true,
        providerPaymentId: tx.id,
        redirectUrl: tx.payment_link ?? tx.redirect_url,
        expiresAt: tx.expires_at ? new Date(tx.expires_at) : undefined,
        rawData: tx,
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error?.messages?.join(', ') ?? e.message,
      };
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<ConfirmPaymentResult> {
    try {
      const res = await this.client.get(`/transactions/${providerPaymentId}`);
      const tx = res.data.data;
      const statusMap: Record<string, ConfirmPaymentResult['status']> = {
        APPROVED: 'PAID',
        PENDING: 'PENDING',
        DECLINED: 'FAILED',
        ERROR: 'FAILED',
        VOIDED: 'FAILED',
        ABANDONED: 'EXPIRED',
      };
      return {
        ok: true,
        status: statusMap[tx.status] ?? 'PENDING',
        amountCOP: tx.amount_in_cents / 100,
        providerPaymentId: tx.id,
        internalRef: tx.metadata?.internal_payment_id ?? tx.reference,
        paidAt: tx.status === 'APPROVED' && tx.finalized_at ? new Date(tx.finalized_at) : undefined,
        rawData: tx,
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
        amount_in_cents: Math.round(input.amountCOP * 100),
        reason: input.reason ?? 'REQUEST_BY_CUSTOMER',
      };
      const res = await this.client.post(
        `/transactions/${input.providerPaymentId}/refund`,
        body,
      );
      return {
        ok: true,
        providerRefundId: res.data.data.id,
        status: 'PENDING',
        rawData: res.data,
      };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.response?.data?.error?.messages?.join(', ') ?? e.message,
      };
    }
  }

  async createPayout?(_input: PayoutInput): Promise<PayoutResult> {
    // Wompi tiene API de transferencias (requiere habilitación)
    return {
      ok: false,
      error: 'Payouts via Wompi requieren contrato de transferencias habilitado',
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    const signature = String(headers['x-wompi-signature'] ?? '');
    const timestamp = String(headers['x-wompi-event-timestamp'] ?? '');

    if (!signature || !timestamp) {
      return { isValid: false, event: null };
    }
    try {
      const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const data = JSON.parse(body);

      // Validar firma HMAC-SHA256
      const signedPayload = `${timestamp}${body}`;
      const expected = createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (signature !== expected && this.environment === 'production') {
        return { isValid: false, event: null };
      }

      const eventType = data.event; // transaction.updated, etc.
      const tx = data.data?.transaction ?? data.data;

      const typeMap: Record<string, string> = {
        'transaction.created': 'payment.pending',
        'transaction.updated': tx?.status === 'APPROVED' ? 'payment.approved' : tx?.status === 'DECLINED' ? 'payment.failed' : 'payment.pending',
        'transaction.refund.created': 'refund.completed',
        'transaction.chargeback.created': 'payment.chargeback',
        'transfer.created': 'payout.completed',
      };

      return {
        isValid: true,
        event: {
          type: typeMap[eventType] ?? eventType,
          providerRef: tx?.id,
          internalRef: tx?.metadata?.internal_payment_id ?? tx?.reference,
          amountCOP: tx?.amount_in_cents ? tx.amount_in_cents / 100 : undefined,
          paidAt: tx?.finalized_at ? new Date(tx.finalized_at) : undefined,
          rawData: data,
        },
      };
    } catch {
      return { isValid: false, event: null };
    }
  }
}
