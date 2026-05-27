import { NextResponse } from "next/server"
import { guardarUsuarioEnArchivo } from "../../../lib/usuarios"

function validarDatosRegistro(
  nombre: unknown,
  apellido: unknown,
  correo: unknown,
  contrasena: unknown
): { valido: boolean; error?: string } {
  if (!nombre || !apellido || !correo || !contrasena) {
    return { valido: false, error: "Faltan datos de registro" }
  }
  return { valido: true }
}

function ocultarContrasena<T extends Record<string, any>>(
  objeto: T
): Omit<T, "contrasena"> {
  const { contrasena: _, ...sinContrasena } = objeto
  return sinContrasena
}

export async function POST(request: Request) {
  try {
    const { nombre, apellido, correo, contrasena } = await request.json()

    const validacion = validarDatosRegistro(nombre, apellido, correo, contrasena)
    if (!validacion.valido) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const nuevoUsuario = await guardarUsuarioEnArchivo({ nombre, apellido, correo, contrasena })
    return NextResponse.json(ocultarContrasena(nuevoUsuario))
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error en registro" },
      { status: 400 }
    )
  }
}
