import { NextResponse } from "next/server"
import { guardarUsuarioEnArchivo } from "../../../lib/usuarios"

export async function POST(request: Request) {
  try {
    const { nombre, apellido, correo, contrasena } = await request.json()

    if (!nombre || !apellido || !correo || !contrasena) {
      return new NextResponse(JSON.stringify({ error: "Faltan datos de registro" }), { status: 400 })
    }

    const nuevoUsuario = await guardarUsuarioEnArchivo({ nombre, apellido, correo, contrasena })

    // devolver sin la contraseña
    const { contrasena: _c, ...usuarioSinContrasena } = nuevoUsuario
    return NextResponse.json(usuarioSinContrasena)
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error?.message || "Error" }), { status: 400 })
  }
}
