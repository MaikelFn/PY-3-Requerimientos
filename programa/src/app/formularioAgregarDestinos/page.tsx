"use client"
import { useState } from "react"
import styles from "./page.module.css"

type FormState = {
  nombre: string
  ubicacion: string
  fecha: string
  descripcionBreve: string
  descripcionDetallada: string
  imagenUrl: string
}

export default function FormularioAgregarDestinos() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    ubicacion: "",
    fecha: "",
    descripcionBreve: "",
    descripcionDetallada: "",
    imagenUrl: "",
  })

  const [metodoImagen, setMetodoImagen] = useState<"archivo" | "url">("archivo")
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoImagen(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const datosFinales = {
      ...form,
      imagen: metodoImagen === "url" ? form.imagenUrl : archivoImagen?.name || ""
    }
    console.log("Enviar destino:", datosFinales)
  }

  // Función para manejar la acción de cancelar (Limpia el formulario)
  const handleCancel = () => {
    setForm({
      nombre: "",
      ubicacion: "",
      fecha: "",
      descripcionBreve: "",
      descripcionDetallada: "",
      imagenUrl: "",
    })
    setArchivoImagen(null)
    console.log("Acción cancelada")
  }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>
        <form onSubmit={handleSubmit} className={styles.formulario}>
          
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

          {/* Duración */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="fecha" className={styles.etiqueta}>Duración</label>
            <input id="fecha" name="fecha" type="text" placeholder="Ej: 3 horas" value={form.fecha} onChange={handleChange} className={styles.input} required />
          </div>

          {/* Breve Descripción */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
            <div className={styles.contenedorContador}>
              <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve} onChange={handleChange} className={styles.textarea} rows={2} required />
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
              <textarea id="descripcionDetallada" name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} className={styles.textareaEditor} rows={4} required />
            </div>
          </div>

          {/* Sección de Imagen/Multimedia Flexible */}
          <div className={styles.campoVertical}>
            <label className={styles.etiquetaNegrita}>MULTIMEDIA</label>
            
            <div className={styles.selectorMetodo}>
              <button type="button" className={`${styles.botonMetodo} ${metodoImagen === "archivo" ? styles.activo : ""}`} onClick={() => setMetodoImagen("archivo")}>Desde Dispositivo</button>
              <button type="button" className={`${styles.botonMetodo} ${metodoImagen === "url" ? styles.activo : ""}`} onClick={() => setMetodoImagen("url")}>Desde URL Web</button>
            </div>

            {metodoImagen === "archivo" ? (
              <div className={styles.zonaSubidaHorizontal}>
                <div className={styles.previsualizaciones}>
                  <div className={styles.cuadroFoto}>🌄</div>
                  {archivoImagen && <div className={styles.cuadroFotoCargada}>📄</div>}
                </div>
                <label htmlFor="imagenArchivo" className={styles.botonSeleccionar}>
                  Seleccionar Archivos
                  <input id="imagenArchivo" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <input id="imagenUrl" name="imagenUrl" type="url" placeholder="https://ejemplo.com/imagen.jpg" value={form.imagenUrl} onChange={handleChange} className={styles.input} />
            )}
          </div>

          {/* Botones de acción */}
          <div className={styles.acciones}>
            <button type="button" onClick={handleCancel} className={styles.botonCancel}>
              Cancelar
            </button>
            <button type="submit" className={styles.botonSubmit}>
              Agregar destino
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}