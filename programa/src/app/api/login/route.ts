import { NextResponse } from "next/server"
import { autenticarUsuario } from "../../../lib/usuarios"

function validarCredenciales(correo: unknown, contrasena: unknown): { valido: boolean; error?: string } {
  if (!correo || !contrasena) {
    return { valido: false, error: "Faltan credenciales" }
  }
  return { valido: true }
}

export async function POST(request: Request) {
  try {
    const { correo, contrasena } = await request.json()

    const validacion = validarCredenciales(correo, contrasena)
    if (!validacion.valido) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const usuario = await autenticarUsuario(correo, contrasena)
    return NextResponse.json(usuario)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error en autenticación" },
      { status: 401 }
    )
  }
}
