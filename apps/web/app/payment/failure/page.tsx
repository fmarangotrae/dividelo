'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, RefreshCw, ArrowLeft, Headphones } from 'lucide-react';

function FailureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const errorCode = searchParams.get('errorCode') || searchParams.get('error_code');
  const errorMessage = searchParams.get('errorMessage') || searchParams.get('error_message');
  const reference = searchParams.get('reference') || searchParams.get('externalReference');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-lg shadow-xl border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-800">
            Pago No Procesado
          </CardTitle>
          <CardDescription className="text-red-700 text-lg">
            Hubo un problema con tu transacción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="bg-white rounded-lg p-4 border border-red-100">
              <p className="text-sm text-red-800 text-center font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          {reference && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-700">Referencia:</span>
                <span className="font-mono text-sm font-medium text-red-900">{reference}</span>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-yellow-800 text-sm">Posibles causas:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Fondos insuficientes en tu cuenta</li>
              <li>Datos de la tarjeta incorrectos</li>
              <li>La tarjeta no permite compras en línea</li>
              <li>Límite de transacciones excedido</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-50"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <Button 
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                size="lg"
              >
                <Headphones className="mr-2 h-4 w-4" />
                Soporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="animate-pulse text-red-600 text-xl">Cargando información...</div>
      </div>
    }>
      <FailureContent />
    </Suspense>
  );
}
