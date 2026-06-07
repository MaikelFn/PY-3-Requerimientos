"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"

type ImagenItem = {
  archivo: File | null
  preview: string
}

type Destino = {
  id: number
  nombre: string
  ubicacion: string
  descripcionBreve: string
  descripcionDetallada: string
  imagenes?: string[]
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

  const [imagenes, setImagenes] = useState<ImagenItem[]>([])
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
        console.error("Error cargando los destinos:", error)
      }
    }
    obtenerDestinos()
  }, [])

  const handleSelectDestino = (idString: string) => {
    setDestinoSeleccionadoId(idString)
    if (!idString) {
      handleLimpiar()
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

      if (dest.imagenes && Array.isArray(dest.imagenes)) {
        setImagenes(dest.imagenes.map(ruta => ({ archivo: null, preview: ruta })))
      } else {
        setImagenes([])
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    Array.from(e.target.files).forEach((archivo) => {
      const yaExiste = imagenes.some((img) => img.archivo?.name === archivo.name)
      if (yaExiste) return

      const reader = new FileReader()
      reader.onload = (evento) => {
        setImagenes((prev) => [
          ...prev,
          { archivo, preview: evento.target?.result as string },
        ])
      }
      reader.readAsDataURL(archivo)
    })
    e.target.value = ""
  }

  const handleEliminarImagen = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinoSeleccionadoId) return
    setCargando(true)

    try {
      const formData = new FormData()
      formData.append("nombre", form.nombre)
      formData.append("ubicacion", form.ubicacion)
      formData.append("descripcionBreve", form.descripcionBreve)
      formData.append("descripcionDetallada", form.descripcionDetallada)

      const imagenesExistentesMantenidas: string[] = []
      imagenes.forEach((img) => {
        if (img.archivo === null) {
          imagenesExistentesMantenidas.push(img.preview)
        } else {
          formData.append("imagenes", img.archivo)
        }
      })
      formData.append("imagenesExistentes", JSON.stringify(imagenesExistentesMantenidas))

      const res = await fetch(`/api/destinos/${destinoSeleccionadoId}`, {
        method: "PUT",
        body: formData,
      })

      if (res.ok) {
        alert("¡Destino modificado exitosamente!")
        router.push("/administrativo")
      } else {
        alert("Error al actualizar el destino.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleLimpiar = () => {
    setDestinoSeleccionadoId("")
    setForm({
      nombre: "",
      ubicacion: "",
      descripcionBreve: "",
      descripcionDetallada: "",
    })
    setImagenes([])
  }

  const estiloTextoNegro = { color: "#000000" }

  return (
    <main className={styles.contenedor}>
      <img src="/logo.png" alt="Logo" className={styles.logo} onClick={() => router.push("/paginaPrincipal")}/>
      <div className={styles.tarjeta}>
        
        {/* BOTÓN VOLVER */}
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

        {/* SELECTOR SUPERIOR */}
        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorDestino" className={styles.etiqueta} style={{ fontWeight: "bold", color: "#000" }}>Modificar Destino</label>
          <select 
            id="selectorDestino" 
            className={styles.input} 
            value={destinoSeleccionadoId} 
            onChange={(e) => handleSelectDestino(e.target.value)}
            style={estiloTextoNegro}
          >
            <option value="">-- Selecciona el destino que deseas modificar --</option>
            {listaDestinos.map((d) => (
              <option key={d.id} value={d.id} style={estiloTextoNegro}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {/* Formulario */}
        {destinoSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>
            
            <div className={styles.campoHorizontal}>
              <label htmlFor="nombre" className={styles.etiqueta}>Nombre del Destino</label>
              <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="ubicacion" className={styles.etiqueta}>Ubicación</label>
              <input id="ubicacion" name="ubicacion" value={form.ubicacion} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={2} required disabled={cargando} />
                <span className={styles.contador}>{form.descripcionBreve.length} / 150</span>
              </div>
            </div>

            <div className={styles.campoVertical}>
              <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>Descripción Detallada</label>
              <textarea id="descripcionDetallada" name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={5} required disabled={cargando} />
            </div>

            <div className={styles.campoVertical}>
              <label className={styles.etiquetaNegrita}>Imágenes del Destino</label>
              <div className={styles.zonaSubidaHorizontal}>
                <div className={styles.previsualizaciones}>
                  {imagenes.length === 0 ? (
                    <div className={styles.cuadroFoto}>🌄</div>
                  ) : (
                    imagenes.map((img, index) => (
                      <div key={index} style={{ position: "relative", display: "inline-block" }}>
                        <img src={img.preview} alt={`Preview ${index + 1}`} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                        <button type="button" onClick={() => handleEliminarImagen(index)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", padding: 0 }} disabled={cargando}>×</button>
                      </div>
                    ))
                  )}
                </div>
                <label htmlFor="imagenArchivo" className={styles.botonSeleccionar}>
                  Seleccionar Archivos
                  <input id="imagenArchivo" type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} disabled={cargando} />
                </label>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className={styles.acciones} style={{ justifyContent: "flex-end", marginTop: "2.5rem" }}>
              <button type="button" onClick={() => router.push("/administrativo")} className={styles.botonCancel} disabled={cargando}>
                Volver al panel
              </button>
              <button type="button" onClick={handleLimpiar} className={styles.botonCancel} disabled={cargando}>
                Cancelar selección
              </button>
              <button type="submit" className={styles.botonSubmit} disabled={cargando}>
                {cargando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>

          </form>
        )}
      </div>
    </main>
  )
}