import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook handler for payment gateways (Wompi, PlaceToPay)
 * This route receives notifications from payment providers and forwards them to the backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = request.headers.get('x-payment-provider') || 'unknown';
    
    console.log(`[Webhook] Received webhook from ${provider}:`, body);

    // Validar que venga del proveedor correcto (implementar según cada gateway)
    // Wompi: validar firma con X-Idempotency-Key y signature
    // PlaceToPay: validar signature con llave privada
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Reenviar al backend para procesamiento
    const response = await fetch(`${backendUrl}/api/payments/webhooks/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Webhook] Backend returned error:`, result);
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint para debugging (solo en desarrollo)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  return NextResponse.json({ 
    message: 'Webhook endpoint is active',
    instructions: 'Send POST requests with payment provider data'
  });
}
