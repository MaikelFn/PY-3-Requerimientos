import { useState, useEffect } from "react"

export function useBrowserTranslation() {
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(false)
  const [cargandoTraduccion, setCargandoTraduccion] = useState<boolean>(false)

  useEffect(() => {
    // Verificar si el navegador actual soporta la API experimental de traducción con IA
    // @ts-ignore - Evitamos errores de tipos ya que la API es muy nueva y no está en los tipos estándar de TS
    if (typeof window !== "undefined" && window.ai && window.ai.translator) {
      setIsAiAvailable(true)
    }
  }, [])

  const traducirTexto = async (texto: string, idiomaDestino: string, idiomaOrigen: string = "es"): Promise<string> => {
    if (!texto) return ""
    
    if (idiomaDestino === idiomaOrigen) return texto

    if (!isAiAvailable) {
      return texto
    }

    try {
      setCargandoTraduccion(true)
      
      // @ts-ignore
      const translator = await window.ai.translator.create({
        sourceLanguage: idiomaOrigen,
        targetLanguage: idiomaDestino,
      })

      const resultado = await translator.translate(texto)
      await translator.destroy()
      
      return resultado
    } catch (error) {
      console.error("Error al traducir con la IA del navegador:", error)
      return texto 
    } finally {
      setCargandoTraduccion(false)
    }
  }

  return { isAiAvailable, traducirTexto, cargandoTraduccion }
}