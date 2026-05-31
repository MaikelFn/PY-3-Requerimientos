import { BaseNextResponse } from "next/dist/server/base-http"
import { verificarCodigo, eliminarCodigo } from "@/src/lib/codigos"
import { actulizarContrasena } from "@/src/lib/usuarios"
import { NextResponse } from "next/server"
import { error } from "console"

export async function POST(request: Request) {
    try {
        const { correo, codigo, nuevaContrasena } = await request.json()
        if (!correo || !codigo || !nuevaContrasena) {
            return NextResponse.json({ error: "Codigo invalido o expirado"}, { status: 400})
        }
        await actulizarContrasena(correo, nuevaContrasena)
        eliminarCodigo(correo)
        return NextResponse.json({ ok: true})
    }catch (error: any) {
        return NextResponse.json({error: error?.message || "Error al cambiar la contraseña"}, { status: 400})
    }
}