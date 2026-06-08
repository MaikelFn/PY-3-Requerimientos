import "server-only"
import { getDb } from "./mongodb"
import type { WithId, Document } from "mongodb"

export type Roll = "Cliente" | "Administrador"

export type NuevoUsuario = {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  roll?: Roll
}

export type UsuarioGuardado = NuevoUsuario & {
  id: number
  roll: Roll
  fechaRegistro: string
}

async function getNextId(): Promise<number> {
  const db = await getDb()
  const docs = await db.collection("usuarios").find({}, { projection: { id: 1 } }).toArray()
  if (docs.length === 0) return 0
  return Math.max(...docs.map(d => typeof d.id === "number" ? d.id : -1)) + 1
}

export async function guardarUsuarioEnArchivo(datosUsuario: NuevoUsuario): Promise<UsuarioGuardado> {
  const db = await getDb()
  const correoNormalizado = datosUsuario.correo.trim().toLowerCase()
  const existente = await db.collection("usuarios").findOne({ correo: correoNormalizado })
  if (existente) throw new Error("El correo ya está registrado")
  const id = await getNextId()
  const usuario: UsuarioGuardado = {
    id,
    nombre: datosUsuario.nombre.trim(),
    apellido: datosUsuario.apellido.trim(),
    correo: correoNormalizado,
    contrasena: datosUsuario.contrasena,
    roll: datosUsuario.roll ?? "Cliente",
    fechaRegistro: new Date().toISOString(),
  }
  await db.collection("usuarios").insertOne({ ...usuario })
  return usuario
}

export async function autenticarUsuario(correo: string, contrasena: string): Promise<Omit<UsuarioGuardado, "contrasena">> {
  const db = await getDb()
  const doc = await db.collection("usuarios").findOne({ correo: correo.trim().toLowerCase() })
  if (!doc || doc.contrasena !== contrasena) throw new Error("Credenciales inválidas")
  const { _id, contrasena: _c, ...rest } = doc
  return rest as Omit<UsuarioGuardado, "contrasena">
}

export async function actulizarContrasena(correo: string, nuevaContrasena: string): Promise<void> {
  const db = await getDb()
  const result = await db.collection("usuarios").updateOne(
    { correo: correo.trim().toLowerCase() },
    { $set: { contrasena: nuevaContrasena } }
  )
  if (result.matchedCount === 0) throw new Error("Usuario no encontrado")
}

export async function actualizarRolUsuario(correo: string, nuevoRol: Roll): Promise<Omit<UsuarioGuardado, "contrasena">> {
  const db = await getDb()
  const correoNormalizado = correo.trim().toLowerCase()
  await db.collection("usuarios").updateOne({ correo: correoNormalizado }, { $set: { roll: nuevoRol } })
  const doc = await db.collection("usuarios").findOne({ correo: correoNormalizado })
  if (!doc) throw new Error("Usuario no encontrado")
  const { _id, contrasena, ...rest } = doc
  return rest as Omit<UsuarioGuardado, "contrasena">
}

export async function obtenerTodosLosUsuarios(): Promise<Omit<UsuarioGuardado, "contrasena">[]> {
  const db = await getDb()
  const docs = await db.collection("usuarios").find({}).toArray()
  return docs.map(({ _id, contrasena, ...rest }) => ({ ...rest, roll: rest.roll ?? "Cliente" }) as Omit<UsuarioGuardado, "contrasena">)
}

export async function obtenerUsuarioById(id: number): Promise<Omit<UsuarioGuardado, "contrasena"> | null> {
  const db = await getDb()
  const doc = await db.collection("usuarios").findOne({ id })
  if (!doc) return null
  const { _id, contrasena, ...rest } = doc
  return rest as Omit<UsuarioGuardado, "contrasena">
}