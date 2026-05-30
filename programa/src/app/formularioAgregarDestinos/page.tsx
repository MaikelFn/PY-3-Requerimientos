"use client"
import { useState } from "react"
import styles from "./page.module.css"

type FormState = {
  nombre: string
  ubicacion: string
  descripcionBreve: string
  descripcionDetallada: string
}

type ImagenItem = {
  archivo: File
  preview: string
}

export default function FormularioAgregarDestinos() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    ubicacion: "",
    descripcionBreve: "",
    descripcionDetallada: "",
  })

  const [imagenes, setImagenes] = useState<ImagenItem[]>([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    Array.from(e.target.files).forEach((archivo) => {
      // Evitar duplicados por nombre
      const yaExiste = imagenes.some((img) => img.archivo.name === archivo.name)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje(null)

    try {
      const formData = new FormData()
      formData.append("nombre", form.nombre)
      formData.append("ubicacion", form.ubicacion)
      formData.append("descripcionBreve", form.descripcionBreve)
      formData.append("descripcionDetallada", form.descripcionDetallada)

      if (imagenes.length > 0) {
        imagenes.forEach((img) => {
          formData.append("imagenes", img.archivo)
        })
      }

      const respuesta = await fetch("/api/destinos", {
        method: "POST",
        body: formData,
      })

      if (!respuesta.ok) {
        const error = await respuesta.json()
        throw new Error(error.error || "Error al guardar el destino")
      }

      const destino = await respuesta.json()
      setMensaje({ tipo: "exito", texto: `¡Destino "${destino.nombre}" agregado correctamente!` })
      
      // Limpiar formulario
      setTimeout(() => {
        setForm({
          nombre: "",
          ubicacion: "",
          descripcionBreve: "",
          descripcionDetallada: "",
        })
        setImagenes([])
        setMensaje(null)
      }, 2000)
    } catch (error: any) {
      setMensaje({ tipo: "error", texto: error.message })
    } finally {
      setCargando(false)
    }
  }

  // Función para manejar la acción de cancelar (Limpia el formulario)
  const handleCancel = () => {
    setForm({
      nombre: "",
      ubicacion: "",
      descripcionBreve: "",
      descripcionDetallada: "",
    })
    setImagenes([])
    setMensaje(null)
  }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>
        {mensaje && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            backgroundColor: mensaje.tipo === "exito" ? "#d4edda" : "#f8d7da",
            color: mensaje.tipo === "exito" ? "#155724" : "#721c24",
            border: `1px solid ${mensaje.tipo === "exito" ? "#c3e6cb" : "#f5c6cb"}`,
          }}>
            {mensaje.texto}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.formulario}>
          
          {/* Nombre del Destino */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="nombre" className={styles.etiqueta}>Nombre del Destino</label>
            <input 
              id="nombre" 
              name="nombre" 
              value={form.nombre} 
              onChange={handleChange} 
              className={styles.input} 
              required 
              disabled={cargando}
            />
          </div>

          {/* Ubicación */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="ubicacion" className={styles.etiqueta}>Ubicación</label>
            <input 
              id="ubicacion" 
              name="ubicacion" 
              value={form.ubicacion} 
              onChange={handleChange} 
              className={styles.input} 
              required 
              disabled={cargando}
            />
          </div>

          {/* Breve Descripción */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
            <div className={styles.contenedorContador}>
              <textarea 
                id="descripcionBreve" 
                name="descripcionBreve" 
                maxLength={150} 
                value={form.descripcionBreve} 
                onChange={handleChange} 
                className={styles.textarea} 
                rows={2} 
                required 
                disabled={cargando}
              />
              <span className={styles.contador}>{form.descripcionBreve.length} / 150</span>
            </div>
          </div>

          {/* Descripción Detallada con barra de herramientas simulada */}
          <div className={styles.campoVertical}>
            <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA</label>
            <div className={styles.editorSimulado}>
              <div className={styles.barraEditor}>
                <span><b>B</b></span> <span><i>I</i></span> <span><u>U</u></span> <span><s>S</s></span> <span>x₂</span> <span>A ▾</span> <span>Text ▾</span> <span>≡ ▾</span> <span>⋮≡</span> <span>···</span> <span>🔗</span> <span>⟲</span> <span>⟳</span>
              </div>
              <textarea 
                id="descripcionDetallada" 
                name="descripcionDetallada" 
                value={form.descripcionDetallada} 
                onChange={handleChange} 
                className={styles.textareaEditor} 
                rows={4} 
                required 
                disabled={cargando}
              />
            </div>
          </div>

          {/* Sección de Imagen/Multimedia */}
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
                      {/* Botón para eliminar imagen individual */}
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

              {/* Input acepta múltiples archivos utilizando la propiedad 'multiple' */}
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

          {/* Botones de acción */}
          <div className={styles.acciones}>
            <button 
              type="button" 
              onClick={handleCancel} 
              className={styles.botonCancel}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.botonSubmit}
              disabled={cargando}
            >
              {cargando ? "Guardando..." : "Agregar destino"}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}