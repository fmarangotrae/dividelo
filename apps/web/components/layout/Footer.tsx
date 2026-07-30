import Link from 'next/link';
import { Sparkles, Instagram, MessageCircle, Mail } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-100 bg-white pb-28">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Dividelo.</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-gray-600">
            Marketplace seguro para compartir tus suscripciones favoritas con personas de
            confianza. Hecho en Colombia 🇨🇴
          </p>
          <div className="mt-4 flex gap-2">
            <a className="chip" href="#" aria-label="Instagram">
              <Instagram className="h-3.5 w-3.5" />
              @dividelo.co
            </a>
            <a className="chip" href="#" aria-label="WhatsApp">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Producto</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/explore" className="hover:text-brand-600">Explorar plazas</Link></li>
            <li><Link href="/onboarding" className="hover:text-brand-600">Vender mis cupos</Link></li>
            <li><Link href="/#precios" className="hover:text-brand-600">Tarifas transparentes</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Ayuda</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href="#" className="hover:text-brand-600">Cómo funciona</a></li>
            <li><a href="#" className="hover:text-brand-600">Política de garantía</a></li>
            <li><a href="#" className="hover:text-brand-600">Centro de ayuda</a></li>
            <li><a href="mailto:hola@dividelo.co" className="hover:text-brand-600 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />hola@dividelo.co</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href="#" className="hover:text-brand-600">Términos y condiciones</a></li>
            <li><a href="#" className="hover:text-brand-600">Política de privacidad (Ley 1581)</a></li>
            <li><a href="#" className="hover:text-brand-600">Política de cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="container-page border-t border-gray-100 pt-6 pb-2 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© {year} Dividelo S.A.S. Todos los derechos reservados.</span>
        <span>NIT · Hecho en Bogotá, Colombia 🇨🇴</span>
      </div>
    </footer>
  );
}
