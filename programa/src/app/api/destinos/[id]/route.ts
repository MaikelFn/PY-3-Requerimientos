import { NextResponse } from "next/server"
import { actualizarDestinoEnArchivo, eliminarDestinoDelArchivo } from "../../../../lib/destinos"
import { subirImagen } from "../../../../lib/cloudinary"

function obtenerString(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim()
}

async function guardarImagenSubida(imagen: File): Promise<string> {
  const bytes = await imagen.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return subirImagen(buffer, "destinos")
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

    const formData = await request.formData()

    const nombre = obtenerString(formData, "nombre")
    const ubicacion = obtenerString(formData, "ubicacion")
    const descripcionBreve = obtenerString(formData, "descripcionBreve")
    const descripcionDetallada = obtenerString(formData, "descripcionDetallada")
    
    const archivosImagenes = formData.getAll("imagenes") as File[]
    const imagenesExistentesStr = obtenerString(formData, "imagenesExistentes")
    const imagenesExistentes = imagenesExistentesStr ? JSON.parse(imagenesExistentesStr) : []

    const camposObligatorios = [nombre, ubicacion, descripcionBreve, descripcionDetallada]
    if (camposObligatorios.some(campo => !campo)) {
      return NextResponse.json({ error: "Faltan datos del destino" }, { status: 400 })
    }

    let imagenesNuevas: string[] = []
    if (archivosImagenes && archivosImagenes.length > 0) {
      for (const archivo of archivosImagenes) {
        if (archivo.size > 0) {
          const rutaImagen = await guardarImagenSubida(archivo)
          imagenesNuevas.push(rutaImagen)
        }
      }
    }

    const todasLasImagenes = [...imagenesExistentes, ...imagenesNuevas]

    const destino = await actualizarDestinoEnArchivo(idNum, {
      nombre,
      ubicacion,
      descripcionBreve,
      descripcionDetallada,
      imagenes: todasLasImagenes.length > 0 ? todasLasImagenes : undefined,
    })

    return NextResponse.json(destino, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar el destino" },
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

    const destino = await eliminarDestinoDelArchivo(idNum)
    return NextResponse.json(
      { mensaje: "Destino eliminado correctamente", destino },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar el destino" },
      { status: 500 }
    )
  }
}