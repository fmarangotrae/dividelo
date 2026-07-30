'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home as HomeIcon,
  Users,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Wallet,
  Phone,
  Mail,
  User,
  Lock,
  BadgeCheck,
  Share2,
  DollarSign,
  Search,
  Star,
} from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import { FEES } from '@dividelo/shared';

type Step = 0 | 1 | 2 | 3;
type Role = 'HOST' | 'GUEST' | 'BOTH';

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pro = params.get('pro') === '1';

  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [contact, setContact] = useState<{ method: 'PHONE' | 'EMAIL'; value: string }>({
    method: 'PHONE',
    value: '',
  });
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState({ name: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);

  function continueAfterRole() {
    if (!role) return;
    setStep(1);
  }

  async function sendOtp() {
    if (!contact.value) return;
    setLoading(true);
    // TODO: llamar endpoint real auth/send-otp
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep(2);
  }

  async function verifyOtp() {
    if (otp.length < 6) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setStep(3);
  }

  async function finish() {
    if (!profile.name || !profile.password || profile.password !== profile.password2) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    router.push(role === 'HOST' || role === 'BOTH' ? '/dashboard/host' : '/explore');
  }

  return (
    <div className="container-page max-w-5xl py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      {/* Stepper */}
      <div className="mt-6 hidden sm:flex items-center gap-3 text-xs">
        {['Elige tu rol', 'Identifícate', 'Verifica', 'Crea tu perfil'].map((t, i) => (
          <div key={t} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                i <= step
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-500',
              )}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(i <= step ? 'font-semibold text-gray-900' : 'text-gray-500')}
            >
              {t}
            </span>
            {i < 3 && <div className="h-px w-10 bg-gray-200" />}
          </div>
        ))}
      </div>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Crea tu cuenta en menos de 2 minutos
      </h1>
      <p className="mt-2 text-gray-600">
        Podrás ser anfitrión, huésped o ambos. Todo con la misma cuenta.
      </p>

      {/* ========== Paso 0: Elegir rol ========== */}
      {step === 0 && (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <RoleCard
            title="Soy Huésped"
            subtitle="Busco plazas económicas"
            icon={<Users className="h-7 w-7" />}
            iconBg="bg-brand-50 text-brand-500"
            active={role === 'GUEST'}
            onClick={() => setRole('GUEST')}
            bullets={[
              'Ahorra hasta 75% en Netflix, Spotify, Disney+',
              'Pago con Nequi, PSE, Daviplata o tarjeta',
              'Garantía de acceso o dinero de vuelta',
              'Renovación automática cancelable',
            ]}
          />
          <RoleCard
            title="Soy Anfitrión"
            subtitle="Tengo cupos libres para compartir"
            icon={<HomeIcon className="h-7 w-7" />}
            iconBg="bg-emerald-50 text-emerald-700"
            active={role === 'HOST'}
            onClick={() => setRole('HOST')}
            recommended
            bullets={[
              `Cuota neta puede quedar en $0 (¡gratis!)`,
              'Cobro automático cada mes sin impagos',
              'Retira tus ganancias a Nequi o banco',
              'Markup controlado 0-10% por gestión',
            ]}
          />
          <div className="md:col-span-2">
            <RoleCard
              title="Ambos roles"
              subtitle="Soy anfitrión en unas y huésped en otras"
              icon={<Star className="h-7 w-7" />}
              iconBg="bg-amber-50 text-amber-600"
              active={role === 'BOTH'}
              onClick={() => setRole('BOTH')}
              bullets={[
                'Un solo perfil, múltiples posibilidades',
                'Gana compartiendo y ahorra uniéndote',
                'Reputación unificada en ambos roles',
              ]}
            />
          </div>
        </div>
      )}

      {/* ========== Paso 1: Contacto ========== */}
      {step === 1 && (
        <div className="mt-10 grid gap-8 md:grid-cols-5">
          <div className="card md:col-span-3 p-7">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Paso 2 · Identifícate
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              ¿Cómo prefieres que te contactemos?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Usaremos esto para verificarte y enviarte alertas importantes (pagos, cupos, etc).
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <TabBtn
                active={contact.method === 'PHONE'}
                onClick={() => setContact((c) => ({ ...c, method: 'PHONE' }))}
              >
                <Phone className="h-4 w-4" />
                Celular
              </TabBtn>
              <TabBtn
                active={contact.method === 'EMAIL'}
                onClick={() => setContact((c) => ({ ...c, method: 'EMAIL' }))}
              >
                <Mail className="h-4 w-4" />
                Email
              </TabBtn>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-800">
                {contact.method === 'PHONE' ? 'Número de celular (WhatsApp)' : 'Correo electrónico'}
              </label>
              <div className="mt-2 flex items-center gap-2">
                {contact.method === 'PHONE' && (
                  <div className="input-field !w-auto flex items-center gap-2 text-sm text-gray-700 select-none">
                    🇨🇴 +57
                  </div>
                )}
                <input
                  className="input-field flex-1"
                  placeholder={
                    contact.method === 'PHONE' ? '300 123 4567' : 'tu@email.com'
                  }
                  value={contact.value}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, value: e.target.value }))
                  }
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <Shield className="mr-1 inline h-3.5 w-3.5" />
                Tus datos están protegidos y nunca los compartiremos. Cumplimos Ley 1581/2012.
              </p>
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                onClick={sendOtp}
                disabled={loading || !contact.value}
                className="btn-primary"
              >
                {loading ? 'Enviando...' : 'Enviar código de verificación'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right panel - resumen */}
          <div className="md:col-span-2 space-y-4">
            <SummaryRole role={role!} />
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                <h4 className="font-bold text-gray-900">Por qué verificamos</h4>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Evitamos fraude y cuentas duplicadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Te notificamos antes de cada cobro</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>Recuperas tu cuenta si olvidas la clave</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========== Paso 2: Verificar OTP ========== */}
      {step === 2 && (
        <div className="mt-10 grid gap-8 md:grid-cols-5">
          <div className="card md:col-span-3 p-7">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Paso 3 · Verificación
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              Ingresa el código de 6 dígitos
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Lo enviamos a{' '}
              <span className="font-semibold text-gray-900">
                {contact.method === 'PHONE' ? `+57 ${contact.value}` : contact.value}
              </span>
              . Si no llega en 60 segundos, puedes reenviarlo.
            </p>

            <div className="mt-6 flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  maxLength={1}
                  value={otp[i] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split('');
                    arr[i] = val;
                    setOtp(arr.slice(0, 6).join(''));
                    if (val && i < 5) {
                      const next = document.querySelector<HTMLInputElement>(
                        `input[data-idx="${i + 1}"]`,
                      );
                      next?.focus();
                    }
                  }}
                  data-idx={i}
                  className="h-14 w-12 rounded-2xl border border-gray-200 text-center text-2xl font-extrabold tracking-wider outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              ))}
            </div>

            <div className="mt-5 text-sm text-gray-500">
              ¿No llegó el código?{' '}
              <a className="font-semibold text-brand-600 hover:underline" href="#">
                Reenviar (1:00)
              </a>
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="btn-primary"
              >
                {loading ? 'Verificando...' : 'Verificar y continuar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <SummaryRole role={role!} />
            <div className="card p-5 border-emerald-200 bg-emerald-50/40">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Tip seguridad
              </div>
              <p className="mt-1 text-sm text-emerald-900">
                Nunca compartas este código con nadie. El equipo de Dividelo nunca te lo pedirá
                por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== Paso 3: Crear perfil ========== */}
      {step === 3 && (
        <div className="mt-10 grid gap-8 md:grid-cols-5">
          <div className="card md:col-span-3 p-7">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Paso 4 · Tu perfil
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
              Personaliza tu cuenta
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Solo te faltan estos datos para empezar.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-800">
                  <User className="mr-1 inline h-4 w-4" /> Nombre público
                </label>
                <input
                  className="input-field mt-2"
                  placeholder="Ej: Camilo R."
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  <Lock className="mr-1 inline h-4 w-4" /> Contraseña
                </label>
                <input
                  type="password"
                  className="input-field mt-2"
                  placeholder="Mínimo 8 caracteres"
                  value={profile.password}
                  onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  <Lock className="mr-1 inline h-4 w-4" /> Confirmar
                </label>
                <input
                  type="password"
                  className="input-field mt-2"
                  placeholder="Repite la contraseña"
                  value={profile.password2}
                  onChange={(e) => setProfile((p) => ({ ...p, password2: e.target.value }))}
                />
              </div>
            </div>

            {pro && (
              <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-500" />
                  <h4 className="font-bold text-gray-900">Activar plan Pro Anfitrión</h4>
                  <span className="badge bg-white text-brand-600 ml-auto">
                    {formatCOP(FEES.PRO_HOST_MONTHLY_FEE_COP)}/mes
                  </span>
                </div>
                <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />Markup 0-20%</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />Destacados en categoría</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />Payout instantáneo</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-600" />Soporte WhatsApp</li>
                </ul>
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                onClick={finish}
                disabled={
                  loading ||
                  !profile.name ||
                  !profile.password ||
                  profile.password !== profile.password2
                }
                className="btn-primary"
              >
                {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <SummaryRole role={role!} />
            <div className="card p-5">
              <h4 className="font-bold text-gray-900">Tu cuenta incluye</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 text-gray-500" /><span>Wallet interna con 3 bolsillos (disponible, pendiente, bloqueado)</span></li>
                <li className="flex items-start gap-2"><Wallet className="mt-0.5 h-4 w-4 text-gray-500" /><span>Retiros a Nequi y cuenta bancaria</span></li>
                <li className="flex items-start gap-2"><Share2 className="mt-0.5 h-4 w-4 text-gray-500" /><span>Chat con anfitrión/huésped</span></li>
                <li className="flex items-start gap-2"><DollarSign className="mt-0.5 h-4 w-4 text-gray-500" /><span>Programa de referidos con bono en wallet</span></li>
                <li className="flex items-start gap-2"><Search className="mt-0.5 h-4 w-4 text-gray-500" /><span>Acceso anticipado a nuevas plazas</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      {step === 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">
              Inicia sesión
            </Link>
          </div>
          <button
            disabled={!role}
            onClick={continueAfterRole}
            className="btn-primary !px-6 !py-3 text-base"
          >
            Continuar con el registro <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function RoleCard({
  title,
  subtitle,
  icon,
  iconBg,
  active,
  onClick,
  bullets,
  recommended,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  active: boolean;
  onClick: () => void;
  bullets: string[];
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-3xl border-2 bg-white p-6 text-left transition-all hover:-translate-y-0.5',
        active
          ? 'border-brand-500 shadow-hover'
          : 'border-gray-100 hover:border-gray-200 shadow-card',
      )}
    >
      {recommended && (
        <span className="absolute right-4 top-4 badge bg-brand-500 text-white">
          ★ Recomendado
        </span>
      )}
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl transition',
          iconBg,
          active && 'scale-105',
        )}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-sm font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
        Seleccionar →
      </div>
    </button>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
      )}
    >
      {children}
    </button>
  );
}

function SummaryRole({ role }: { role: Role }) {
  const info =
    role === 'HOST'
      ? {
          label: 'Tu plan: Anfitrión',
          tag: 'Ganar dinero + ahorrar',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <HomeIcon className="h-5 w-5" />,
        }
      : role === 'GUEST'
      ? {
          label: 'Tu plan: Huésped',
          tag: 'Ahorra hasta 75%',
          color: 'bg-brand-50 text-brand-700 border-brand-200',
          icon: <Users className="h-5 w-5" />,
        }
      : {
          label: 'Tu plan: Ambos roles',
          tag: 'Máxima flexibilidad',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Star className="h-5 w-5" />,
        };
  return (
    <div className={`card border p-5 ${info.color}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
          {info.icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80">{info.tag}</div>
          <div className="font-bold">{info.label}</div>
        </div>
      </div>
    </div>
  );
}
