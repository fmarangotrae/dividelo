import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, formatCOP } from '@/lib/utils';
import { BadgeCheck, CheckCircle2, Users, Clock, Info, ShieldCheck, Handshake, Sparkles } from 'lucide-react';
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

export default async function ListingDetailPage({ params }: Params) {
  let detail: any = null;
  try {
    detail = await apiFetch(`/marketplace/listings/${params.id}`);
  } catch {
    return notFound();
  }
  if (!detail) return notFound();

  const officialPrice = detail.planOfficialPriceCOP ?? 0;
  const savingsPercent = Math.round((detail.guestSavingsPercent ?? 0) * 100);

  const occupied = detail.totalSlots - detail.availableSlots;

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/explore" className="text-gray-500 hover:text-gray-900">
          ← Volver a plazas
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ============ IZQUIERDA ============ */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {detail.subscriptionService.category.replaceAll('_', ' ')}
                </div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                  {detail.subscriptionService.name} {detail.planName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {detail.availableSlots} cupos disponibles de {detail.totalSlots} totales
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Facturación mensual
                  </span>
                  {savingsPercent > 0 && (
                    <>
                      <span>·</span>
                      <span className="badge bg-brand-50 text-brand-600 border border-brand-200">
                        Ahorras {savingsPercent}% vs plan individual
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Precio individual</div>
                <div className="text-sm text-gray-500 line-through">{formatCOP(officialPrice)}</div>
              </div>
            </div>

            {/* Barra cupos */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{occupied} ocupados</span>
                <span>{detail.availableSlots} disponibles</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
                  style={{ width: `${(occupied / detail.totalSlots) * 100}%` }}
                />
              </div>
            </div>

            {/* Anfitrión */}
            <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-extrabold text-lg text-gray-800 shadow-card">
                    {detail.host.name?.charAt(0) ?? 'A'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {detail.host.name ?? 'Anfitrión verificado'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>Score reputación: <b className="text-gray-900">{detail.host.reputationScore}/100</b></span>
                      <span>·</span>
                      <span>{detail.host.successfulTransactions ?? 0} operaciones exitosas</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(detail.hostBadges ?? []).map((b: string) => (
                    <span
                      key={b}
                      className="badge bg-white text-gray-800 border border-gray-200"
                    >
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {b.replaceAll('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 border border-gray-100">
                  <div className="text-gray-500">Antigüedad</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {new Date(detail.host.createdAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 border border-gray-100">
                  <div className="text-gray-500">KYC Verificación</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {detail.host.kyc?.status ?? 'Nivel 1'}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 border border-gray-100">
                  <div className="text-gray-500">Tasa éxito</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {Math.round(((detail.host.successfulTransactions ?? 0) / Math.max(1, detail.host.totalTransactions ?? 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción y reglas */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Info className="h-4 w-4 text-brand-500" />
                  Qué incluye esta plaza
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Acceso al perfil correspondiente del plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Uso personal conforme a T&C del proveedor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Protección de pago durante 48h</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Renovación automática mensual (cancelable)</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Handshake className="h-4 w-4 text-emerald-600" />
                  Instrucciones del anfitrión
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                  {detail.customInstructions ??
                    'Una vez confirmes el pago, podrás acceder al chat con el anfitrión, quien te compartirá los datos de acceso en menos de 2 horas. Si necesitas ajustes de perfil, coordínalos directamente.'}
                </p>
              </div>
            </div>
          </div>

          {/* ============= GARANTÍAS ============= */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <ShieldCheck className="h-7 w-7 text-brand-500" />
              <h4 className="mt-3 font-bold text-gray-900">Pago protegido</h4>
              <p className="mt-1 text-sm text-gray-600">
                El dinero se retiene hasta que confirmes que tienes acceso.
              </p>
            </div>
            <div className="card p-5">
              <Clock className="h-7 w-7 text-amber-500" />
              <h4 className="mt-3 font-bold text-gray-900">Resolución rápida</h4>
              <p className="mt-1 text-sm text-gray-600">
                Si tienes inconvenientes, resolvemos tu disputa en máximo 48h.
              </p>
            </div>
            <div className="card p-5">
              <Sparkles className="h-7 w-7 text-emerald-600" />
              <h4 className="mt-3 font-bold text-gray-900">Anfitrión verificado</h4>
              <p className="mt-1 text-sm text-gray-600">
                KYC + reputación para garantizar confianza en cada transacción.
              </p>
            </div>
          </div>
        </div>

        {/* ============ DERECHA: CHECKOUT STICKY ============ */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <PriceBreakdown listingId={detail.id} detail={detail} />
        </aside>
      </div>
    </div>
  );
}
