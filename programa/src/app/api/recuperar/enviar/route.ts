import { NextResponse } from "next/server"
import { Resend } from "resend"
import { generarCodigo, guardarCodigo } from "@/src/lib/codigos"

//LLave generada por RESEND
const resend = new Resend("re_NvxY6T3B_5hmzLUTGwn6CiY3469N46xpv")

export async function POST(request: Request) {
    try {
        const { correo } = await request.json()
        if (!correo) return NextResponse.json({ error: "Correo requerido"}, {status: 400})
        const codigo = generarCodigo()
        guardarCodigo(correo, codigo)
        await resend.emails.send({ 
            from: "CR Tours <onboarding@resend.dev>",
            to: correo,
            subject: "Código de recuperación - CR Tours",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
                    <h2 style="color: #1a6b3c;">Recuperación de contraseña</h2>
                    <p>Tu código de verificación es:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a6b3c; padding: 20px; background: #f0faf4; border-radius: 10px; text-align: center;">
                        ${codigo}
                    </div>
                    <p style="color: #888; font-size: 13px;">Este código expira en 15 minutos.</p>
                </div>`
            })
            return NextResponse.json({ok: true})
        }catch (error) {
            return NextResponse.json({error: "Error al enviar el correo"}, {status:500})
    }
}