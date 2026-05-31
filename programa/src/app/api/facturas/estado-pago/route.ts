import { NextRequest, NextResponse } from "next/server"
import { actualizarEstadoPago, type EstadoPago } from "../../../../lib/facturas"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nuevoEstado } = body

    if (!id || !nuevoEstado) {
      return NextResponse.json(
        { error: "ID de factura y nuevo estado requeridos" },
        { status: 400 }
      )
    }

    if (nuevoEstado !== "cancelado" && nuevoEstado !== "pendiente") {
      return NextResponse.json(
        { error: "El estado debe ser 'cancelado' o 'pendiente'" },
        { status: 400 }
      )
    }

    const factura = await actualizarEstadoPago(
      parseInt(id, 10),
      nuevoEstado as EstadoPago
    )

    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar el estado del pago" },
      { status: 500 }
    )
  }
}
