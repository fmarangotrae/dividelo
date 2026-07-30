'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const transactionId = searchParams.get('transactionId') || searchParams.get('tx_id');
  const reference = searchParams.get('reference') || searchParams.get('externalReference');
  const amount = searchParams.get('amount');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-lg shadow-xl border-green-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-800">
            ¡Pago Exitoso!
          </CardTitle>
          <CardDescription className="text-green-700 text-lg">
            Tu transacción ha sido procesada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 space-y-2 border border-green-100">
            {transactionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Transacción:</span>
                <span className="font-mono font-medium">{transactionId}</span>
              </div>
            )}
            {reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referencia:</span>
                <span className="font-mono font-medium">{reference}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Monto pagado:</span>
                <span className="font-bold text-green-700">${amount} COP</span>
              </div>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 text-center">
              Hemos enviado un correo con los detalles de tu compra y las instrucciones para acceder a tu suscripción compartida.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              variant="outline" 
              className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-pulse text-green-600 text-xl">Verificando pago...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
