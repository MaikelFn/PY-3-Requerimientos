import { NextResponse } from "next/server"
import {
  obtenerReservaById,
  actualizarReserva,
  eliminarReserva,
} from "../../../../lib/reservas"
import { guardarFacturaEnArchivo } from "../../../../lib/facturas"
import { obtenerTourById } from "../../../../lib/tours"
import { obtenerDestinoById } from "../../../../lib/destinos"
import { obtenerUsuarioById } from "../../../../lib/usuarios"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id, 10)
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const reserva = await obtenerReservaById(idNum)

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    return NextResponse.json(reserva)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo obtener la reserva" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id, 10)
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const actualizaciones = body

    const reservaAnterior = await obtenerReservaById(idNum)
    if (!reservaAnterior) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    const reserva = await actualizarReserva(idNum, actualizaciones)

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    if (
      actualizaciones.estadoReserva === "confirmada" &&
      reservaAnterior.estadoReserva !== "confirmada"
    ) {
      try {
        const tour = await obtenerTourById(reserva.tourId)
        const usuario = await obtenerUsuarioById(reserva.usuarioId)
        const destino = tour ? await obtenerDestinoById(tour.destinoId) : null

        if (tour) {
          const montoTotal = reserva.cantidadCupos * parseFloat(tour.precio)

          await guardarFacturaEnArchivo({
            tourId: reserva.tourId,
            nombreTour: tour.nombreTour,
            destino: destino?.nombre || tour.destinoId.toString(),
            usuarioId: reserva.usuarioId,
            nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : "",
            cantidadCupos: reserva.cantidadCupos,
            precio: tour.precio,
            montoTotal,
            fecha: reserva.fecha,
          })
        }
      } catch (error) {
        console.error("Error generando factura al confirmar reserva:", error)
      }
    }

    return NextResponse.json(reserva)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar la reserva" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id, 10)
    
    if (isNaN(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const eliminada = await eliminarReserva(idNum)

    if (!eliminada) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ mensaje: "Reserva eliminada correctamente" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar la reserva" },
      { status: 500 }
    )
  }
}
