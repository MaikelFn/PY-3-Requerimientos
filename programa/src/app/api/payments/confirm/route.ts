import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { actualizarReserva, obtenerReservaById } from '@/lib/reservas';
import { guardarFacturaEnArchivo } from '@/lib/facturas';
import { obtenerTourById } from '@/lib/tours';
import { obtenerDestinoById } from '@/lib/destinos';
import { obtenerUsuarioById } from '@/lib/usuarios';

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'ID del pago no proporcionado' },
        { status: 400 }
      );
    }

    // Obtener el Payment Intent (sin confirmarlo de nuevo)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Si el pago fue exitoso y hay una reserva asociada
    if (paymentIntent.status === 'succeeded' && paymentIntent.metadata.reservaId) {
      const reservaId = parseInt(paymentIntent.metadata.reservaId, 10);
      
      try {
        // Actualizar la reserva a confirmada
        const reserva = await actualizarReserva(reservaId, { estadoReserva: 'confirmada' });
        
        if (reserva) {
          // Obtener información del tour para generar la factura
          const tour = await obtenerTourById(reserva.tourId);
          
          if (tour) {
            // Obtener información del destino
            const destino = await obtenerDestinoById(tour.destinoId);
            
            // Obtener información del usuario
            const usuario = await obtenerUsuarioById(reserva.usuarioId);
            
            // Calcular monto total (cantidad de cupos * precio)
            const montoTotal = reserva.cantidadCupos * parseFloat(tour.precio);
            
            // Generar factura automáticamente
            await guardarFacturaEnArchivo({
              tourId: reserva.tourId,
              nombreTour: tour.nombreTour,
              destino: destino?.nombre || tour.destinoId.toString(),
              usuarioId: reserva.usuarioId,
              nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : '',
              cantidadCupos: reserva.cantidadCupos,
              precio: tour.precio,
              montoTotal,
              fecha: reserva.fecha,
            });
          }
        }
      } catch (error) {
        console.error('Error al actualizar reserva o generar factura:', error);
        // No fallar el pago si hay error en la reserva/factura
      }
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
