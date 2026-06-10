import "server-only"
import { getDb } from "./mongodb"

export type FechaCupo = { fecha: string; cupos: string }

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
  nombreTourEn?: string
  descripcionBreveEn?: string
  itinerarioEn?: string
  descripcionDetalladaEn?: string
}

async function traducir(texto: string): Promise<string> {
  try {
    const partes: string[] = []
    let inicio = 0
    while (inicio < texto.length) {
      let fin = inicio + 450
      if (fin < texto.length) {
        const espacio = texto.lastIndexOf(" ", fin)
        if (espacio > inicio) fin = espacio
      }
      partes.push(texto.slice(inicio, fin).trim())
      inicio = fin
    }

    const traducciones = await Promise.all(
      partes.map(async (parte) => {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(parte)}&langpair=es|en`
        const res = await fetch(url)
        const data = await res.json()
        return data.responseData.translatedText as string
      })
    )

    return traducciones.join(" ")
  } catch {
    return texto
  }
}

async function traducirCamposTour(datosTour: TourNuevo) {
  const [nombreTourEn, descripcionBreveEn, itinerarioEn, descripcionDetalladaEn] = await Promise.all([
    traducir(datosTour.nombreTour),
    traducir(datosTour.descripcionBreve),
    traducir(datosTour.itinerario),
    traducir(datosTour.descripcionDetallada),
  ])
  return { nombreTourEn, descripcionBreveEn, itinerarioEn, descripcionDetalladaEn }
}

async function getNextId(coleccion: string): Promise<number> {
  const db = await getDb()
  const docs = await db.collection(coleccion).find({}, { projection: { id: 1 } }).toArray()
  if (docs.length === 0) return 0
  return Math.max(...docs.map(d => typeof d.id === "number" ? d.id : -1)) + 1
}

export async function leerTours(): Promise<TourGuardado[]> {
  const db = await getDb()
  const docs = await db.collection("tours").find({}).toArray()
  return docs.map(({ _id, ...rest }) => rest as TourGuardado)
}

export async function obtenerTourById(id: number): Promise<TourGuardado | null> {
  const db = await getDb()
  const doc = await db.collection("tours").findOne({ id })
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as TourGuardado
}

export async function obtenerIdPorNombreTour(nombre: string): Promise<number | null> {
  const db = await getDb()
  const doc = await db.collection("tours").findOne({ nombreTour: { $regex: new RegExp(`^${nombre.trim()}$`, "i") } })
  return doc?.id ?? null
}

export async function guardarTourEnArchivo(datosTour: TourNuevo): Promise<TourGuardado> {
  const db = await getDb()
  const id = await getNextId("tours")
  const traducciones = await traducirCamposTour(datosTour)
  const tour: TourGuardado = {
    ...datosTour,
    nombreTour: datosTour.nombreTour.trim(),
    precio: datosTour.precio.trim(),
    duracion: datosTour.duracion.trim(),
    descripcionBreve: datosTour.descripcionBreve.trim(),
    itinerario: datosTour.itinerario.trim(),
    descripcionDetallada: datosTour.descripcionDetallada.trim(),
    imagenes: datosTour.imagenes?.map(i => i.trim()).filter(Boolean) ?? [],
    ...traducciones,
    id,
    fechaRegistro: new Date().toISOString(),
  }
  await db.collection("tours").insertOne({ ...tour })
  return tour
}

export async function actualizarTourEnArchivo(id: number, datosTour: TourNuevo): Promise<TourGuardado> {
  const db = await getDb()
  const existing = await db.collection("tours").findOne({ id })
  if (!existing) throw new Error("Tour no encontrado")
  const traducciones = await traducirCamposTour(datosTour)
  const tour: TourGuardado = {
    ...datosTour,
    nombreTour: datosTour.nombreTour.trim(),
    precio: datosTour.precio.trim(),
    duracion: datosTour.duracion.trim(),
    descripcionBreve: datosTour.descripcionBreve.trim(),
    itinerario: datosTour.itinerario.trim(),
    descripcionDetallada: datosTour.descripcionDetallada.trim(),
    imagenes: datosTour.imagenes?.map(i => i.trim()).filter(Boolean) ?? [],
    ...traducciones,
    id,
    fechaRegistro: existing.fechaRegistro,
  }
  await db.collection("tours").replaceOne({ id }, { ...tour })
  return tour
}

export async function eliminarTourDelArchivo(id: number): Promise<TourGuardado> {
  const db = await getDb()
  const reservas = await db.collection("reservas").find({ tourId: id }).toArray()
  if (reservas.length > 0) throw new Error("No se puede eliminar el tour porque tiene reservas asociadas")
  const doc = await db.collection("tours").findOne({ id })
  if (!doc) throw new Error("Tour no encontrado")
  await db.collection("tours").deleteOne({ id })
  const { _id, ...rest } = doc
  return rest as TourGuardado
}

export async function restarCuposTour(tourId: number, fecha: string, cantidad: number): Promise<void> {
  const db = await getDb()
  const tour = await db.collection("tours").findOne({ id: tourId })
  if (!tour) throw new Error("Tour no encontrado")
  const fechaIndice = tour.fechasYCupos?.findIndex((f: FechaCupo) => f.fecha === fecha)
  if (fechaIndice === undefined || fechaIndice === -1) throw new Error("Fecha no encontrada")
  const cuposActuales = Number(tour.fechasYCupos[fechaIndice].cupos)
  if (cuposActuales < cantidad) throw new Error(`No hay suficientes cupos disponibles (tiene ${cuposActuales}, solicita ${cantidad})`)
  tour.fechasYCupos[fechaIndice].cupos = String(cuposActuales - cantidad)
  await db.collection("tours").updateOne({ id: tourId }, { $set: { fechasYCupos: tour.fechasYCupos } })
}

export async function sumarCuposTour(tourId: number, fecha: string, cantidad: number): Promise<void> {
  const db = await getDb()
  const tour = await db.collection("tours").findOne({ id: tourId })
  if (!tour) throw new Error("Tour no encontrado")
  const fechaIndice = tour.fechasYCupos?.findIndex((f: FechaCupo) => f.fecha === fecha)
  if (fechaIndice === undefined || fechaIndice === -1) throw new Error("Fecha no encontrada")
  const cuposActuales = Number(tour.fechasYCupos[fechaIndice].cupos)
  tour.fechasYCupos[fechaIndice].cupos = String(cuposActuales + cantidad)
  await db.collection("tours").updateOne({ id: tourId }, { $set: { fechasYCupos: tour.fechasYCupos } })
}