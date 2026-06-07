import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"
import { leerReservas } from "./reservas"

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

export async function actualizarTourEnArchivo(id: number, datosTour: TourNuevo) {
  const tours = await leerTours()
  const indice = tours.findIndex(t => t.id === id)
  
  if (indice === -1) {
    throw new Error("Tour no encontrado")
  }

  const datosLimpios = limpiarCadenas(datosTour)
  const tourActualizado: TourGuardado = {
    ...datosLimpios,
    fechasYCupos: datosTour.fechasYCupos,
    id,
    fechaRegistro: tours[indice].fechaRegistro,
  }

  tours[indice] = tourActualizado
  await writeFile(rutaTours, JSON.stringify(tours, null, 2), "utf8")

  return tourActualizado
}

export async function eliminarTourDelArchivo(id: number) {
  const tours = await leerTours()
  const indice = tours.findIndex(t => t.id === id)
  
  if (indice === -1) {
    throw new Error("Tour no encontrado")
  }

  //Verificar si tiene reservas asociadas
  const reservas = await leerReservas()
  const reservasAsociadas = reservas.filter(r => r.tourId === id)
  if (reservasAsociadas.length > 0) {
    throw new Error("No se puede eliminar el tour porque tiene reservas asociadas")
  }

  const tourEliminado = tours[indice]
  tours.splice(indice, 1)
  await writeFile(rutaTours, JSON.stringify(tours, null, 2), "utf8")

  return tourEliminado
}

export async function restarCuposTour(tourId: number, fecha: string, cantidad: number): Promise<void> {
    const tours = await leerTours()
    const indice = tours.findIndex(t => t.id === tourId)
    if (indice === -1) throw new Error("Tour no encontrado")

    const fechaIndice = tours[indice].fechasYCupos?.findIndex(f => f.fecha === fecha)
    if (fechaIndice === undefined || fechaIndice === -1) throw new Error("Fecha no encontrada")

    const cuposActuales = Number(tours[indice].fechasYCupos[fechaIndice].cupos)
    console.log(`[restarCuposTour] Tour ${tourId}, Fecha ${fecha}: cupos=${cuposActuales}, solicita=${cantidad}`)
    if (cuposActuales < cantidad) throw new Error(`No hay suficientes cupos disponibles (tiene ${cuposActuales}, solicita ${cantidad})`)

    tours[indice].fechasYCupos[fechaIndice].cupos = String(cuposActuales - cantidad)
    await writeFile(rutaTours, JSON.stringify(tours, null, 2), "utf8")
    console.log(`[restarCuposTour] OK: ${cuposActuales} - ${cantidad} = ${cuposActuales - cantidad}`)
}

export async function sumarCuposTour(tourId: number, fecha: string, cantidad: number): Promise<void> {
    console.log(`[sumarCuposTour] Iniciando: Tour ${tourId}, Fecha ${fecha}, cantidad=${cantidad}`)
    const tours = await leerTours()
    const indice = tours.findIndex(t => t.id === tourId)
    if (indice === -1) throw new Error("Tour no encontrado")

    const fechaIndice = tours[indice].fechasYCupos?.findIndex(f => f.fecha === fecha)
    if (fechaIndice === undefined || fechaIndice === -1) throw new Error(`Fecha no encontrada para tour ${tourId}`)

    const cuposActuales = Number(tours[indice].fechasYCupos[fechaIndice].cupos)
    console.log(`[sumarCuposTour] Cupos antes: ${cuposActuales}, sumando: ${cantidad}`)
    tours[indice].fechasYCupos[fechaIndice].cupos = String(cuposActuales + cantidad)
    await writeFile(rutaTours, JSON.stringify(tours, null, 2), "utf8")
    console.log(`[sumarCuposTour] OK: ${cuposActuales} + ${cantidad} = ${cuposActuales + cantidad}`)
}