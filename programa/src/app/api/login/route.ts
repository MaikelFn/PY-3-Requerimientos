import { NextResponse } from "next/server"
import { autenticarUsuario } from "../../../lib/usuarios"

export async function POST(request: Request) {
  try {
    const { correo, contrasena } = await request.json()

    if (!correo || !contrasena) {
      return new NextResponse(JSON.stringify({ error: "Faltan credenciales" }), { status: 400 })
    }

    const usuario = await autenticarUsuario(correo, contrasena)
    return NextResponse.json(usuario)
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error?.message || "Error" }), { status: 401 })
  }
}
