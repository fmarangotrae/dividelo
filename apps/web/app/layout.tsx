import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { TrustBar } from '@/components/layout/TrustBar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Dividelo — Comparte suscripciones y ahorra hasta 75%',
  description:
    'Conectamos personas con cupos libres en suscripciones multiusuario (Netflix, Spotify, Disney+, etc). Pagos locales Nequi y PSE. Garantía o te devolvemos tu dinero.',
  keywords: [
    'compartir netflix colombia',
    'spotify familiar barato',
    'dividir suscripciones',
    'plazas netflix',
    'ahorrar suscripciones',
  ],
  openGraph: {
    title: 'Dividelo — Ahorra hasta 75% en tus suscripciones',
    description:
      'Marketplace seguro para compartir suscripciones. Paga con Nequi, PSE o tarjeta. Garantía de acceso.',
    type: 'website',
    locale: 'es_CO',
  },
};

export const viewport: Viewport = {
  themeColor: '#ED3B5B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className="min-h-screen text-gray-900">
        <Navbar />
        <main className="pb-28">{children}</main>
        <TrustBar />
        <Footer />
      </body>
    </html>
  );
}
