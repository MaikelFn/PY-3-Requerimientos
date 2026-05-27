import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { guardarTourEnArchivo, leerTours } from "../../../lib/tours"

const rutaCarpetaImagenes = path.join(
  process.cwd(),
  "public",
  "imagenes",
  "tours"
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

  return `/imagenes/tours/${nombreArchivo}`
}

function parsearFechasYCupos(fechasYCuposStr: string) {
  try {
    const fechasYCupos = JSON.parse(fechasYCuposStr)
    if (!Array.isArray(fechasYCupos) || fechasYCupos.length === 0) {
      throw new Error("Debe agregar al menos una fecha con cupos")
    }
    return fechasYCupos
  } catch (error: any) {
    throw new Error(error?.message || "Formato inválido de fechas y cupos")
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nombreTour = obtenerString(formData, "nombreTour")
    const destinoId = parseInt(obtenerString(formData, "destinoId"), 10)
    const precio = obtenerString(formData, "precio")
    const duracion = obtenerString(formData, "duracion")
    const descripcionBreve = obtenerString(formData, "descripcionBreve")
    const itinerario = obtenerString(formData, "itinerario")
    const descripcionDetallada = obtenerString(formData, "descripcionDetallada")
    const fechasYCupos = parsearFechasYCupos(obtenerString(formData, "fechasYCupos"))
    const archivoImagen = formData.get("imagen") as File | null

    const camposObligatorios = [
      nombreTour, precio, duracion, 
      descripcionBreve, itinerario, descripcionDetallada
    ]
    
    if (camposObligatorios.some(campo => !campo) || isNaN(destinoId)) {
      return NextResponse.json({ error: "Faltan datos del tour" }, { status: 400 })
    }

    let imagenes: string[] = []
    if (archivoImagen && archivoImagen.size > 0) {
      imagenes = [await guardarImagenSubida(archivoImagen)]
    }

    const tour = await guardarTourEnArchivo({
      nombreTour,
      destinoId,
      precio,
      duracion,
      descripcionBreve,
      itinerario,
      descripcionDetallada,
      imagenes,
      fechasYCupos,
    })

    return NextResponse.json(tour, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo guardar el tour" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const tours = await leerTours()
    return NextResponse.json(tours)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudieron obtener los tours" },
      { status: 500 }
    )
  }
}
