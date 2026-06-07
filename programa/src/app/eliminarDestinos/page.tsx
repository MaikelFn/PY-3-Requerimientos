"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"

type Destino = {
  id: number
  nombre: string
  ubicacion: string
  descripcionBreve: string
  descripcionDetallada: string
  imagenes?: string[]
}

export default function VisualizarDestinos() {
  const router = useRouter()
  
  const [listaDestinos, setListaDestinos] = useState<Destino[]>([])
  const [destinoSeleccionadoId, setDestinoSeleccionadoId] = useState<string>("")
  const [destino, setDestino] = useState<Destino | null>(null)
  const [cargando, setCargando] = useState(false)

  // Cargar destinos desde la API
  useEffect(() => {
    async function obtenerDestinos() {
      try {
        const res = await fetch("/api/destinos")
        if (res.ok) {
          const datos = await res.json()
          setListaDestinos(datos)
        }
      } catch (error) {
        console.error("Error obteniendo los destinos:", error)
      }
    }
    obtenerDestinos()
  }, [])

  const handleSelectDestino = (idString: string) => {
    setDestinoSeleccionadoId(idString)
    if (!idString) {
      setDestino(null)
      return
    }
    const encontrado = listaDestinos.find((d) => d.id === Number(idString))
    setDestino(encontrado || null)
  }

  const handleCancelarSeleccion = () => {
    setDestinoSeleccionadoId("")
    setDestino(null)
  }

  const handleEliminarDestino = async () => {
    if (!destinoSeleccionadoId) return
    const confirmar = confirm(`¿Estás seguro de que deseas eliminar permanentemente el destino "${destino?.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return
    
    setCargando(true)
    try {
      const res = await fetch(`/api/destinos/${destinoSeleccionadoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        alert("Destino eliminado correctamente.")
        setListaDestinos((prev) => prev.filter((d) => d.id !== Number(destinoSeleccionadoId)))
        handleCancelarSeleccion()
      } else {
        alert("Hubo un problema al intentar eliminar el destino.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className={styles.contenedor}>
      <img src="/logo.png" alt="Logo" className={styles.logo} onClick={() => router.push("/paginaPrincipal")}/>
      <div className={styles.tarjeta}>
        
        {/* BOTÓN VOLVER (Solo si no hay selección activa) */}
        {!destinoSeleccionadoId && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <button 
              type="button" 
              onClick={() => router.push("/administrativo")} 
              className={styles.botonCancel}
              style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* SELECTOR DE DESTINO */}
        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorDestino" className={styles.etiqueta} style={{ color: "#000" }}>Seleccionar Destino</label>
          <select 
            id="selectorDestino" 
            className={styles.valorTexto} 
            value={destinoSeleccionadoId} 
            onChange={(e) => handleSelectDestino(e.target.value)}
            disabled={cargando}
            style={{ color: "#000" }}
          >
            <option value="">-- Elige un destino para ver sus detalles --</option>
            {listaDestinos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* DETALLES EN MODO LECTURA */}
        {destino && (
          <div className={styles.formulario}>
            
            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>Nombre del Destino:</span>
              <div className={styles.valorTexto}>{destino.nombre}</div>
            </div>

            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>Ubicación Geográfica:</span>
              <div className={styles.valorTexto}>{destino.ubicacion}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>Breve Descripción</span>
              <div className={styles.bloqueDetalle}>{destino.descripcionBreve}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>Descripción Detallada</span>
              <div 
                className={styles.bloqueDetalle} 
                dangerouslySetInnerHTML={{ __html: destino.descripcionDetallada }} 
              />
            </div>

            {/* Galería de Imágenes */}
            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>Imágenes del Destino</span>
              <div className={styles.galeriaImagenes}>
                {destino.imagenes && destino.imagenes.length > 0 ? (
                  destino.imagenes.map((ruta, idx) => (
                    <img 
                      key={idx} 
                      src={ruta} 
                      alt={`Imagen ${idx + 1}`} 
                      style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} 
                    />
                  ))
                ) : (
                  <div className={styles.valorTexto} style={{ width: "100%", color: "#64748b" }}>Sin imágenes cargadas.</div>
                )}
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className={styles.acciones}>
              <button type="button" onClick={() => router.push("/administrativo")} className={styles.botonCancel} disabled={cargando}>
                Volver al panel
              </button>
              <button type="button" onClick={handleCancelarSeleccion} className={styles.botonCancel} disabled={cargando}>
                Cancelar Selección
              </button>
              <button type="button" onClick={handleEliminarDestino} className={styles.botonEliminar} disabled={cargando}>
                {cargando ? "Eliminando..." : "Eliminar Destino"}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}