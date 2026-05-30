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
}

export default function FormularioModificarDestinos() {
  const router = useRouter()
  const [listaDestinos, setListaDestinos] = useState<Destino[]>([])
  const [destinoSeleccionadoId, setDestinoSeleccionadoId] = useState<string>("")
  
  const [form, setForm] = useState({
    nombre: "",
    ubicacion: "",
    descripcionBreve: "",
    descripcionDetallada: "",
  })
  
  const [cargando, setCargando] = useState(false)

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
      handleCancel()
      return
    }

    const dest = listaDestinos.find((d) => d.id === Number(idString))
    if (dest) {
      setForm({
        nombre: dest.nombre,
        ubicacion: dest.ubicacion,
        descripcionBreve: dest.descripcionBreve,
        descripcionDetallada: dest.descripcionDetallada,
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinoSeleccionadoId) return
    setCargando(true)

    try {
      const res = await fetch(`/api/destinos/${destinoSeleccionadoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        alert("¡Destino actualizado con éxito!")
        router.push("/formularioModificarDestinos")
      } else {
        alert("Error al guardar cambios en el destino.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleEliminarDestino = async () => {
    if (!destinoSeleccionadoId) return
    const confirmar = confirm("¿Estás seguro de que deseas eliminar permanentemente este destino?")
    if (!confirmar) return
    setCargando(true)

    try {
      const res = await fetch(`/api/destinos/${destinoSeleccionadoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        alert("Destino eliminado correctamente.")
        router.push("/formularioModificarDestinos")
      } else {
        alert("Hubo un problema al eliminar el destino.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleCancel = () => {
    router.push("/formularioModificarDestinos")
  }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>
        
        {/* SELECTOR DE DESTINO EXISTENTE */}
        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorDestino" className={styles.etiqueta} style={{ fontWeight: "bold", color: "#000" }}>Seleccionar Destino</label>
          <select 
            id="selectorDestino" 
            className={styles.input} 
            value={destinoSeleccionadoId} 
            onChange={(e) => handleSelectDestino(e.target.value)}
          >
            <option value="">-- Elige un destino para modificar --</option>
            {listaDestinos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {destinoSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>
            
            {/* Nombre del Destino */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="nombre" className={styles.etiqueta}>Nombre del Destino</label>
              <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className={styles.input} required />
            </div>

            {/* Ubicación */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="ubicacion" className={styles.etiqueta}>Ubicación</label>
              <input id="ubicacion" name="ubicacion" value={form.ubicacion} onChange={handleChange} className={styles.input} required />
            </div>

            {/* Breve Descripción */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve} onChange={handleChange} className={styles.textarea} rows={2} required />
                <span className={styles.contador}>{form.descripcionBreve.length} / 150</span>
              </div>
            </div>

            {/* Descripción Detallada */}
            <div className={styles.campoVertical}>
              <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA</label>
              <div className={styles.editorSimulado}>
                <div className={styles.barraEditor}>
                  <span><b>B</b></span> <span><i>I</i></span> <span><u>U</u></span> <span><s>S</s></span> <span>≡ ▾</span> <span>🔗</span>
                </div>
                <textarea id="descripcionDetallada" name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} className={styles.textareaEditor} rows={4} required />
              </div>
            </div>

            {/* TRES BOTONES REQUERIDOS */}
            <div className={styles.acciones} style={{ justifyContent: "space-between", marginTop: "2rem" }}>
              <button 
                type="button" 
                onClick={handleEliminarDestino} 
                className={styles.botonCancel} 
                style={{ backgroundColor: "#ef4444", color: "#fff", borderColor: "#dc2626" }}
                disabled={cargando}
              >
                Eliminar Destino
              </button>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={handleCancel} className={styles.botonCancel} disabled={cargando}>
                  Cancelar
                </button>
                <button type="submit" className={styles.botonSubmit} disabled={cargando}>
                  {cargando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </main>
  )
}