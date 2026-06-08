import "server-only"
import { getDb } from "./mongodb"

export type FacturaNueva = {
  tourId: number
  nombreTour: string
  destino: string
  usuarioId: number
  nombreUsuario: string
  cantidadCupos: number
  precio: string
  montoTotal: number
  fecha: string
}

export type FacturaGuardada = FacturaNueva & {
  id: number
  fechaRegistro: string
}

async function getNextId(): Promise<number> {
  const db = await getDb()
  const docs = await db.collection("facturas").find({}, { projection: { id: 1 } }).toArray()
  if (docs.length === 0) return 1
  return Math.max(...docs.map(d => typeof d.id === "number" ? d.id : 0)) + 1
}

export async function leerFacturas(): Promise<FacturaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("facturas").find({}).toArray()
  return docs.map(({ _id, ...rest }) => rest as FacturaGuardada)
}

export async function obtenerFacturaById(id: number): Promise<FacturaGuardada | null> {
  const db = await getDb()
  const doc = await db.collection("facturas").findOne({ id })
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as FacturaGuardada
}

export async function obtenerFacturasPorUsuario(usuarioId: number): Promise<FacturaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("facturas").find({ usuarioId }).toArray()
  return docs.map(({ _id, ...rest }) => rest as FacturaGuardada)
}

export async function obtenerFacturasPorTour(tourId: number): Promise<FacturaGuardada[]> {
  const db = await getDb()
  const docs = await db.collection("facturas").find({ tourId }).toArray()
  return docs.map(({ _id, ...rest }) => rest as FacturaGuardada)
}

export async function guardarFacturaEnArchivo(datosFactura: FacturaNueva): Promise<FacturaGuardada> {
  const db = await getDb()
  const id = await getNextId()
  const factura: FacturaGuardada = { ...datosFactura, id, fechaRegistro: new Date().toISOString() }
  await db.collection("facturas").insertOne({ ...factura })
  return factura
}

export async function actualizarFactura(id: number, actualizaciones: Partial<FacturaNueva>): Promise<FacturaGuardada | null> {
  const db = await getDb()
  const doc = await db.collection("facturas").findOne({ id })
  if (!doc) return null
  await db.collection("facturas").updateOne({ id }, { $set: actualizaciones })
  const actualizada = { ...doc, ...actualizaciones }
  const { _id, ...rest } = actualizada
  return rest as FacturaGuardada
}

export async function eliminarFactura(id: number): Promise<boolean> {
  const db = await getDb()
  const result = await db.collection("facturas").deleteOne({ id })
  return result.deletedCount > 0
}