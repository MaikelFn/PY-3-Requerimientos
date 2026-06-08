import { NextResponse } from "next/server"
import { actualizarTourEnArchivo, eliminarTourDelArchivo } from "../../../../lib/tours"
import { subirImagen } from "../../../../lib/cloudinary"

function obtenerString(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim()
}

async function guardarImagenSubida(imagen: File): Promise<string> {
  const bytes = await imagen.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return subirImagen(buffer, "tours")
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

    const nombreTour = obtenerString(formData, "nombreTour")
    const destino = obtenerString(formData, "destino")
    const precio = obtenerString(formData, "precio")
    const duracion = obtenerString(formData, "duracion")
    const descripcionBreve = obtenerString(formData, "descripcionBreve")
    const itinerario = obtenerString(formData, "itinerario")
    const descripcionDetallada = obtenerString(formData, "descripcionDetallada")
    const fechasYCupos = parsearFechasYCupos(obtenerString(formData, "fechasYCupos"))
    
    const archivosImagenes = formData.getAll("imagenes") as File[]
    const imagenesExistentesStr = obtenerString(formData, "imagenesExistentes")
    const imagenesExistentes = imagenesExistentesStr ? JSON.parse(imagenesExistentesStr) : []

    const camposObligatorios = [
      nombreTour, destino, precio, duracion,
      descripcionBreve, itinerario, descripcionDetallada
    ]

    if (camposObligatorios.some(campo => !campo)) {
      return NextResponse.json({ error: "Faltan datos del tour" }, { status: 400 })
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

    let destinoId = 1
    try {
      const resDestinos = await fetch(new URL("/api/destinos", request.url).toString())
      if (resDestinos.ok) {
        const destinos = await resDestinos.json()
        const destinoEncontrado = destinos.find((d: any) => d.nombre === destino)
        if (destinoEncontrado) {
          destinoId = destinoEncontrado.id
        }
      }
    } catch (error) {
      console.error("Error obteniendo destino:", error)
    }

    const tour = await actualizarTourEnArchivo(idNum, {
      nombreTour,
      destinoId,
      precio,
      duracion,
      descripcionBreve,
      itinerario,
      descripcionDetallada,
      imagenes: todasLasImagenes.length > 0 ? todasLasImagenes : undefined,
      fechasYCupos,
    })

    return NextResponse.json(tour, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar el tour" },
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

    const tour = await eliminarTourDelArchivo(idNum)
    return NextResponse.json(
      { mensaje: "Tour eliminado correctamente", tour },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar el tour" },
      { status: 500 }
    )
  }
}