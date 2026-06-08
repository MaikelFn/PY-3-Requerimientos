import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { guardarDestinoEnArchivo, leerDestinos } from "../../../lib/destinos"

const rutaCarpetaImagenes = path.join(
  process.cwd(),
  "public",
  "imagenes",
  "destinos"
)

function obtenerString(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim()
}

import { subirImagen } from "@/lib/cloudinary"

// Reemplaza la función guardarImagenSubida por:
async function guardarImagenSubida(imagen: File, carpeta: string): Promise<string> {
  const bytes = await imagen.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return subirImagen(buffer, carpeta)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const nombre = obtenerString(formData, "nombre")
    const ubicacion = obtenerString(formData, "ubicacion")
    const descripcionBreve = obtenerString(formData, "descripcionBreve")
    const descripcionDetallada = obtenerString(formData, "descripcionDetallada")
    const archivosImagenes = formData.getAll("imagenes") as File[]

    const camposObligatorios = [nombre, ubicacion, descripcionBreve, descripcionDetallada]
    if (camposObligatorios.some(campo => !campo)) {
      return NextResponse.json({ error: "Faltan datos del destino" }, { status: 400 })
    }

    let imagenes: string[] = []
    if (archivosImagenes && archivosImagenes.length > 0) {
      for (const archivo of archivosImagenes) {
        if (archivo.size > 0) {
          const rutaImagen = await guardarImagenSubida(archivo, "destinos")
          imagenes.push(rutaImagen) 
        }
      }
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

export async function GET() {
  try {
    const destinos = await leerDestinos()
    return NextResponse.json(destinos)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudieron obtener los destinos" },
      { status: 500 }
    )
  }
}
