import "server-only"
import { getDb } from "./mongodb"

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

async function getNextId(): Promise<number> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({}, { projection: { id: 1 } }).toArray()
  if (docs.length === 0) return 1
  return Math.max(...docs.map(d => typeof d.id === "number" ? d.id : 0)) + 1
}

export async function leerReservas(): Promise<ReservaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({}).toArray()
  return docs.map(({ _id, ...rest }) => rest as ReservaGuardada)
}

export async function obtenerReservaById(id: number): Promise<ReservaGuardada | null> {
  const db = await getDb()
  const doc = await db.collection("reservas").findOne({ id })
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as ReservaGuardada
}

export async function obtenerReservasPorUsuario(usuarioId: number): Promise<ReservaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({ usuarioId }).toArray()
  return docs.map(({ _id, ...rest }) => rest as ReservaGuardada)
}

export async function obtenerReservasPorTour(tourId: number): Promise<ReservaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({ tourId }).toArray()
  return docs.map(({ _id, ...rest }) => rest as ReservaGuardada)
}

export async function obtenerReservasPorEstado(estado: EstadoReserva): Promise<ReservaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({ estadoReserva: estado }).toArray()
  return docs.map(({ _id, ...rest }) => rest as ReservaGuardada)
}

export async function obtenerReservasPorFecha(fecha: string): Promise<ReservaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("reservas").find({ fecha }).toArray()
  return docs.map(({ _id, ...rest }) => rest as ReservaGuardada)
}

export async function guardarReservaEnArchivo(datosReserva: ReservaNueva): Promise<ReservaGuardada> {
  const db = await getDb()
  const id = await getNextId()
  const reserva: ReservaGuardada = { ...datosReserva, id, fechaRegistro: new Date().toISOString() }
  await db.collection("reservas").insertOne({ ...reserva })
  return reserva
}

export async function actualizarReserva(id: number, actualizaciones: Partial<ReservaNueva>): Promise<ReservaGuardada | null> {
  const db = await getDb()
  const doc = await db.collection("reservas").findOne({ id })
  if (!doc) return null
  const actualizada = { ...doc, ...actualizaciones }
  await db.collection("reservas").updateOne({ id }, { $set: actualizaciones })
  const { _id, ...rest } = actualizada
  return rest as ReservaGuardada
}

export async function actualizarEstadoReserva(id: number, nuevoEstado: EstadoReserva): Promise<ReservaGuardada | null> {
  return actualizarReserva(id, { estadoReserva: nuevoEstado })
}

export async function eliminarReserva(id: number): Promise<boolean> {
  const db = await getDb()
  const result = await db.collection("reservas").deleteOne({ id })
  return result.deletedCount > 0
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