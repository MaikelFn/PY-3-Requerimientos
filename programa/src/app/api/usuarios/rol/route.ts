import { NextResponse } from "next/server"
import { actualizarRolUsuario, obtenerTodosLosUsuarios } from "@/lib/usuarios" 

export async function GET() {
  try {
    const usuarios = await obtenerTodosLosUsuarios()
    return NextResponse.json(usuarios)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al obtener usuarios" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { correo, nuevoRol } = await request.json()

    if (!correo || !nuevoRol) {
      return NextResponse.json({ error: "Faltan datos requeridos (correo o nuevoRol)" }, { status: 400 })
    }

    if (nuevoRol !== "Cliente" && nuevoRol !== "Administrador") {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 })
    }

    const usuarioActualizado = await actualizarRolUsuario(correo, nuevoRol)
    return NextResponse.json({ mensaje: "Rol actualizado con éxito", usuario: usuarioActualizado })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al actualizar el rol" },
      { status: 500 }
    )
  }
}