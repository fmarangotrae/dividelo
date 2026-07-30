'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/explore', label: 'Explorar plazas' },
    { href: '/#como-funciona', label: 'Cómo funciona' },
    { href: '/#precios', label: 'Tarifas' },
    { href: '/onboarding', label: 'Vender mis cupos', highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-gray-900">
              Dividelo<span className="text-brand-500">.</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Comparte · Ahorra
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium transition',
                n.highlight
                  ? 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                  : 'text-gray-700 hover:bg-gray-100',
                pathname === n.href && !n.highlight && 'bg-gray-100 text-gray-900',
              )}
            >
              {n.label}
              {n.highlight && <span className="ml-1">→</span>}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/auth/login" className="btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/onboarding" className="btn-primary">
            <Shield className="h-4 w-4" />
            Empezar gratis
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Menú"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-medium',
                  n.highlight ? 'bg-brand-50 text-brand-600' : 'text-gray-800 hover:bg-gray-50',
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-secondary">
                Iniciar sesión
              </Link>
              <Link href="/onboarding" onClick={() => setOpen(false)} className="btn-primary">
                Empezar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
