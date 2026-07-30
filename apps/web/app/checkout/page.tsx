'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const listingId = searchParams.get('listingId');
        const method = searchParams.get('method');
        const guestId = searchParams.get('guestId');

        if (!listingId || !method || !guestId) {
          throw new Error('Faltan parámetros requeridos para el pago');
        }

        // Llamar al API route proxy
        const response = await fetch('/api/payments/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            method,
            guestId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al procesar el pago');
        }

        // Redirigir al gateway de pago (Wompi o PlaceToPay)
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('No se recibió URL de redirección del gateway');
        }
      } catch (err) {
        console.error('Error en checkout:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Procesando tu pago...</h2>
              <p className="text-muted-foreground text-center">
                Te estamos redirigiendo a la pasarela de pago segura
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Error en el pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.back()} variant="outline">
                Volver
              </Button>
              <Button onClick={() => window.location.reload()}>
                Intentar de nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
