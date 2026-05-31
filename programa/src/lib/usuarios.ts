import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

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

const rutaUsuarios = path.join(process.cwd(), "src", "database", "usuarios.json")

async function leerUsuarios(): Promise<UsuarioGuardado[]> {
  try {
    const contenido = await readFile(rutaUsuarios, "utf8")
    if (!contenido.trim()) {
      return []
    }

    const usuarios = JSON.parse(contenido) as UsuarioGuardado[]
    return Array.isArray(usuarios) ? usuarios : []
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

function obtenerSiguienteId(usuarios: UsuarioGuardado[]) {
  if (usuarios.length === 0) {
    return 0
  }

  return usuarios.reduce((mayorId, usuario) => {
    const idUsuario = typeof usuario.id === "number" ? usuario.id : -1
    return idUsuario > mayorId ? idUsuario : mayorId
  }, -1) + 1
}

export async function guardarUsuarioEnArchivo(datosUsuario: NuevoUsuario) {
  const usuarios = await leerUsuarios()
  const correoNormalizado = datosUsuario.correo.trim().toLowerCase()

  const usuarioDuplicado = usuarios.find(
    (usuario) => usuario.correo.trim().toLowerCase() === correoNormalizado
  )

  if (usuarioDuplicado) {
    throw new Error("El correo ya está registrado")
  }

  const usuarioGuardado: UsuarioGuardado = {
    id: obtenerSiguienteId(usuarios),
    nombre: datosUsuario.nombre.trim(),
    apellido: datosUsuario.apellido.trim(),
    correo: correoNormalizado,
    contrasena: datosUsuario.contrasena,
    roll: datosUsuario.roll ?? "Cliente",
    fechaRegistro: new Date().toISOString(),
  }

  usuarios.push(usuarioGuardado)
  await writeFile(rutaUsuarios, JSON.stringify(usuarios, null, 2), "utf8")

  return usuarioGuardado
}

export async function autenticarUsuario(
  correo: string,
  contrasena: string
): Promise<Omit<UsuarioGuardado, "contrasena">> {
  const usuarios = await leerUsuarios()
  const correoNormalizado = correo.trim().toLowerCase()

  const usuario = usuarios.find(
    (u) => u.correo.trim().toLowerCase() === correoNormalizado
  )

  if (!usuario || usuario.contrasena !== contrasena) {
    throw new Error("Credenciales inválidas")
  }

  const { contrasena: _con, ...usuarioSinContrasena } = usuario
  return usuarioSinContrasena
}

export async function actulizarContrasena(correo: string, nuevaContrasena: string): Promise<void> {
  const usuarios = await leerUsuarios()
  const correoNormalizado = correo.trim().toLowerCase() //convierte el correo a minusculas y eleimina los espacios
  const indiceUsuario = usuarios.findIndex(u => u.correo.trim().toLowerCase() === correoNormalizado)
  if (indiceUsuario === -1) throw new Error("Usuario no encontrado")
    usuarios[indiceUsuario].contrasena = nuevaContrasena
  await writeFile(rutaUsuarios, JSON.stringify(usuarios, null, 2), "utf8")
}

