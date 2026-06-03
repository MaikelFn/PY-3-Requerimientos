import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

/**
 * Representa un destino almacenado en el archivo JSON local.
 * El `id` se tipa como `string | number` para soportar tanto identificadores
 * numéricos (los que usa actualmente la base de datos local) como UUIDs.
 */
export interface Destino {
  id: string | number
  nombre?: string
  ubicacion?: string
  descripcionBreve?: string
  descripcionDetallada?: string
  imagenes?: string[]
  fechaRegistro?: string
}

/**
 * Representa un tour. Solo nos interesa la relación con el destino a través de
 * `destinoId`, por eso el resto de campos son opcionales para esta función.
 */
export interface Tour {
  destinoId: string | number
  nombreTour?: string
  id?: string | number
}

/**
 * Resultado de la operación de eliminación. Es una unión discriminada por
 * `exito` para que el consumidor (por ejemplo, una ruta de API) pueda mapear
 * fácilmente cada caso a un código de estado HTTP.
 */
export type ResultadoEliminacion =
  | { exito: true; mensaje: string; destino: Destino }
  | { exito: false; mensaje: string }

// Rutas absolutas a los archivos JSON que actúan como almacenamiento local.
const rutaDestinos = path.join(process.cwd(), "src", "database", "destinos.json")
const rutaTours = path.join(process.cwd(), "src", "database", "tours.json")

/**
 * Lee y parsea un archivo JSON que contiene un arreglo de elementos.
 * Si el archivo no existe o está vacío se devuelve un arreglo vacío para que la
 * lógica de negocio pueda continuar sin tratarlo como un error fatal.
 */
async function leerColeccion<T>(ruta: string): Promise<T[]> {
  const contenido = await readFile(ruta, "utf8")
  if (!contenido.trim()) return []

  const datos = JSON.parse(contenido) as unknown
  return Array.isArray(datos) ? (datos as T[]) : []
}

/**
 * Compara dos identificadores de forma exacta pero tolerante al tipo.
 * Como `id` y `destinoId` pueden ser `string` o `number`, normalizamos ambos a
 * cadena para que `0` y `"0"` se consideren el mismo destino.
 */
function mismoId(a: string | number, b: string | number): boolean {
  return String(a) === String(b)
}

/**
 * Elimina un destino del archivo JSON local validando previamente que no esté
 * asociado a ningún tour.
 *
 * Flujo:
 *  1. Lee la colección de tours y verifica si algún `destinoId` coincide con el
 *     `id` recibido.
 *  2. Si existe al menos un tour vinculado, detiene el proceso y retorna un
 *     mensaje de error claro (no se modifica ningún archivo).
 *  3. Si no hay conflicto, remueve el destino del arreglo y persiste los
 *     cambios en disco.
 *
 * @param id Identificador del destino a eliminar.
 * @returns Un `ResultadoEliminacion` que indica éxito o error con su mensaje.
 */
export async function eliminarDestino(
  id: string | number
): Promise<ResultadoEliminacion> {
  try {
    // 1. Validación previa: ¿hay tours que dependan de este destino?
    const tours = await leerColeccion<Tour>(rutaTours)
    const hayTourVinculado = tours.some(tour => mismoId(tour.destinoId, id))

    if (hayTourVinculado) {
      // 2. Conflicto de integridad referencial: abortamos sin tocar el archivo.
      return {
        exito: false,
        mensaje:
          "No se puede eliminar el destino porque está asociado a uno o más tours",
      }
    }

    // 3. Sin conflicto: localizamos y removemos el destino.
    const destinos = await leerColeccion<Destino>(rutaDestinos)
    const indice = destinos.findIndex(destino => mismoId(destino.id, id))

    if (indice === -1) {
      return { exito: false, mensaje: "Destino no encontrado" }
    }

    const [destinoEliminado] = destinos.splice(indice, 1)

    // Persistimos la colección actualizada, manteniendo el formato indentado.
    await writeFile(rutaDestinos, JSON.stringify(destinos, null, 2), "utf8")

    return {
      exito: true,
      mensaje: "Destino eliminado correctamente",
      destino: destinoEliminado,
    }
  } catch (error: unknown) {
    // 4. Manejo de excepciones de lectura/escritura en disco.
    const detalle = error instanceof Error ? error.message : "Error desconocido"
    return {
      exito: false,
      mensaje: `Ocurrió un error al eliminar el destino: ${detalle}`,
    }
  }
}
