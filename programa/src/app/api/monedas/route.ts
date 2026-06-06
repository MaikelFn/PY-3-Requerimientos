import { NextResponse } from "next/server";
// Importamos usando ruta relativa directa para evitar conflictos de alias con Turbopack
import { obtenerTipoCambioOficial } from "../../../lib/cambio";

export async function GET() {
  try {
    const valorDolar = await obtenerTipoCambioOficial();
    
    // Retornamos el valor limpio en formato JSON
    return NextResponse.json({ valorDolar }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo procesar el tipo de cambio" },
      { status: 500 }
    );
  }
}