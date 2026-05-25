import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { guardarDestinoEnArchivo } from "../../../lib/destinos"

const rutaCarpetaImagenes = path.join(
  process.cwd(),
  "public",
  "imagenes",
  "destinos"
)

async function guardarImagenSubida(imagen: File) {
  await mkdir(rutaCarpetaImagenes, { recursive: true })

  const extension = path.extname(imagen.name) || ".jpg"
  const nombreArchivo = `${randomUUID()}${extension}`
  const rutaFisicaDestino = path.join(rutaCarpetaImagenes, nombreArchivo)

  const bytes = await imagen.arrayBuffer()
  await writeFile(rutaFisicaDestino, Buffer.from(bytes))

  return `/imagenes/destinos/${nombreArchivo}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nombre = String(formData.get("nombre") ?? "").trim()
    const ubicacion = String(formData.get("ubicacion") ?? "").trim()
    const descripcionBreve = String(formData.get("descripcionBreve") ?? "").trim()
    const descripcionDetallada = String(formData.get("descripcionDetallada") ?? "").trim()
    const archivoImagen = formData.get("imagen")

    if (!nombre || !ubicacion || !descripcionBreve || !descripcionDetallada) {
      return NextResponse.json({ error: "Faltan datos del destino" }, { status: 400 })
    }

    let imagenes: string[] = []

    if (archivoImagen instanceof File && archivoImagen.size > 0) {
      const rutaPublica = await guardarImagenSubida(archivoImagen)
      imagenes = [rutaPublica]
    }

    const destino = await guardarDestinoEnArchivo({
      nombre,
      ubicacion,
      descripcionBreve,
      descripcionDetallada,
      imagenes,
    })

    return NextResponse.json(destino, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo guardar el destino" },
      { status: 500 }
    )
  }
}
