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

async function leerDestinos(): Promise<DestinoGuardado[]> {
  try {
    const contenido = await readFile(rutaDestinos, "utf8")

    if (!contenido.trim()) {
      return []
    }

    const destinos = JSON.parse(contenido) as DestinoGuardado[]
    return Array.isArray(destinos) ? destinos : []
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return []
    }

    throw error
  }
}

function obtenerSiguienteId(destinos: DestinoGuardado[]) {
  if (destinos.length === 0) {
    return 0
  }

  return destinos.reduce((mayorId, destino) => {
    const idDestino = typeof destino.id === "number" ? destino.id : -1
    return idDestino > mayorId ? idDestino : mayorId
  }, -1) + 1
}

export async function guardarDestinoEnArchivo(datosDestino: DestinoNuevo) {
  const destinos = await leerDestinos()
  const imagenesGuardadas = Array.isArray(datosDestino.imagenes)
    ? datosDestino.imagenes.map((imagen) => imagen.trim()).filter(Boolean)
    : []

  const destinoGuardado: DestinoGuardado = {
    id: obtenerSiguienteId(destinos),
    nombre: datosDestino.nombre.trim(),
    ubicacion: datosDestino.ubicacion.trim(),
    descripcionBreve: datosDestino.descripcionBreve.trim(),
    descripcionDetallada: datosDestino.descripcionDetallada.trim(),
    imagenes: imagenesGuardadas,
    fechaRegistro: new Date().toISOString(),
  }

  destinos.push(destinoGuardado)
  await writeFile(rutaDestinos, JSON.stringify(destinos, null, 2), "utf8")

  return destinoGuardado
}
