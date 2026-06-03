import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

export type EstadoReserva = "confirmada" | "pendiente" | "cancelada"

export type ReservaNueva = {
  tourId: number
  usuarioId: number
  cantidadCupos: number
  fecha: string
  estadoReserva: EstadoReserva
}

export type ReservaGuardada = ReservaNueva & {
  id: number
  fechaRegistro: string
}

const rutaReservas = path.join(process.cwd(), "src", "database", "reservas.json")

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

function obtenerSiguienteId(reservas: ReservaGuardada[]): number {
  if (reservas.length === 0) return 1
  return Math.max(...reservas.map(r => typeof r.id === "number" ? r.id : 0)) + 1
}

export async function leerReservas(): Promise<ReservaGuardada[]> {
  return leerArchivoJSON<ReservaGuardada>(rutaReservas)
}

export async function obtenerReservaById(id: number): Promise<ReservaGuardada | null> {
  const reservas = await leerReservas()
  const reserva = reservas.find(r => r.id === id)
  return reserva ?? null
}

export async function obtenerReservasPorUsuario(usuarioId: number): Promise<ReservaGuardada[]> {
  const reservas = await leerReservas()
  return reservas.filter(r => r.usuarioId === usuarioId)
}

export async function obtenerReservasPorTour(tourId: number): Promise<ReservaGuardada[]> {
  const reservas = await leerReservas()
  return reservas.filter(r => r.tourId === tourId)
}

export async function obtenerReservasPorEstado(estado: EstadoReserva): Promise<ReservaGuardada[]> {
  const reservas = await leerReservas()
  return reservas.filter(r => r.estadoReserva === estado)
}

export async function obtenerReservasPorFecha(fecha: string): Promise<ReservaGuardada[]> {
  const reservas = await leerReservas()
  return reservas.filter(r => r.fecha === fecha)
}

export async function guardarReservaEnArchivo(datosReserva: ReservaNueva): Promise<ReservaGuardada> {
  const reservas = await leerReservas()
  const nuevoId = obtenerSiguienteId(reservas)
  
  const nuevaReserva: ReservaGuardada = {
    ...datosReserva,
    id: nuevoId,
    fechaRegistro: new Date().toISOString(),
  }
  
  reservas.push(nuevaReserva)
  await writeFile(rutaReservas, JSON.stringify(reservas, null, 4), "utf8")
  
  return nuevaReserva
}

export async function actualizarReserva(id: number, actualizaciones: Partial<ReservaNueva>): Promise<ReservaGuardada | null> {
  const reservas = await leerReservas()
  const indice = reservas.findIndex(r => r.id === id)
  
  if (indice === -1) return null
  
  const reservaActualizada: ReservaGuardada = {
    ...reservas[indice],
    ...actualizaciones,
  }
  
  reservas[indice] = reservaActualizada
  await writeFile(rutaReservas, JSON.stringify(reservas, null, 4), "utf8")
  
  return reservaActualizada
}

export async function actualizarEstadoReserva(id: number, nuevoEstado: EstadoReserva): Promise<ReservaGuardada | null> {
  return actualizarReserva(id, { estadoReserva: nuevoEstado })
}

export async function eliminarReserva(id: number): Promise<boolean> {
  const reservas = await leerReservas()
  const indice = reservas.findIndex(r => r.id === id)
  
  if (indice === -1) return false
  
  reservas.splice(indice, 1)
  await writeFile(rutaReservas, JSON.stringify(reservas, null, 4), "utf8")
  
  return true
}

export async function obtenerResumenReservasUsuario(usuarioId: number) {
  const reservas = await obtenerReservasPorUsuario(usuarioId)
  
  return {
    totalReservas: reservas.length,
    confirmadas: reservas.filter(r => r.estadoReserva === "confirmada").length,
    pendientes: reservas.filter(r => r.estadoReserva === "pendiente").length,
    canceladas: reservas.filter(r => r.estadoReserva === "cancelada").length,
    reservas,
  }
}

export async function obtenerResumenReservasTour(tourId: number) {
  const reservas = await obtenerReservasPorTour(tourId)
  const totalCupos = reservas.reduce((sum, r) => sum + r.cantidadCupos, 0)
  
  return {
    totalReservas: reservas.length,
    totalCuposReservados: totalCupos,
    confirmadas: reservas.filter(r => r.estadoReserva === "confirmada").length,
    pendientes: reservas.filter(r => r.estadoReserva === "pendiente").length,
    canceladas: reservas.filter(r => r.estadoReserva === "cancelada").length,
    reservas,
  }
}
