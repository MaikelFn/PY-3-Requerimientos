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

import { subirImagen } from "@/lib/cloudinary"

async function guardarImagenSubida(imagen: File, carpeta: string): Promise<string> {
  const bytes = await imagen.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return subirImagen(buffer, carpeta)
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
    
    const archivosImagenes = formData.getAll("imagenes") as File[]

    const camposObligatorios = [
      nombreTour, precio, duracion, 
      descripcionBreve, itinerario, descripcionDetallada
    ]
    
    if (camposObligatorios.some(campo => !campo) || isNaN(destinoId)) {
      return NextResponse.json({ error: "Faltan datos del tour" }, { status: 400 })
    }

    let imagenes: string[] = []
    if (archivosImagenes && archivosImagenes.length > 0) {
      for (const archivo of archivosImagenes) {
        if (archivo.size > 0) {
          const rutaImagen = await guardarImagenSubida(archivo, "tours")
          imagenes.push(rutaImagen) 
        }
      }
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