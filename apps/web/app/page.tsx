import Link from 'next/link';
import { Search, Home as HomeIcon, Users, Shield, CheckCircle2, Sparkles, ArrowRight, PlayCircle, BadgeCheck, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import { ListingCard } from '@/components/listings/ListingCard';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { key: 'STREAMING_VIDEO', label: 'Streaming Video', emoji: '🎬' },
  { key: 'STREAMING_MUSIC', label: 'Música', emoji: '🎵' },
  { key: 'GAMING', label: 'Gaming', emoji: '🎮' },
  { key: 'PRODUCTIVITY', label: 'Productividad', emoji: '⚡' },
  { key: 'SOFTWARE', label: 'Software', emoji: '💻' },
  { key: 'EDUCATION', label: 'Educación', emoji: '📚' },
  { key: 'FITNESS', label: 'Fitness', emoji: '🏋️' },
];

async function getFeaturedListings() {
  try {
    const res = await apiFetch<{ listings: any[] }>('/marketplace/listings?limit=8&sort=newest');
    return res.listings ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedListings();

  return (
    <div>
      {/* ============= HERO DUAL (Anfitrión / Huésped) ============= */}
      <section className="gradient-hero">
        <div className="container-page py-16 lg:py-24">
          <div className="flex items-center gap-2">
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Nuevo en Colombia · Pagos con Nequi + PSE
            </span>
            <span className="hidden badge bg-gray-100 text-gray-700 border border-gray-200 sm:inline-flex">
              100% legal · Términos de uso claros
            </span>
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Ahorra hasta <span className="text-brand-500">75%</span> en tus suscripciones
                favoritas.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-gray-600">
                <span className="font-semibold text-gray-900">Compra plazas verificadas</span> en
                suscripciones multiusuario (Netflix, Spotify, Disney+, Prime Video y más), o
                <span className="font-semibold text-gray-900"> reduce tu cuota mensual</span> al
                compartir tus cupos libres. Garantía de acceso o te devolvemos el dinero.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/explore" className="btn-primary text-base !px-6 !py-3">
                  <Search className="h-5 w-5" />
                  Explorar plazas — sin registro
                </Link>
                <Link href="/onboarding" className="btn-secondary text-base !px-6 !py-3">
                  <HomeIcon className="h-5 w-5" />
                  Vender mis cupos
                </Link>
                <a href="#como-funciona" className="btn-ghost text-base">
                  <PlayCircle className="h-5 w-5" />
                  Ver cómo funciona
                </a>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                  <div className="text-2xl font-extrabold text-brand-500">75%</div>
                  <div className="mt-1 text-xs text-gray-600">Ahorro máximo huésped</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                  <div className="text-2xl font-extrabold text-brand-500">$0</div>
                  <div className="mt-1 text-xs text-gray-600">Cuota neta posible (anfitrión)</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
                  <div className="text-2xl font-extrabold text-emerald-600">48h</div>
                  <div className="mt-1 text-xs text-gray-600">Solución disputa máxima</div>
                </div>
              </div>
            </div>

            {/* ================== DUAL CTA (Anfitrión vs Huésped) ================== */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Link
                href="/explore"
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="absolute right-4 top-4 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                  Sin registro →
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">Soy Huésped</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Busco una plaza económica en una suscripción.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Pago protegido: sin acceso → 100% de vuelta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Paga con Nequi, PSE, Daviplata o tarjeta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Anfitriones verificados con reputación</span>
                  </li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  Ver plazas disponibles <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <Link
                href="/onboarding"
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-hover"
              >
                <div className="absolute right-4 top-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Gana dinero ↗
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <HomeIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">Soy Anfitrión</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Tengo cupos libres y quiero reducir mi cuota mensual.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Cobro automático cada mes sin impagos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Retira a Nequi o cuenta bancaria cuando quieras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>Markup 0-10% y herramientas de gestión</span>
                  </li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:gap-2 transition-all">
                  Publicar mis cupos <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============= CATEGORÍAS ============= */}
      <section className="container-page py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Explora por categoría</h2>
            <p className="mt-1 text-gray-600">Encuentra la plaza ideal según lo que buscas.</p>
          </div>
          <Link href="/explore" className="btn-secondary">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/explore?category=${c.key}`}
              className="card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-hover"
            >
              <div className="text-3xl">{c.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============= DESTACADOS ============= */}
      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Plazas recién publicadas</h2>
            <p className="mt-1 text-gray-600">
              <Sparkles className="mr-1 inline h-4 w-4 text-amber-500" />
              Seleccionadas de anfitriones con reputación verificada.
            </p>
          </div>
          <Link href="/explore" className="btn-ghost">
            Explorar todas →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length ? (
            featured.map((l: any) => <ListingCard key={l.id} listing={l} />)
          ) : (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card p-5 opacity-80">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                  <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* ============= CÓMO FUNCIONA ============= */}
      <section id="como-funciona" className="bg-white py-16">
        <div className="container-page">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Funciona en 3 pasos, sin sorpresas
            </h2>
            <p className="mt-2 text-gray-600">
              Simple para huéspedes, automático para anfitriones.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: 1,
                title: 'Encuentra o publica una plaza',
                text: 'Busca por servicio, precio o reputación. Si eres anfitrión, define cupos y precio.',
                icon: <Search className="h-6 w-6" />,
                color: 'bg-brand-50 text-brand-600',
              },
              {
                n: 2,
                title: 'Pago seguro y protegido',
                text: 'Paga con Nequi/PSE — el dinero queda en garantía hasta que confirmes acceso.',
                icon: <Shield className="h-6 w-6" />,
                color: 'bg-emerald-50 text-emerald-700',
              },
              {
                n: 3,
                title: 'Accede o cobra automáticamente',
                text: 'Huésped disfruta. Anfitrión retira a Nequi o cuenta bancaria en cualquier momento.',
                icon: <Wallet className="h-6 w-6" />,
                color: 'bg-blue-50 text-blue-700',
              },
            ].map((s) => (
              <div key={s.n} className="card p-7">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.color}`}>
                  {s.icon}
                </div>
                <div className="mt-4 text-sm font-semibold text-gray-400">Paso {s.n}</div>
                <h3 className="mt-1 text-xl font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= PRECIOS ============= */}
      <section id="precios" className="container-page py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Tarifas transparentes</h2>
          <p className="mt-2 text-gray-600">
            Sin costos ocultos. Solo pagas cuando usas la plataforma.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Huésped',
              price: '9% + $1.200',
              desc: 'Sobre el valor de la cuota base. Incluye protección de pago.',
              tag: 'Cada transacción',
              list: [
                'Protección de acceso 100%',
                'Múltiples métodos de pago',
                'Soporte 24/7',
                'Sin costo fijo mensual',
              ],
              highlight: false,
              cta: 'Ver plazas',
              href: '/explore',
            },
            {
              title: 'Anfitrión Básico',
              price: '$0',
              desc: 'Gratis para siempre. Sin tarifas para publicar.',
              tag: 'Recomendado para empezar',
              list: [
                'Publica hasta 1 suscripción',
                'Cobro automático mensual',
                'Retiros sin costo a Nequi',
                'Soporte por email',
              ],
              highlight: true,
              cta: 'Empezar gratis',
              href: '/onboarding',
            },
            {
              title: 'Anfitrión Pro',
              price: '$9.900/mes',
              desc: 'Ideal si compartes 2+ suscripciones activamente.',
              tag: 'Power Host',
              list: [
                'Publicación ilimitada',
                'Listings destacados (2 gratis/mes)',
                'Retiros expeditos sin costo',
                'Soporte prioritario WhatsApp',
              ],
              highlight: false,
              cta: 'Activar Pro',
              href: '/onboarding?pro=1',
            },
          ].map((p) => (
            <div key={p.title} className="card p-7">
              {p.tag && (
                <span className={`badge ${p.highlight ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-700'}`}>
                  {p.tag}
                </span>
              )}
              <h3 className="mt-3 text-xl font-bold text-gray-900">{p.title}</h3>
              <div className="mt-2 text-3xl font-extrabold text-gray-900">{p.price}</div>
              <p className="mt-1 text-sm text-gray-600">{p.desc}</p>
              <ul className="mt-5 space-y-2">
                {p.list.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span className="text-gray-700">{i}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-7 w-full ${p.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
