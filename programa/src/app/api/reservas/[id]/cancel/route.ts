import { NextResponse } from "next/server"
import {
  obtenerReservaById,
  actualizarReserva,
} from "../../../../../lib/reservas"
import { sumarCuposTour } from "../../../../../lib/tours"

export async function POST(
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

    // No permitir cancelar reservas ya canceladas
    if (reserva.estadoReserva === "cancelada") {
      return NextResponse.json({ error: "Esta reserva ya fue cancelada" }, { status: 400 })
    }

    // Devolver cupos del tour
    console.log(`[API Cancel] Cancelando reserva ${idNum}, devolviendo ${reserva.cantidadCupos} cupos`)
    await sumarCuposTour(reserva.tourId, reserva.fecha, reserva.cantidadCupos)

    // Actualizar estado a cancelada
    const reservaActualizada = await actualizarReserva(idNum, { estadoReserva: "cancelada" })

    return NextResponse.json({
      mensaje: "Reserva cancelada exitosamente y cupos devueltos",
      reserva: reservaActualizada
    })
  } catch (error: any) {
    console.error("[API Cancel] Error:", error)
    return NextResponse.json(
      { error: error?.message || "No se pudo cancelar la reserva" },
      { status: 500 }
    )
  }
}
