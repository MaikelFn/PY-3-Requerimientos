"use client"
import { useState, useEffect } from "react"
import styles from "./page.module.css"

type FechaCupo = {
  fecha: string
  cupos: string
}

type ImagenItem = {
  archivo: File
  preview: string
}

type TourFormState = {
  nombreTour: string
  destino: string
  precio: string
  duracion: string
  descripcionBreve: string
  itinerario: string
  descripcionDetallada: string
}

const destinosRegistrados = [
  "La Fortuna, Alajuela",
  "Manuel Antonio, Puntarenas",
  "Tamarindo, Guanacaste",
  "Monteverde, Puntarenas",
  "Puerto Viejo, Limón"
]

export default function FormularioAgregarTours() {
  const [form, setForm] = useState<TourFormState>({
    nombreTour: "",
    destino: "",
    precio: "",
    duracion: "",
    descripcionBreve: "",
    itinerario: "",
    descripcionDetallada: "",
  })

  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<FechaCupo[]>([])
  const [nuevaFecha, setNuevaFecha] = useState("")

  const [imagenes, setImagenes] = useState<ImagenItem[]>([])

  const [mostrarDesplegable, setMostrarDesplegable] = useState(false)
  const [errorDestino, setErrorDestino] = useState(false)

  const destinosFiltrados = destinosRegistrados.filter((dest) =>
    dest.toLowerCase().includes(form.destino.toLowerCase())
  )

  useEffect(() => {
    if (form.destino.trim() === "") {
      setErrorDestino(false)
    } else {
      setErrorDestino(destinosFiltrados.length === 0)
    }
  }, [form.destino])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAgregarFecha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaElegida = e.target.value
    if (!fechaElegida) return
    if (!fechasSeleccionadas.some(item => item.fecha === fechaElegida)) {
      setFechasSeleccionadas([...fechasSeleccionadas, { fecha: fechaElegida, cupos: "" }])
    }
    setNuevaFecha("")
  }

  const handleCuposChange = (index: number, cantidad: string) => {
    const copias = [...fechasSeleccionadas]
    copias[index].cupos = cantidad
    setFechasSeleccionadas(copias)
  }

  const handleEliminarFecha = (index: number) => {
    setFechasSeleccionadas(fechasSeleccionadas.filter((_, i) => i !== index))
  }

  const handleSeleccionarDestino = (destinoSeleccionado: string) => {
    setForm((prev) => ({ ...prev, destino: destinoSeleccionado }))
    setMostrarDesplegable(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const nuevasImagenes: ImagenItem[] = []

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (errorDestino) return

    const datosFinales = {
      ...form,
      fechasYCupos: fechasSeleccionadas,
      imagenes: imagenes.map((img) => img.archivo.name),
    }
    console.log("Enviar todo el esquema del tour:", datosFinales)
  }

  const handleCancel = () => {
    setForm({
      nombreTour: "",
      destino: "",
      precio: "",
      duracion: "",
      descripcionBreve: "",
      itinerario: "",
      descripcionDetallada: "",
    })
    setFechasSeleccionadas([])
    setImagenes([])
    setErrorDestino(false)
  }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>
        <form onSubmit={handleSubmit} className={styles.formulario}>

          {/* Nombre del Tour */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="nombreTour" className={styles.etiqueta}>Nombre del Tour</label>
            <input id="nombreTour" name="nombreTour" value={form.nombreTour} onChange={handleChange} className={styles.input} placeholder="Ej: Caminata Nocturna Guiada" required />
          </div>

          {/* Destino */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="destino" className={styles.etiqueta}>Destino</label>
            <div className={styles.contenedorBuscador}>
              <input
                id="destino"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                onFocus={() => setMostrarDesplegable(true)}
                onBlur={() => setTimeout(() => setMostrarDesplegable(false), 200)}
                className={`${styles.input} ${errorDestino ? styles.inputError : ""}`}
                placeholder="Escribe para buscar destinos registrados..."
                autoComplete="off"
                required
              />
              {mostrarDesplegable && destinosFiltrados.length > 0 && (
                <ul className={styles.listaDesplegable}>
                  {destinosFiltrados.map((dest, index) => (
                    <li key={index} onClick={() => handleSeleccionarDestino(dest)} className={styles.opcionDesplegable}>{dest}</li>
                  ))}
                </ul>
              )}
              {errorDestino && <span className={styles.mensajeError}>[no hay coincidencias con tours existentes]</span>}
            </div>
          </div>

          {/* Precio */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="precio" className={styles.etiqueta}>Precio ($ USD)</label>
            <input id="precio" name="precio" type="number" min="0" value={form.precio} onChange={handleChange} className={styles.input} placeholder="0.00" required />
          </div>

          {/* Duración */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="duracion" className={styles.etiqueta}>Duración</label>
            <input id="duracion" name="duracion" type="text" value={form.duracion} onChange={handleChange} className={styles.input} placeholder="Ej: 3 horas o 2 días" required />
          </div>

          {/* Breve Descripción */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
            <div className={styles.contenedorContador}>
              <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve} onChange={handleChange} className={styles.textarea} placeholder="Resumen corto del tour..." rows={2} required />
              <span className={styles.contador}>{form.descripcionBreve.length} / 150</span>
            </div>
          </div>

          {/* Fechas y Cupos */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="calendario" className={styles.etiqueta}>Añadir Fechas</label>
            <div className={styles.contenedorFechasDinamicas}>
              <input
                id="calendario"
                type="date"
                value={nuevaFecha}
                onChange={handleAgregarFecha}
                className={styles.input}
              />
              {fechasSeleccionadas.length > 0 && (
                <div className={styles.tablaFechasCupos}>
                  {fechasSeleccionadas.map((item, index) => (
                    <div key={index} className={styles.filaFechaCupo}>
                      <span className={styles.fechaTexto}>{item.fecha}</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Cupos disponibles"
                        value={item.cupos}
                        onChange={(e) => handleCuposChange(index, e.target.value)}
                        className={styles.inputCupos}
                        required
                      />
                      <button type="button" onClick={() => handleEliminarFecha(index)} className={styles.botonEliminarFecha}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Itinerario */}
          <div className={styles.campoHorizontal}>
            <label htmlFor="itinerario" className={styles.etiqueta}>Itinerario</label>
            <textarea id="itinerario" name="itinerario" value={form.itinerario} onChange={handleChange} className={styles.textarea} placeholder="Ej: 08:00 AM - Salida del hotel, 10:00 AM - Llegada al sendero..." rows={3} required />
          </div>

          {/* Descripción Detallada */}
          <div className={styles.campoVertical}>
            <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA DEL TOUR</label>
            <div className={styles.editorSimulado}>
              <div className={styles.barraEditor}>
                <span><b>B</b></span> <span><i>I</i></span> <span><u>U</u></span> <span><s>S</s></span> <span>x₂</span> <span>A ▾</span> <span>Text ▾</span> <span>≡ ▾</span> <span>⋮≡</span> <span>···</span> <span>🔗</span> <span>⟲</span> <span>⟳</span>
              </div>
              <textarea id="descripcionDetallada" name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} className={styles.textareaEditor} rows={5} required />
            </div>
          </div>

          {/* Imágenes — múltiples*/}
          <div className={styles.campoVertical}>
            <label className={styles.etiquetaNegrita}>IMAGENES DEL TOUR</label>
            <div className={styles.zonaSubidaHorizontal}>

              {/* Previews de todas las imágenes agregadas */}
              <div className={styles.previsualizaciones}>
                {imagenes.length === 0 ? (
                  <div className={styles.cuadroFoto}>🌄</div>
                ) : (
                  imagenes.map((img, index) => (
                    <div key={index} style={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                      />
                      {/* Botón para eliminar imagen individual */}
                      <button
                        type="button"
                        onClick={() => handleEliminarImagen(index)}
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

              {/* Input acepta múltiples archivos */}
              <label htmlFor="imagenArchivo" className={styles.botonSeleccionar}>
                Seleccionar Archivos
                <input
                  id="imagenArchivo"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>

            </div>
          </div>

          {/* Botones */}
          <div className={styles.acciones}>
            <button type="button" onClick={handleCancel} className={styles.botonCancel}>Cancelar</button>
            <button type="submit" className={styles.botonSubmit} disabled={errorDestino}>Agregar tour</button>
          </div>

        </form>
      </div>
    </main>
  )
}