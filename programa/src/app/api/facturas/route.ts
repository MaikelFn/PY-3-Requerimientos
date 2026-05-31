import { NextRequest, NextResponse } from "next/server"
import {
  leerFacturas,
  guardarFacturaEnArchivo,
  obtenerFacturasPorUsuario,
  obtenerFacturasPorTour,
  obtenerFacturasPorEstado,
  actualizarFactura,
  actualizarEstadoPago,
  eliminarFactura,
  type FacturaNueva,
  type EstadoPago,
} from "../../../lib/facturas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get("usuarioId")
    const tourId = searchParams.get("tourId")
    const estado = searchParams.get("estado")

    let facturas

    if (usuarioId) {
      facturas = await obtenerFacturasPorUsuario(parseInt(usuarioId, 10))
    } else if (tourId) {
      facturas = await obtenerFacturasPorTour(parseInt(tourId, 10))
    } else if (estado) {
      facturas = await obtenerFacturasPorEstado(estado as EstadoPago)
    } else {
      facturas = await leerFacturas()
    }

    return NextResponse.json(facturas)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudieron obtener las facturas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { tourId, usuarioId, cantidadCupos, fecha, estadoPago } = body

    // Validaciones
    if (!tourId || !usuarioId || !cantidadCupos || !fecha || !estadoPago) {
      return NextResponse.json(
        { error: "Faltan datos de la factura" },
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

    if (estadoPago !== "cancelado" && estadoPago !== "pendiente") {
      return NextResponse.json(
        { error: "El estado del pago debe ser 'cancelado' o 'pendiente'" },
        { status: 400 }
      )
    }

    const datosFactura: FacturaNueva = {
      tourId,
      usuarioId,
      cantidadCupos,
      fecha,
      estadoPago,
    }

    const factura = await guardarFacturaEnArchivo(datosFactura)

    return NextResponse.json(factura, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo guardar la factura" },
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
        { error: "ID de factura requerido" },
        { status: 400 }
      )
    }

    const factura = await actualizarFactura(parseInt(id, 10), actualizaciones)

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar la factura" },
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
        { error: "ID de factura requerido" },
        { status: 400 }
      )
    }

    const eliminada = await eliminarFactura(parseInt(id, 10))

    if (!eliminada) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ mensaje: "Factura eliminada correctamente" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar la factura" },
      { status: 500 }
    )
  }
}
