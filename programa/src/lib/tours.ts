import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

export type FechaCupo = {
  fecha: string
  cupos: string
}

export type TourNuevo = {
  nombreTour: string
  destinoId: number
  precio: string
  duracion: string
  descripcionBreve: string
  itinerario: string
  descripcionDetallada: string
  imagenes?: string[]
  fechasYCupos: FechaCupo[]
}

export type TourGuardado = TourNuevo & {
  id: number
  fechaRegistro: string
}

const rutaTours = path.join(process.cwd(), "src", "database", "tours.json")

async function leerArchivoJSON<T>(ruta: string): Promise<T[]> {
  try {
    const contenido = await readFile(ruta, "utf8")
    if (!contenido.trim()) return []
    
    const datos = JSON.parse(contenido) as T[]
    return Array.isArray(datos) ? datos : []
  } catch (error: any) {
    if (error?.code === "ENOENT") return []
    throw error
  }
}

function obtenerSiguienteId(tours: TourGuardado[]): number {
  if (tours.length === 0) return 0
  return Math.max(...tours.map(t => typeof t.id === "number" ? t.id : -1)) + 1
}

function limpiarCadenas(tour: TourNuevo): Omit<TourNuevo, "fechasYCupos"> {
  return {
    nombreTour: tour.nombreTour.trim(),
    destinoId: tour.destinoId,
    precio: tour.precio.trim(),
    duracion: tour.duracion.trim(),
    descripcionBreve: tour.descripcionBreve.trim(),
    itinerario: tour.itinerario.trim(),
    descripcionDetallada: tour.descripcionDetallada.trim(),
    imagenes: Array.isArray(tour.imagenes)
      ? tour.imagenes.map(img => img.trim()).filter(Boolean)
      : [],
  }
}

export async function leerTours(): Promise<TourGuardado[]> {
  return leerArchivoJSON<TourGuardado>(rutaTours)
}

export async function obtenerIdPorNombreTour(nombre: string): Promise<number | null> {
  const tours = await leerTours()
  const tour = tours.find(t => t.nombreTour.toLowerCase() === nombre.trim().toLowerCase())
  return tour?.id ?? null
}

export async function obtenerTourById(id: number): Promise<TourGuardado | null> {
  const tours = await leerTours()
  const tour = tours.find(t => t.id === id)
  return tour ?? null
}

export async function guardarTourEnArchivo(datosTour: TourNuevo) {
  const tours = await leerTours()
  const datosLimpios = limpiarCadenas(datosTour)

  const tourGuardado: TourGuardado = {
    ...datosLimpios,
    fechasYCupos: datosTour.fechasYCupos,
    id: obtenerSiguienteId(tours),
    fechaRegistro: new Date().toISOString(),
  }

  tours.push(tourGuardado)
  await writeFile(rutaTours, JSON.stringify(tours, null, 2), "utf8")

  return tourGuardado
}
