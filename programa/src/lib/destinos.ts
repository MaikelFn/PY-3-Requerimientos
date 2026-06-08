import "server-only"
import { getDb } from "./mongodb"

export type DestinoNuevo = {
  nombre: string
  ubicacion: string
  descripcionBreve: string
  descripcionDetallada: string
  imagenes?: string[]
}

export type DestinoGuardado = DestinoNuevo & {
  id: number
  fechaRegistro: string
  ubicacionEn?: string
  descripcionBreveEn?: string
  descripcionDetalladaEn?: string
}

async function traducir(texto: string): Promise<string> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=es|en`
    const res = await fetch(url)
    const data = await res.json()
    return data.responseData.translatedText
  } catch {
    return texto
  }
}

async function traducirCamposDestino(datosDestino: DestinoNuevo) {
  const [descripcionBreveEn, descripcionDetalladaEn] = await Promise.all([
    traducir(datosDestino.descripcionBreve),
    traducir(datosDestino.descripcionDetallada),
  ])
  return { descripcionBreveEn, descripcionDetalladaEn }
}

async function getNextId(): Promise<number> {
  const db = await getDb()
  const docs = await db.collection("destinos").find({}, { projection: { id: 1 } }).toArray()
  if (docs.length === 0) return 0
  return Math.max(...docs.map(d => typeof d.id === "number" ? d.id : -1)) + 1
}

export async function leerDestinos(): Promise<DestinoGuardado[]> {
  const db = await getDb()
  const docs = await db.collection("destinos").find({}).toArray()
  return docs.map(({ _id, ...rest }) => rest as DestinoGuardado)
}

export async function obtenerDestinoById(id: number): Promise<DestinoGuardado | null> {
  const db = await getDb()
  const doc = await db.collection("destinos").findOne({ id })
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as DestinoGuardado
}

export async function obtenerIdPorNombreDestino(nombre: string): Promise<number | null> {
  const db = await getDb()
  const doc = await db.collection("destinos").findOne({ nombre: { $regex: new RegExp(`^${nombre.trim()}$`, "i") } })
  return doc?.id ?? null
}

export async function guardarDestinoEnArchivo(datosDestino: DestinoNuevo): Promise<DestinoGuardado> {
  const db = await getDb()
  const id = await getNextId()
  const traducciones = await traducirCamposDestino(datosDestino)
  const destino: DestinoGuardado = {
    nombre: datosDestino.nombre.trim(),
    ubicacion: datosDestino.ubicacion.trim(),
    descripcionBreve: datosDestino.descripcionBreve.trim(),
    descripcionDetallada: datosDestino.descripcionDetallada.trim(),
    imagenes: datosDestino.imagenes?.map(i => i.trim()).filter(Boolean) ?? [],
    ...traducciones,
    id,
    fechaRegistro: new Date().toISOString(),
  }
  await db.collection("destinos").insertOne({ ...destino })
  return destino
}

export async function actualizarDestinoEnArchivo(id: number, datosDestino: DestinoNuevo): Promise<DestinoGuardado> {
  const db = await getDb()
  const existing = await db.collection("destinos").findOne({ id })
  if (!existing) throw new Error("Destino no encontrado")
  const traducciones = await traducirCamposDestino(datosDestino)
  const destino: DestinoGuardado = {
    nombre: datosDestino.nombre.trim(),
    ubicacion: datosDestino.ubicacion.trim(),
    descripcionBreve: datosDestino.descripcionBreve.trim(),
    descripcionDetallada: datosDestino.descripcionDetallada.trim(),
    imagenes: datosDestino.imagenes?.map(i => i.trim()).filter(Boolean) ?? [],
    ...traducciones,
    id,
    fechaRegistro: existing.fechaRegistro,
  }
  await db.collection("destinos").replaceOne({ id }, { ...destino })
  return destino
}

export async function eliminarDestinoDelArchivo(id: number): Promise<DestinoGuardado> {
  const db = await getDb()
  const tours = await db.collection("tours").find({ destinoId: id }).toArray()
  if (tours.length > 0) throw new Error("No se puede eliminar el destino porque tiene tours asociados")
  const doc = await db.collection("destinos").findOne({ id })
  if (!doc) throw new Error("Destino no encontrado")
  await db.collection("destinos").deleteOne({ id })
  const { _id, ...rest } = doc
  return rest as DestinoGuardado
}