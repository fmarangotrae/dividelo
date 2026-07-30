'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ChevronDown, ChevronUp, Wallet, CreditCard, Smartphone, Building2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import type { PaymentMethod } from '@dividelo/db';
import { FEES } from '@dividelo/shared';

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
  recommended?: boolean;
}> = [
  {
    id: 'NEQUI',
    label: 'Nequi',
    desc: 'Pago instantáneo desde tu celular',
    icon: <Smartphone className="h-5 w-5" />,
    recommended: true,
  },
  {
    id: 'PSE',
    label: 'PSE',
    desc: 'Pago por PSE con cualquier banco',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 'CREDIT_CARD',
    label: 'Tarjeta crédito / débito',
    desc: 'Visa, Mastercard, American Express',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'DAVIPLATA',
    label: 'Daviplata',
    desc: 'Pago con billetera Davivienda',
    icon: <Wallet className="h-5 w-5" />,
  },
];

type Detail = {
  id: string;
  baseSlotPriceCOP: number;
  markupPercent: number;
  pricingByMethod: Record<string, any>;
};

export function PriceBreakdown({ listingId, detail }: { listingId: string; detail: Detail }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>('NEQUI');
  const [expand, setExpand] = useState(true);
  const [loading, setLoading] = useState(false);

  const pricing =
    detail.pricingByMethod?.[method] ??
    detail.pricingByMethod?.['NEQUI'] ?? {
      baseSlotPriceCOP: Number(detail.baseSlotPriceCOP),
      markupCOP: 0,
      platformFeePercent: FEES.DEFAULT_PLATFORM_FEE_PERCENT,
      platformFeeCOP: 0,
      fixedFeeCOP: FEES.DEFAULT_FIXED_FEE_COP,
      totalGuestPriceCOP: Number(detail.baseSlotPriceCOP),
    };

  const total = pricing.totalGuestPriceCOP ?? 0;

  async function handleReserve() {
    setLoading(true);
    // redirige a login/onboarding si no hay sesión, o al flujo de checkout confirmado
    setTimeout(() => {
      router.push(`/checkout?listingId=${listingId}&method=${method}`);
      setLoading(false);
    }, 300);
  }

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white">
        <div className="text-xs font-medium uppercase tracking-wider text-brand-100">
          Tu plaza · Mensual
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight">{formatCOP(total)}</span>
          <span className="text-sm text-brand-100">/ mes</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-brand-100">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pago protegido + garantía de acceso
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Métodos de pago */}
        <div>
          <div className="text-sm font-semibold text-gray-900">Método de pago</div>
          <div className="mt-3 space-y-2">
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                    active
                      ? 'border-brand-400 bg-brand-50/70 ring-2 ring-brand-100'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      active ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {m.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      {m.label}
                      {m.recommended && (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 !text-[10px]">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-gray-500">{m.desc}</div>
                  </div>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition',
                      active ? 'border-brand-500 bg-brand-500' : 'border-gray-300',
                    )}
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" className="h-full w-full text-white">
                        <path
                          fill="currentColor"
                          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desglose expandible */}
        <div>
          <button
            onClick={() => setExpand((e) => !e)}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
          >
            <span>Desglose transparente</span>
            {expand ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expand && (
            <div className="mt-3 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm">
              <Row label="Cuota base anfitrión" value={formatCOP(pricing.baseSlotPriceCOP)} />
              {pricing.markupCOP > 0 && (
                <Row
                  label={`Markup anfitrión (${detail.markupPercent}%)`}
                  value={formatCOP(pricing.markupCOP)}
                  info="Compensación por gestión"
                />
              )}
              <Row
                label={`Protección plataforma (${pricing.platformFeePercent}%)`}
                value={formatCOP(pricing.platformFeeCOP)}
                info="Incluye garantía + soporte + seguro"
              />
              <Row
                label="Tarifa fija transacción"
                value={formatCOP(pricing.fixedFeeCOP)}
              />
              <div className="my-2 border-t border-gray-200" />
              <Row
                label="Costo pasarela (estimado)"
                value={formatCOP(pricing.gatewayFeeCOP ?? 0)}
                muted
              />
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white p-3 border border-gray-200">
                <span className="text-sm font-semibold text-gray-900">Total a pagar hoy</span>
                <span className="text-lg font-extrabold text-brand-600">{formatCOP(total)}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Sin sorpresas. Este es el valor final que cobraremos hoy. Renovación automática
                  mensual, cancelable cuando quieras.
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          disabled={loading}
          onClick={handleReserve}
          className="btn-primary w-full !py-3 text-base"
        >
          {loading ? 'Procesando...' : 'Reservar mi cupo y pagar'}
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="text-center text-xs text-gray-500">
          Al reservar, aceptas los <a className="text-gray-700 underline" href="#">Términos</a> y{' '}
          <a className="text-gray-700 underline" href="#">Política de protección</a>.
        </div>

        {/* Callout: sin cuenta todavía */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-900">
              <div className="font-semibold">¿Aún no tienes cuenta?</div>
              <div className="mt-1">
                Te guiaremos para crearla en 1 minuto después del pago. Tu cupo queda reservado
                inmediatamente.
              </div>
              <Link href="/onboarding" className="mt-2 inline-flex font-semibold text-amber-800 underline">
                Prefiero registrarme antes →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  info,
}: {
  label: string;
  value: string;
  muted?: boolean;
  info?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className={cn('text-xs', muted ? 'text-gray-500' : 'text-gray-700')}>
        <div className="font-medium">{label}</div>
        {info && <div className="text-gray-400 italic">{info}</div>}
      </div>
      <div className={cn('font-semibold', muted ? 'text-gray-500' : 'text-gray-900')}>{value}</div>
    </div>
  );
}
