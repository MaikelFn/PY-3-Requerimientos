import { NextResponse } from "next/server"
import {
  obtenerReservaById,
  actualizarReserva,
  eliminarReserva,
} from "../../../../lib/reservas"

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

    const reserva = await actualizarReserva(idNum, actualizaciones)

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
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
