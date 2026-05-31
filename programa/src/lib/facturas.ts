import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

export type EstadoPago = "cancelado" | "pendiente"

export type FacturaNueva = {
  tourId: number
  usuarioId: number
  cantidadCupos: number
  fecha: string
  estadoPago: EstadoPago
}

export type FacturaGuardada = FacturaNueva & {
  id: number
  fechaRegistro: string
}

const rutaFacturas = path.join(process.cwd(), "src", "database", "facturas.json")

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

function obtenerSiguienteId(facturas: FacturaGuardada[]): number {
  if (facturas.length === 0) return 1
  return Math.max(...facturas.map(f => typeof f.id === "number" ? f.id : 0)) + 1
}

export async function leerFacturas(): Promise<FacturaGuardada[]> {
  return leerArchivoJSON<FacturaGuardada>(rutaFacturas)
}

export async function obtenerFacturaById(id: number): Promise<FacturaGuardada | null> {
  const facturas = await leerFacturas()
  const factura = facturas.find(f => f.id === id)
  return factura ?? null
}

export async function obtenerFacturasPorUsuario(usuarioId: number): Promise<FacturaGuardada[]> {
  const facturas = await leerFacturas()
  return facturas.filter(f => f.usuarioId === usuarioId)
}

export async function obtenerFacturasPorTour(tourId: number): Promise<FacturaGuardada[]> {
  const facturas = await leerFacturas()
  return facturas.filter(f => f.tourId === tourId)
}

export async function obtenerFacturasPorEstado(estado: EstadoPago): Promise<FacturaGuardada[]> {
  const facturas = await leerFacturas()
  return facturas.filter(f => f.estadoPago === estado)
}

export async function guardarFacturaEnArchivo(datosFactura: FacturaNueva): Promise<FacturaGuardada> {
  const facturas = await leerFacturas()
  const nuevoId = obtenerSiguienteId(facturas)
  
  const nuevaFactura: FacturaGuardada = {
    ...datosFactura,
    id: nuevoId,
    fechaRegistro: new Date().toISOString(),
  }
  
  facturas.push(nuevaFactura)
  await writeFile(rutaFacturas, JSON.stringify(facturas, null, 4), "utf8")
  
  return nuevaFactura
}

export async function actualizarFactura(id: number, actualizaciones: Partial<FacturaNueva>): Promise<FacturaGuardada | null> {
  const facturas = await leerFacturas()
  const indice = facturas.findIndex(f => f.id === id)
  
  if (indice === -1) return null
  
  const facturaActualizada: FacturaGuardada = {
    ...facturas[indice],
    ...actualizaciones,
  }
  
  facturas[indice] = facturaActualizada
  await writeFile(rutaFacturas, JSON.stringify(facturas, null, 4), "utf8")
  
  return facturaActualizada
}

export async function actualizarEstadoPago(id: number, nuevoEstado: EstadoPago): Promise<FacturaGuardada | null> {
  return actualizarFactura(id, { estadoPago: nuevoEstado })
}

export async function eliminarFactura(id: number): Promise<boolean> {
  const facturas = await leerFacturas()
  const indice = facturas.findIndex(f => f.id === id)
  
  if (indice === -1) return false
  
  facturas.splice(indice, 1)
  await writeFile(rutaFacturas, JSON.stringify(facturas, null, 4), "utf8")
  
  return true
}

export async function obtenerResumenFacturasUsuario(usuarioId: number) {
  const facturas = await obtenerFacturasPorUsuario(usuarioId)
  
  return {
    totalFacturas: facturas.length,
    canceladas: facturas.filter(f => f.estadoPago === "cancelado").length,
    pendientes: facturas.filter(f => f.estadoPago === "pendiente").length,
    facturas,
  }
}

export async function obtenerResumenFacturasTour(tourId: number) {
  const facturas = await obtenerFacturasPorTour(tourId)
  const totalCupos = facturas.reduce((sum, f) => sum + f.cantidadCupos, 0)
  
  return {
    totalVentas: facturas.length,
    totalCuposVendidos: totalCupos,
    totalCancelado: facturas.filter(f => f.estadoPago === "cancelado").length,
    totalPendiente: facturas.filter(f => f.estadoPago === "pendiente").length,
    facturas,
  }
}
