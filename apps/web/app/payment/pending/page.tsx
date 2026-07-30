'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Mail, RefreshCw } from 'lucide-react';

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const reference = searchParams.get('reference') || searchParams.get('externalReference');
  const method = searchParams.get('method');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg shadow-xl border-blue-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-blue-800">
            Pago Pendiente de Confirmación
          </CardTitle>
          <CardDescription className="text-blue-700 text-lg">
            Tu transacción está siendo procesada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reference && (
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Referencia:</span>
                <span className="font-mono text-sm font-medium text-blue-900">{reference}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ¿Qué está pasando?
            </h4>
            <p className="text-sm text-blue-700">
              Algunos métodos de pago (como PSE o transferencias bancarias) requieren tiempo adicional para confirmarse. 
              Esto puede tomar desde unos minutos hasta 24 horas hábiles.
            </p>
          </div>

          {method && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Método de pago:</span>
                <span className="font-medium text-sm text-indigo-900 capitalize">{method}</span>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 text-sm">Te notificaremos</h4>
                <p className="text-sm text-green-700">
                  En cuanto se confirme tu pago, recibirás un correo electrónico con los detalles de acceso a tu suscripción compartida.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Ir al Dashboard
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar estado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-pulse text-blue-600 text-xl">Cargando información...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
