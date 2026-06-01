"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"

type FechaCupo = {
  fecha: string
  cupos: string
}

type Tour = {
  id: number
  nombreTour: string
  destino: string
  precio: string
  duracion: string
  descripcionBreve: string
  itinerario: string
  descripcionDetallada: string
  fechasYCupos?: FechaCupo[]
}

type DestinoBase = {
  id: number
  nombre: string
}

export default function FormularioModificarTours() {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [listaTours, setListaTours] = useState<Tour[]>([])
  const [listaDestinosBase, setListaDestinosBase] = useState<string[]>([]) 
  const [tourSeleccionadoId, setTourSeleccionadoId] = useState<string>("")
  
  const [form, setForm] = useState({
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
  const [mostrarDesplegable, setMostrarDesplegable] = useState(false)
  const [errorDestino, setErrorDestino] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function obtenerDatosIniciales() {
      try {

        const resTours = await fetch("/api/tours")
        if (resTours.ok) {
          const datosTours = await resTours.json()
          setListaTours(datosTours)
        }

        const resDestinos = await fetch("/api/destinos")
        if (resDestinos.ok) {
          const datosDestinos: DestinoBase[] = await resDestinos.json()
          const nombresDestinos = datosDestinos.map(dest => dest.nombre)
          setListaDestinosBase(nombresDestinos)
        }
      } catch (error) {
        console.error("Error al obtener los datos iniciales:", error)
      }
    }
    obtenerDatosIniciales()
  }, [])

  useEffect(() => {
    if (tourSeleccionadoId && editorRef.current) {
      if (editorRef.current.innerHTML !== form.descripcionDetallada) {
        editorRef.current.innerHTML = form.descripcionDetallada || ""
      }
    }
  }, [tourSeleccionadoId, form.descripcionDetallada])

  const destinosFiltrados = listaDestinosBase.filter((dest) =>
    dest.toLowerCase().includes((form.destino || "").toLowerCase())
  )

  useEffect(() => {
    if (!form.destino || form.destino.trim() === "") {
      setErrorDestino(false)
    } else {
      setErrorDestino(destinosFiltrados.length === 0)
    }
  }, [form.destino, destinosFiltrados.length])

  const handleSelectTour = (idString: string) => {
    setTourSeleccionadoId(idString)
    if (!idString) {
      handleLimpiar()
      return
    }

    const tour = listaTours.find((t) => t.id === Number(idString))
    if (tour) {
      setForm({
        nombreTour: tour.nombreTour,
        destino: tour.destino,
        precio: tour.precio,
        duracion: tour.duracion,
        descripcionBreve: tour.descripcionBreve,
        itinerario: tour.itinerario,
        descripcionDetallada: tour.descripcionDetallada,
      })
      setFechasSeleccionadas(tour.fechasYCupos || [])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      const htmlContenido = editorRef.current.innerHTML
      setForm((prev) => ({ ...prev, descripcionDetallada: htmlContenido }))
    }
  }

  const ejecutarComando = (comando: string) => {
    document.execCommand(comando, false, undefined)
    handleEditorChange()
    if (editorRef.current) {
      editorRef.current.focus()
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

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tourSeleccionadoId || errorDestino) return
    setCargando(true)

    try {
      const res = await fetch(`/api/tours/${tourSeleccionadoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fechasYCupos: fechasSeleccionadas }),
      })

      if (res.ok) {
        alert("¡Tour modificado exitosamente!")
        router.push("/formularioModificarTours")
      } else {
        alert("Error al actualizar el tour.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleEliminarTour = async () => {
    if (!tourSeleccionadoId) return
    const confirmar = confirm("¿Estás completamente seguro de eliminar este tour? Esta acción no se puede deshacer.")
    if (!confirmar) return
    setCargando(true)

    try {
      const res = await fetch(`/api/tours/${tourSeleccionadoId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        alert("El tour ha sido eliminado correctamente.")
        router.push("/formularioModificarTours")
      } else {
        alert("Hubo un error al intentar eliminar el tour.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleLimpiar = () => {
    setTourSeleccionadoId("")
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
    setErrorDestino(false)
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  const estiloTextoNegro = { color: "#000000" }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>
        
        {/* SELECTOR SUPERIOR DE TOURS */}
        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorTour" className={styles.etiqueta} style={{ fontWeight: "bold", color: "#000" }}>Modificar Tour</label>
          <select 
            id="selectorTour" 
            className={styles.input} 
            value={tourSeleccionadoId} 
            onChange={(e) => handleSelectTour(e.target.value)}
            style={estiloTextoNegro}
          >
            <option value="">-- Selecciona el tour que deseas modificar --</option>
            {listaTours.map((t) => (
              <option key={t.id} value={t.id} style={estiloTextoNegro}>{t.nombreTour}</option>
            ))}
          </select>
        </div>

        {/* Formulario que sólo aparece si hay un tour seleccionado */}
        {tourSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>

            {/* Nombre del Tour */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="nombreTour" className={styles.etiqueta}>Nombre del Tour</label>
              <input id="nombreTour" name="nombreTour" value={form.nombreTour || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            {/* Destino con autocompletado extraído de la Base de Datos */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="destino" className={styles.etiqueta}>Destino</label>
              <div className={styles.contenedorBuscador}>
                <input
                  id="destino"
                  name="destino"
                  value={form.destino || ""}
                  onChange={handleChange}
                  onFocus={() => setMostrarDesplegable(true)}
                  onBlur={() => setTimeout(() => setMostrarDesplegable(false), 200)}
                  className={`${styles.input} ${errorDestino ? styles.inputError : ""}`}
                  style={estiloTextoNegro}
                  autoComplete="off"
                  required
                  disabled={cargando}
                />
                {mostrarDesplegable && destinosFiltrados.length > 0 && (
                  <ul className={styles.listaDesplegable} style={estiloTextoNegro}>
                    {destinosFiltrados.map((dest, index) => (
                      <li key={index} onClick={() => setForm(p => ({ ...p, destino: dest }))} className={styles.opcionDesplegable} style={estiloTextoNegro}>{dest}</li>
                    ))}
                  </ul>
                )}
                {errorDestino && <span className={styles.mensajeError}>[no hay coincidencias con destinos existentes]</span>}
              </div>
            </div>

            {/* Precio */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="precio" className={styles.etiqueta}>Precio ($ USD)</label>
              <input id="precio" name="precio" type="number" min="0" value={form.precio || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            {/* Duración */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="duracion" className={styles.etiqueta}>Duración</label>
              <input id="duracion" name="duracion" type="text" value={form.duracion || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            {/* Breve Descripción */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve || ""} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={2} required disabled={cargando} />
                <span className={styles.contador}>{(form.descripcionBreve || "").length} / 150</span>
              </div>
            </div>

            {/* Fechas y Cupos */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="calendario" className={styles.etiqueta}>Añadir Fechas</label>
              <div className={styles.contenedorFechasDinamicas}>
                <input id="calendario" type="date" value={nuevaFecha} onChange={handleAgregarFecha} className={styles.input} style={estiloTextoNegro} disabled={cargando} />
                {fechasSeleccionadas.length > 0 && (
                  <div className={styles.tablaFechasCupos}>
                    {fechasSeleccionadas.map((item, index) => (
                      <div key={index} className={styles.filaFechaCupo}>
                        <span className={styles.fechaTexto} style={estiloTextoNegro}>{item.fecha}</span>
                        <input
                          type="number"
                          min="1"
                          value={item.cupos || ""}
                          onChange={(e) => handleCuposChange(index, e.target.value)}
                          className={styles.inputCupos}
                          style={estiloTextoNegro}
                          required
                          disabled={cargando}
                        />
                        <button type="button" onClick={() => handleEliminarFecha(index)} className={styles.botonEliminarFecha} disabled={cargando}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Itinerario */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="itinerario" className={styles.etiqueta}>Itinerario</label>
              <textarea id="itinerario" name="itinerario" value={form.itinerario || ""} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={3} required disabled={cargando} />
            </div>

            {/* Descripción Detallada Visual En Vivo */}
            <div className={styles.campoVertical}>
              <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA DEL TOUR</label>
              <div className={styles.editorSimulado} style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", background: "#fff" }}>
                
                {/* Barra de Herramientas Operativa */}
                <div className={styles.barraEditor} style={{ display: "flex", gap: "8px", padding: "6px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <button type="button" onClick={() => ejecutarComando("bold")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontWeight: "bold", color: "#000" }}>B</button>
                  <button type="button" onClick={() => ejecutarComando("italic")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontStyle: "italic", color: "#000" }}>I</button>
                  <button type="button" onClick={() => ejecutarComando("underline")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "underline", color: "#000" }}>U</button>
                  <button type="button" onClick={() => ejecutarComando("strikeThrough")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "line-through", color: "#000" }}>S</button>
                </div>

                {/* Área de Visualización Interactiva */}
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

            {/* BOTONES DE ACCIÓN */}
            <div className={styles.acciones} style={{ justifyContent: "space-between", marginTop: "2.5rem" }}>
              <button 
                type="button" 
                onClick={handleEliminarTour} 
                className={styles.botonCancel} 
                style={{ backgroundColor: "#ef4444", color: "#ffffff", borderColor: "#dc2626" }}
                disabled={cargando}
              >
                Eliminar Tour
              </button>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" onClick={() => router.push("/formularioModificarTours")} className={styles.botonCancel} disabled={cargando}>
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