import "server-only"
import { getDb } from "./mongodb"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const mensaje = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Translate the following Spanish text to English. Return ONLY the translated text, no explanations, no quotes:\n\n${texto}`,
        },
      ],
    })
    const bloque = mensaje.content[0]
    return bloque.type === "text" ? bloque.text.trim() : texto
  } catch {
    return texto
  }
}

async function traducirCamposDestino(datosDestino: DestinoNuevo) {
  const [ubicacionEn, descripcionBreveEn, descripcionDetalladaEn] = await Promise.all([
    traducir(datosDestino.ubicacion),
    traducir(datosDestino.descripcionBreve),
    traducir(datosDestino.descripcionDetallada),
  ])
  return { ubicacionEn, descripcionBreveEn, descripcionDetalladaEn }
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