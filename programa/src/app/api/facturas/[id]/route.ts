import { NextResponse } from "next/server"
import {
  obtenerFacturaById,
  actualizarFactura,
  eliminarFactura,
} from "../../../../lib/facturas"

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

    const factura = await obtenerFacturaById(idNum)

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo obtener la factura" },
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

    const factura = await actualizarFactura(idNum, actualizaciones)

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json(factura)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar la factura" },
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

    const eliminada = await eliminarFactura(idNum)

    if (!eliminada) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ mensaje: "Factura eliminada correctamente" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar la factura" },
      { status: 500 }
    )
  }
}
