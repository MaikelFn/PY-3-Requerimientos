import { NextRequest, NextResponse } from "next/server"
import {
  leerReservas,
  guardarReservaEnArchivo,
  obtenerReservasPorUsuario,
  obtenerReservasPorTour,
  obtenerReservasPorEstado,
  obtenerReservasPorFecha,
  actualizarReserva,
  actualizarEstadoReserva,
  eliminarReserva,
  type ReservaNueva,
  type EstadoReserva,
} from "../../../lib/reservas"

import { restarCuposTour } from "../../../lib/tours"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get("usuarioId")
    const tourId = searchParams.get("tourId")
    const estado = searchParams.get("estado")
    const fecha = searchParams.get("fecha")

    let reservas

    if (usuarioId) {
      reservas = await obtenerReservasPorUsuario(parseInt(usuarioId, 10))
    } else if (tourId) {
      reservas = await obtenerReservasPorTour(parseInt(tourId, 10))
    } else if (estado) {
      reservas = await obtenerReservasPorEstado(estado as EstadoReserva)
    } else if (fecha) {
      reservas = await obtenerReservasPorFecha(fecha)
    } else {
      reservas = await leerReservas()
    }

    return NextResponse.json(reservas)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudieron obtener las reservas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { tourId, usuarioId, cantidadCupos, fecha, estadoReserva } = body

    // Validaciones
    if (tourId === undefined || tourId === null || usuarioId === undefined || usuarioId === null || !cantidadCupos || !fecha || !estadoReserva) {
      return NextResponse.json(
        { error: "Faltan datos de la reserva" },
        { status: 400 }
      )
    }

    if (isNaN(tourId) || isNaN(usuarioId) || isNaN(cantidadCupos)) {
      return NextResponse.json(
        { error: "Los IDs y cantidad de cupos deben ser números" },
        { status: 400 }
      )
    }

    if (cantidadCupos <= 0) {
      return NextResponse.json(
        { error: "La cantidad de cupos debe ser mayor a 0" },
        { status: 400 }
      )
    }

    if (estadoReserva !== "confirmada" && estadoReserva !== "pendiente" && estadoReserva !== "cancelada") {
      return NextResponse.json(
        { error: "El estado de la reserva debe ser 'confirmada', 'pendiente' o 'cancelada'" },
        { status: 400 }
      )
    }

    // Restar cupos del tour
    await restarCuposTour(tourId, fecha, cantidadCupos)

    const datosReserva: ReservaNueva = {
      tourId,
      usuarioId,
      cantidadCupos,
      fecha,
      estadoReserva,
    }

    const reserva = await guardarReservaEnArchivo(datosReserva)

    return NextResponse.json(reserva, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo guardar la reserva" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...actualizaciones } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID de reserva requerido" },
        { status: 400 }
      )
    }

    const reserva = await actualizarReserva(parseInt(id, 10), actualizaciones)

    if (!reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(reserva)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar la reserva" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de reserva requerido" },
        { status: 400 }
      )
    }

    const eliminada = await eliminarReserva(parseInt(id, 10))

    if (!eliminada) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ mensaje: "Reserva eliminada correctamente" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar la reserva" },
      { status: 500 }
    )
  }
}
