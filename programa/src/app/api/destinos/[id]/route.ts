import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { actualizarDestinoEnArchivo, eliminarDestinoDelArchivo } from "../../../../lib/destinos"

const rutaCarpetaImagenes = path.join(
  process.cwd(),
  "public",
  "imagenes",
  "destinos"
)

function obtenerString(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim()
}

async function guardarImagenSubida(imagen: File) {
  await mkdir(rutaCarpetaImagenes, { recursive: true })

  const extension = path.extname(imagen.name) || ".jpg"
  const nombreArchivo = `${randomUUID()}${extension}`
  const rutaFisicaDestino = path.join(rutaCarpetaImagenes, nombreArchivo)

  const bytes = await imagen.arrayBuffer()
  await writeFile(rutaFisicaDestino, Buffer.from(bytes))

  return `/imagenes/destinos/${nombreArchivo}`
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

    // Procesar nuevas imágenes
    let imagenesNuevas: string[] = []
    if (archivosImagenes && archivosImagenes.length > 0) {
      for (const archivo of archivosImagenes) {
        if (archivo.size > 0) {
          const rutaImagen = await guardarImagenSubida(archivo)
          imagenesNuevas.push(rutaImagen)
        }
      }
    }

    // Combinar imágenes existentes + nuevas
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
