import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validaciones básicas
    if (!body.listingId || !body.method || !body.guestId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: listingId, method, guestId' },
        { status: 400 }
      );
    }

    // Llamar al backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Si tu backend requiere autenticación, agrega el token aquí
        // 'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar el pago');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en proxy de checkout:', error);
    return NextResponse.json(
      { 
        error: 'No se pudo procesar la solicitud de pago',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
