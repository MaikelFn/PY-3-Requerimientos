import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'ID del pago no proporcionado' },
        { status: 400 }
      );
    }

    // Confirmar el Payment Intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
    });

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error al confirmar el pago:', error);
    return NextResponse.json(
      { error: 'Error al confirmar el pago' },
      { status: 500 }
    );
  }
}
