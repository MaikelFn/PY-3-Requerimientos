import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

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
}

const rutaDestinos = path.join(process.cwd(), "src", "database", "destinos.json")

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

function obtenerSiguienteId(destinos: DestinoGuardado[]): number {
  if (destinos.length === 0) return 0
  return Math.max(...destinos.map(d => typeof d.id === "number" ? d.id : -1)) + 1
}

function limpiarCadenas(destino: DestinoNuevo): DestinoNuevo {
  return {
    nombre: destino.nombre.trim(),
    ubicacion: destino.ubicacion.trim(),
    descripcionBreve: destino.descripcionBreve.trim(),
    descripcionDetallada: destino.descripcionDetallada.trim(),
    imagenes: Array.isArray(destino.imagenes)
      ? destino.imagenes.map(img => img.trim()).filter(Boolean)
      : [],
  }
}

export async function leerDestinos(): Promise<DestinoGuardado[]> {
  return leerArchivoJSON<DestinoGuardado>(rutaDestinos)
}

export async function obtenerIdPorNombreDestino(nombre: string): Promise<number | null> {
  const destinos = await leerDestinos()
  const destino = destinos.find(d => d.nombre.toLowerCase() === nombre.trim().toLowerCase())
  return destino?.id ?? null
}

export async function obtenerDestinoById(id: number): Promise<DestinoGuardado | null> {
  const destinos = await leerDestinos()
  const destino = destinos.find(d => d.id === id)
  return destino ?? null
}

export async function guardarDestinoEnArchivo(datosDestino: DestinoNuevo) {
  const destinos = await leerDestinos()
  const datosLimpios = limpiarCadenas(datosDestino)

  const destinoGuardado: DestinoGuardado = {
    ...datosLimpios,
    id: obtenerSiguienteId(destinos),
    fechaRegistro: new Date().toISOString(),
  }

  destinos.push(destinoGuardado)
  await writeFile(rutaDestinos, JSON.stringify(destinos, null, 2), "utf8")

  return destinoGuardado
}
