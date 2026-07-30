import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderAdapter } from './payment-provider.adapter';
import { WompiAdapter } from './wompi.adapter';
import { PlaceToPayAdapter } from './placetopay.adapter';
import type { PaymentMethod } from '@dividelo/db';
import { selectOptimalGateway } from '@dividelo/shared';

/**
 * SMART ROUTER - Dual Gateway
 *
 * Prioridad alta:
 *  - Elige automáticamente el gateway óptimo según monto y método
 *  - Si gateway primario falla, hace fallback al segundo
 *  - Implementa patrón Circuit Breaker simple por gateway
 */

@Injectable()
export class PaymentRouterService {
  private readonly providers: Record<string, PaymentProviderAdapter>;
  private readonly failures = new Map<string, { count: number; blockedUntil: number }>();
  private readonly FAILURE_THRESHOLD = 5;
  private readonly BLOCK_MS = 5 * 60 * 1000;

  constructor(config: ConfigService) {
    const wompiEnv = (config.get<string>('WOMPI_ENVIRONMENT') ?? 'sandbox') as
      | 'sandbox'
      | 'production';
    this.providers = {
      wompi: new WompiAdapter({
        publicKey: config.get<string>('WOMPI_PUBLIC_KEY', 'pub_test_default'),
        privateKey: config.get<string>('WOMPI_PRIVATE_KEY', 'prv_test_default'),
        webhookSecret: config.get<string>('WOMPI_WEBHOOK_SECRET', 'wompi_webhook_secret'),
        environment: wompiEnv,
      }),
      placetopay: new PlaceToPayAdapter({
        login: config.get<string>('PLACETOPAY_LOGIN', 'login_test'),
        tranKey: config.get<string>('PLACETOPAY_TRAN_KEY', 'trankey_test'),
        baseURL: config.get<string>('PLACETOPAY_BASE_URL', 'https://test.placetopay.com/redirection'),
        webhookSecret: config.get<string>('PLACETOPAY_WEBHOOK_SECRET', 'placetopay_webhook_secret'),
      }),
    };
  }

  getProvider(name: string): PaymentProviderAdapter {
    const p = this.providers[name];
    if (!p) throw new Error(`Payment provider ${name} no configurado`);
    return p;
  }

  listProviders(): string[] {
    return Object.keys(this.providers);
  }

  /**
   * Elige gateway óptimo + fallback si está bloqueado
   */
  selectBestProvider(amountCOP: number, method: PaymentMethod, preferred?: string): {
    provider: PaymentProviderAdapter;
    name: string;
    reason: string;
    fallbackName?: string;
  } {
    let optimalName: string;
    let reason: string;

    if (preferred && this.providers[preferred]?.supportsMethod(method)) {
      optimalName = preferred;
      reason = 'preferred-user';
    } else {
      const sel = selectOptimalGateway(amountCOP, method);
      optimalName = sel.gateway;
      reason = sel.reason;
    }

    if (this.isBlocked(optimalName)) {
      // usar el otro gateway como fallback
      const fallback = Object.keys(this.providers).find(
        (k) => k !== optimalName && this.providers[k].supportsMethod(method) && !this.isBlocked(k),
      );
      if (fallback) {
        return {
          provider: this.providers[fallback],
          name: fallback,
          reason: `fallback-blocked-primary:${optimalName}`,
          fallbackName: optimalName,
        };
      }
    }

    return {
      provider: this.providers[optimalName],
      name: optimalName,
      reason,
    };
  }

  recordFailure(providerName: string) {
    const now = Date.now();
    const current = this.failures.get(providerName) ?? { count: 0, blockedUntil: 0 };
    const newCount = current.blockedUntil < now ? 1 : current.count + 1;
    this.failures.set(providerName, {
      count: newCount,
      blockedUntil: newCount >= this.FAILURE_THRESHOLD ? now + this.BLOCK_MS : 0,
    });
  }

  recordSuccess(providerName: string) {
    this.failures.delete(providerName);
  }

  private isBlocked(name: string): boolean {
    const f = this.failures.get(name);
    return !!f && f.blockedUntil > Date.now();
  }

  /**
   * Checkout con fallback automático si primer gateway falla
   */
  async createCheckoutWithFallback(input: Parameters<PaymentProviderAdapter['createCheckout']>[0] & {
    amountCOP: number;
    method: PaymentMethod;
    preferredGateway?: string;
  }) {
    const sel = this.selectBestProvider(input.amountCOP, input.method, input.preferredGateway);
    const buildInputFor = (name: string) => ({
      ...input,
      webhookUrl: input.webhookUrl.endsWith(name)
        ? input.webhookUrl
        : input.webhookUrl.replace(/\/?$/, '/') + name,
    });
    let result = await sel.provider.createCheckout(buildInputFor(sel.name));

    if (!result.ok && sel.fallbackName) {
      this.recordFailure(sel.name);
      const fallback = this.providers[sel.fallbackName];
      result = await fallback.createCheckout(buildInputFor(sel.fallbackName));
      if (result.ok) {
        return { gateway: sel.fallbackName, result, viaFallback: true };
      }
    }
    if (result.ok) this.recordSuccess(sel.name);
    else this.recordFailure(sel.name);

    return { gateway: sel.name, result, viaFallback: false };
  }
}
