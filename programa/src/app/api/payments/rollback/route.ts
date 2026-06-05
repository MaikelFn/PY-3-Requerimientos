import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { actualizarReserva } from '@/lib/reservas';
import { sumarCuposTour } from '@/lib/tours';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'ID del pago no proporcionado' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const reservaId = paymentIntent.metadata?.reservaId
      ? parseInt(paymentIntent.metadata.reservaId, 10)
      : null;

    if (!reservaId) {
      console.log('No hay reserva asociada para rollback - paymentIntentId:', paymentIntentId);
      return NextResponse.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        message: 'No hay reserva asociada para rollback',
      });
    }

    console.log('Iniciando rollback para reservaId:', reservaId);

    const reserva = await actualizarReserva(reservaId, { estadoReserva: 'cancelada' });

    if (reserva) {
      try {
        console.log(
          `Restaurando ${reserva.cantidadCupos} cupos del tour ${reserva.tourId} para fecha ${reserva.fecha}`
        );
        await sumarCuposTour(reserva.tourId, reserva.fecha, reserva.cantidadCupos);
        console.log('Cupos restaurados exitosamente');
      } catch (error) {
        console.error('Error al restaurar cupos del tour:', error);
        return NextResponse.json(
          {
            error: 'Rollback parcial: reserva cancelada pero no se pudieron restaurar cupos',
            details: error instanceof Error ? error.message : 'Error desconocido',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      reservaId,
      message: 'Rollback completado exitosamente',
    });
  } catch (error) {
    console.error('Error al rollback de pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar el rollback', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
