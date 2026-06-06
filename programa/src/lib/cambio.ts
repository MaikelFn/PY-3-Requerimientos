export interface ApiResponseHacienda {
  compra: {
    fecha: string;
    valor: number;
  };
  venta: {
    fecha: string;
    valor: number;
  };
}

/**
 * Conecta de forma segura con la API del Ministerio de Hacienda de Costa Rica.
 * Retorna el valor de la VENTA del dólar.
 */
export async function obtenerTipoCambioOficial(): Promise<number> {
  try {
    // Usamos el fetch nativo. Next.js revalidará la caché cada hora (3600 segundos) automáticamente
    const response = await fetch("https://api.hacienda.go.cr/indicadores/tc/dolar", {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error("No se obtuvo respuesta correcta de Hacienda");
    }

    const data: ApiResponseHacienda = await response.json();
    return data.venta.valor; // Usamos el valor de venta para transacciones comerciales

  } catch (error) {
    console.error("⚠️ Error consultando API de Hacienda, usando respaldo local:", error);
    // Valor de respaldo (fallback) por si el servidor del gobierno está caído
    return 515; 
  }
}