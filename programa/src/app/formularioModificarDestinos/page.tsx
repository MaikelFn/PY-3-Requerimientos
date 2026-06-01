"use client"
import { useState, useEffect, useRef } from "react"
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
  const editorRef = useRef<HTMLDivElement>(null)
  
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

  // 1. Cargar destinos desde la API al iniciar la página
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

  // 2. RECUPERACIÓN AUTOMÁTICA DEL TEXTO GUARDADO
  // Este useEffect vigila cuando el usuario selecciona un destino o cambia el id,
  // asegurando que el HTML enriquecido existente se dibuje dentro del cuadro editable.
  useEffect(() => {
    if (destinoSeleccionadoId && editorRef.current) {
      // Evita reescribir el contenido si el usuario ya está escribiendo activamente ahí adentro
      if (editorRef.current.innerHTML !== form.descripcionDetallada) {
        editorRef.current.innerHTML = form.descripcionDetallada || ""
      }
    }
  }, [destinoSeleccionadoId, form.descripcionDetallada])

  // Al seleccionar un destino del dropdown, actualizamos el estado base
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

      if (dest.imagenes && Array.isArray(dest.imagenes)) {
        const imagenesPrecargadas: ImagenItem[] = dest.imagenes.map((ruta) => ({
          archivo: null,
          preview: ruta,
        }))
        setImagenes(imagenesPrecargadas)
      } else {
        setImagenes([])
      }
    }
  }

  // Captura el texto nuevo que digita el usuario en tiempo real en el cuadro editable
  const handleEditorChange = () => {
    if (editorRef.current) {
      const htmlContenido = editorRef.current.innerHTML
      setForm((prev) => ({ ...prev, descripcionDetallada: htmlContenido }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Ejecuta comandos visuales nativos (Negrita, Cursiva, etc)
  const ejecutarComando = (comando: string) => {
    document.execCommand(comando, false, undefined)
    handleEditorChange() // Guarda el cambio inmediatamente en el estado
    if (editorRef.current) {
      editorRef.current.focus()
    }
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
        alert("¡Destino actualizado con éxito!")
        router.push("/administrativo")
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
        router.push("/administrativo")
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
    setDestinoSeleccionadoId("")
    setForm({
      nombre: "",
      ubicacion: "",
      descripcionBreve: "",
      descripcionDetallada: "",
    })
    setImagenes([])
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  const estiloTextoNegro = { color: "#000000" }

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
            style={estiloTextoNegro}
            disabled={cargando}
          >
            <option value="">-- Elige un destino para modificar --</option>
            {listaDestinos.map((d) => (
              <option key={d.id} value={d.id} style={estiloTextoNegro}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {destinoSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>
            
            {/* Nombre del Destino */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="nombre" className={styles.etiqueta}>Nombre del Destino</label>
              <input id="nombre" name="nombre" value={form.nombre || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            {/* Ubicación */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="ubicacion" className={styles.etiqueta}>Ubicación</label>
              <input id="ubicacion" name="ubicacion" value={form.ubicacion || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            {/* Breve Descripción */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve || ""} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={2} required disabled={cargando} />
                <span className={styles.contador}>{(form.descripcionBreve || "").length} / 150</span>
              </div>
            </div>

            {/* Descripción Detallada con Editor Visual En Vivo */}
            <div className={styles.campoVertical}>
              <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA</label>
              <div className={styles.editorSimulado} style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", background: "#fff" }}>
                
                {/* Barra de Herramientas */}
                <div className={styles.barraEditor} style={{ display: "flex", gap: "8px", padding: "6px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <button type="button" onClick={() => ejecutarComando("bold")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontWeight: "bold", color: "#000" }} disabled={cargando}>B</button>
                  <button type="button" onClick={() => ejecutarComando("italic")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontStyle: "italic", color: "#000" }} disabled={cargando}>I</button>
                  <button type="button" onClick={() => ejecutarComando("underline")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "underline", color: "#000" }} disabled={cargando}>U</button>
                  <button type="button" onClick={() => ejecutarComando("strikeThrough")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "line-through", color: "#000" }} disabled={cargando}>S</button>
                </div>
                
                <div 
                  id="descripcionDetallada" 
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorChange}
                  onBlur={handleEditorChange}
                  style={{ 
                    ...estiloTextoNegro, 
                    width: "100%", 
                    minHeight: "140px",
                    padding: "12px", 
                    outline: "none",
                    background: "#ffffff",
                    overflowY: "auto"
                  }} 
                />
              </div>
            </div>

            {/* Imágenes del Destino */}
            <div className={styles.campoVertical}>
              <label className={styles.etiquetaNegrita}>IMÁGENES DEL DESTINO</label>
              <div className={styles.zonaSubidaHorizontal}>
                <div className={styles.previsualizaciones}>
                  {imagenes.length === 0 ? (
                    <div className={styles.cuadroFoto}>🌄</div>
                  ) : (
                    imagenes.map((img, index) => (
                      <div key={index} style={{ position: "relative", display: "inline-block", marginRight: "8px" }}>
                        <img 
                          src={img.preview} 
                          alt={`Preview ${index + 1}`} 
                          style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} 
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarImagen(index)}
                          disabled={cargando}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            fontSize: "12px",
                            lineHeight: "20px",
                            textAlign: "center",
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <label htmlFor="imagenArchivo" className={styles.botonSeleccionar}>
                  Seleccionar Archivos
                  <input 
                    id="imagenArchivo" 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    disabled={cargando}
                  />
                </label>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
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