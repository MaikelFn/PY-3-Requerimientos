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

type DestinoBase = {
  id: number
  nombre: string
}

type TourFormState = {
  nombreTour: string
  destino: string        // nombre del destino
  destinoId: string      // id del destino seleccionado
  precio: string
  duracion: string
  descripcionBreve: string
  itinerario: string
  descripcionDetallada: string
}

export default function FormularioAgregarTours() {
  const [form, setForm] = useState<TourFormState>({
    nombreTour: "",
    destino: "",
    destinoId: "",
    precio: "",
    duracion: "",
    descripcionBreve: "",
    itinerario: "",
    descripcionDetallada: "",
  })

  const [destinos, setDestinos] = useState<DestinoBase[]>([])
  const [cargandoDestinos, setCargandoDestinos] = useState(true)
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<FechaCupo[]>([])
  const [nuevaFecha, setNuevaFecha] = useState("")

  const [imagenes, setImagenes] = useState<ImagenItem[]>([])

  const [mostrarDesplegable, setMostrarDesplegable] = useState(false)
  const [errorDestino, setErrorDestino] = useState(false)

  // Cargar destinos reales desde la API
  useEffect(() => {
    async function cargarDestinos() {
      try {
        const res = await fetch("/api/destinos")
        if (res.ok) {
          const datos = await res.json()
          setDestinos(datos)
        } else {
          console.error("Error al cargar destinos")
        }
      } catch (error) {
        console.error("Error de conexión al cargar destinos:", error)
      } finally {
        setCargandoDestinos(false)
      }
    }
    cargarDestinos()
  }, [])

  const destinosFiltrados = destinos.filter((dest) =>
    dest.nombre.toLowerCase().includes(form.destino.toLowerCase())
  )

  // Validar que el destino ingresado coincida exactamente con alguno de la lista
  useEffect(() => {
    if (form.destino.trim() === "") {
      setErrorDestino(false)
      return
    }
    const existe = destinos.some(
      (dest) => dest.nombre.toLowerCase() === form.destino.toLowerCase()
    )
    setErrorDestino(!existe)
    // Si el destino es válido y tenemos un id previamente seleccionado que coincide, lo mantenemos
    if (existe && !form.destinoId) {
      const destinoEncontrado = destinos.find(
        (dest) => dest.nombre.toLowerCase() === form.destino.toLowerCase()
      )
      if (destinoEncontrado) {
        setForm((prev) => ({ ...prev, destinoId: destinoEncontrado.id.toString() }))
      }
    }
  }, [form.destino, destinos, form.destinoId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Si se modifica el destino manualmente, limpiamos el destinoId
    if (name === "destino") {
      setForm((prev) => ({ ...prev, destinoId: "" }))
    }
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

  const handleSeleccionarDestino = (destinoSeleccionado: DestinoBase) => {
    setForm((prev) => ({
      ...prev,
      destino: destinoSeleccionado.nombre,
      destinoId: destinoSeleccionado.id.toString(),
    }))
    setMostrarDesplegable(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const nuevasImagenes: ImagenItem[] = []

    Array.from(e.target.files).forEach((archivo) => {
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
    if (errorDestino || !form.destinoId) {
      alert("Por favor selecciona un destino válido de la lista.")
      return
    }

    try {
      const formData = new FormData()
      
      formData.append("nombreTour", form.nombreTour)
      formData.append("destinoId", form.destinoId)
      formData.append("precio", form.precio)
      formData.append("duracion", form.duracion)
      formData.append("descripcionBreve", form.descripcionBreve)
      formData.append("itinerario", form.itinerario)
      formData.append("descripcionDetallada", form.descripcionDetallada)
      
      formData.append("fechasYCupos", JSON.stringify(fechasSeleccionadas))

      if (imagenes.length > 0) {
        imagenes.forEach((img) => {
          formData.append("imagenes", img.archivo)
        })
      }

      const respuesta = await fetch("/api/tours", {
        method: "POST",
        body: formData,
      })

      if (!respuesta.ok) {
        const datosError = await respuesta.json()
        alert(datosError.error || "Ocurrió un error al guardar el tour.")
        return
      }

      const tourCreado = await respuesta.json()
      alert(`¡Excelente! El tour "${tourCreado.nombreTour}" ha sido creado con éxito.`)
      
      handleCancel()

    } catch (error) {
      console.error("Error al enviar el formulario:", error)
      alert("Hubo un problema de conexión con el servidor.")
    }
  }

  const handleCancel = () => {
    setForm({
      nombreTour: "",
      destino: "",
      destinoId: "",
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

  // Si aún se están cargando los destinos, mostrar un indicador
  if (cargandoDestinos) {
    return (
      <main className={styles.contenedor}>
        <div className={styles.tarjeta}>
          <p>Cargando destinos...</p>
        </div>
      </main>
    )
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

          {/* Destino con autocompletado desde API */}
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
                  {destinosFiltrados.map((dest) => (
                    <li key={dest.id} onClick={() => handleSeleccionarDestino(dest)} className={styles.opcionDesplegable}>
                      {dest.nombre}
                    </li>
                  ))}
                </ul>
              )}
              {errorDestino && <span className={styles.mensajeError}>[no hay coincidencias con destinos existentes]</span>}
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

          {/* Imágenes — múltiples */}
          <div className={styles.campoVertical}>
            <label className={styles.etiquetaNegrita}>IMAGENES DEL TOUR</label>
            <div className={styles.zonaSubidaHorizontal}>

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