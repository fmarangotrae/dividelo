'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Mail, Lock, Phone, ArrowRight, ShieldCheck, BadgeCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'EMAIL' | 'PHONE' | 'PASSWORD'>('PASSWORD');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setStep('verify');
  }

  async function handlePasswordLogin() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    router.push('/explore');
  }

  async function handleVerify() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    router.push('/explore');
  }

  return (
    <div className="container-page py-16 max-w-6xl">
      <div className="grid gap-10 md:grid-cols-5 md:items-center">
        <div className="md:col-span-2">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ← Volver
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-gray-600">
            Inicia sesión para ver tus grupos, pagos, wallet y continuar ahorrando.
          </p>
          <div className="mt-8 space-y-3">
            <FeatureRow
              icon={<ShieldCheck className="h-5 w-5 text-brand-500" />}
              title="Pago protegido"
              desc="Todas tus transacciones tienen garantía."
            />
            <FeatureRow
              icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />}
              title="Reputación verificada"
              desc="Sube de nivel siendo puntual y cordial."
            />
            <FeatureRow
              icon={<Sparkles className="h-5 w-5 text-amber-500" />}
              title="Programa de referidos"
              desc="Invita y gana bonos directamente en tu wallet."
            />
          </div>
        </div>

        <div className="card md:col-span-3 p-7 md:p-10">
          <div className="flex flex-wrap gap-2">
            <TabBtn active={method === 'PASSWORD'} onClick={() => { setMethod('PASSWORD'); setStep('request'); }}>
              <Lock className="h-4 w-4" />
              Contraseña
            </TabBtn>
            <TabBtn active={method === 'EMAIL'} onClick={() => { setMethod('EMAIL'); setStep('request'); }}>
              <Mail className="h-4 w-4" />
              Código por email
            </TabBtn>
            <TabBtn active={method === 'PHONE'} onClick={() => { setMethod('PHONE'); setStep('request'); }}>
              <Phone className="h-4 w-4" />
              Código por SMS
            </TabBtn>
          </div>

          {/* ============ MÉTODO PASSWORD ============ */}
          {method === 'PASSWORD' && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input-field mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-800">Contraseña</label>
                  <a href="#" className="text-xs font-semibold text-brand-600 hover:underline">
                    Olvidé mi contraseña
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field mt-2"
                />
              </div>
              <button
                onClick={handlePasswordLogin}
                disabled={loading || !email || !password}
                className="btn-primary w-full mt-2 !py-3"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ============ MÉTODO EMAIL / PHONE - REQUEST ============ */}
          {(method === 'EMAIL' || method === 'PHONE') && step === 'request' && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  {method === 'EMAIL' ? 'Correo electrónico' : 'Celular (+57)'}
                </label>
                <div className="mt-2 flex items-center gap-2">
                  {method === 'PHONE' && (
                    <span className="input-field !w-auto text-sm text-gray-600 select-none">🇨🇴 +57</span>
                  )}
                  <input
                    value={method === 'EMAIL' ? email : phone}
                    onChange={(e) =>
                      method === 'EMAIL' ? setEmail(e.target.value) : setPhone(e.target.value)
                    }
                    placeholder={
                      method === 'EMAIL' ? 'tu@email.com' : '300 123 4567'
                    }
                    className="input-field flex-1"
                  />
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={
                  loading ||
                  (method === 'EMAIL' ? !email : !phone)
                }
                className="btn-primary w-full mt-2 !py-3"
              >
                {loading ? 'Enviando...' : `Enviar código por ${method === 'EMAIL' ? 'email' : 'SMS'}`}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ============ VERIFY OTP ============ */}
          {(method === 'EMAIL' || method === 'PHONE') && step === 'verify' && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa el código de 6 dígitos que enviamos a tu{' '}
                {method === 'EMAIL' ? 'email' : 'celular'}.
              </p>
              <div className="flex gap-2">
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
                    }}
                    className="h-14 w-12 rounded-2xl border border-gray-200 text-center text-2xl font-extrabold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('request')} className="btn-secondary flex-1">
                  Reenviar
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading || otp.length < 6}
                  className="btn-primary flex-1 !py-3"
                >
                  {loading ? 'Verificando...' : 'Ingresar'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/onboarding" className="font-semibold text-brand-600 hover:underline">
              Regístrate gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
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

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white/60 p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-card">
        {icon}
      </div>
      <div>
        <div className="font-bold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{desc}</div>
      </div>
    </div>
  );
}
