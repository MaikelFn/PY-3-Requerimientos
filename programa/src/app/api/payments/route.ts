import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { guardarReservaEnArchivo } from '@/lib/reservas';
import { restarCuposTour } from '@/lib/tours';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', description, metadata, reservaData } = await request.json();

    // Validar que el monto sea mayor a 0
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    let reservaId = null;

    // Si hay datos de reserva, crear la reserva con estado pendiente y reservar cupos
    if (reservaData) {
      try {
        await restarCuposTour(reservaData.tourId, reservaData.fecha, reservaData.cantidadCupos);

        const reserva = await guardarReservaEnArchivo({
          tourId: reservaData.tourId,
          usuarioId: reservaData.usuarioId,
          cantidadCupos: reservaData.cantidadCupos,
          fecha: reservaData.fecha,
          estadoReserva: 'pendiente',
        });
        reservaId = reserva.id;
        console.log('Reserva creada con ID:', reservaId);
      } catch (error) {
        console.error('Error al crear reserva:', error);
        // Si no hay cupos suficientes, devolver error específico
        const errorMessage = error instanceof Error ? error.message : 'Error al crear la reserva';
        const status = errorMessage.includes('suficientes cupos') ? 400 : 500;
        return NextResponse.json(
          { error: errorMessage },
          { status }
        );
      }
    } else {
      console.log('No se proporcionaron datos de reserva (reservaData)');
    }

    // Crear un Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      description,
      metadata: {
        ...metadata,
        reservaId: reservaId?.toString() || '',
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('Payment Intent creado con reservaId:', reservaId?.toString() || 'none');

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      reservaId,
    });
  } catch (error) {
    console.error('Error al crear Payment Intent:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}

// GET para obtener el estado de un pago
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'ID del pago no proporcionado' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
    });
  } catch (error) {
    console.error('Error al obtener estado del pago:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado del pago' },
      { status: 500 }
    );
  }
}
