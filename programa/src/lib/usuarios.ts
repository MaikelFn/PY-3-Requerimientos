import "server-only"

import { readFile, writeFile } from "fs/promises"
import path from "path"

export type NuevoUsuario = {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
}

export type UsuarioGuardado = NuevoUsuario & {
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
    nombre: datosUsuario.nombre.trim(),
    apellido: datosUsuario.apellido.trim(),
    correo: correoNormalizado,
    contrasena: datosUsuario.contrasena,
    fechaRegistro: new Date().toISOString(),
  }

  usuarios.push(usuarioGuardado)
  await writeFile(rutaUsuarios, JSON.stringify(usuarios, null, 2), "utf8")

  return usuarioGuardado
}
