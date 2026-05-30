"use client"
import { useState, useEffect } from "react"
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
//Modificar para que el destino se traoiga de  la base de datos
const destinosRegistrados = [
  "La Fortuna, Alajuela",
  "Manuel Antonio, Puntarenas",
  "Tamarindo, Guanacaste",
  "Monteverde, Puntarenas",
  "Puerto Viejo, Limón"
]

export default function FormularioModificarTours() {
  const router = useRouter()
  const [listaTours, setListaTours] = useState<Tour[]>([])
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
    async function obtenerTours() {
      try {
        const res = await fetch("/api/tours")
        if (res.ok) {
          const datos = await res.json()
          setListaTours(datos)
        }
      } catch (error) {
        console.error("Error al obtener los tours:", error)
      }
    }
    obtenerTours()
  }, [])

  const destinosFiltrados = destinosRegistrados.filter((dest) =>
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
        router.push("/formularioModificarTours") // Recarga la página para actualizar la lista de tours
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
        router.push("/formularioModificarTours") // Recarga la página para actualizar la lista de tours
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
  }

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
          >
            <option value="">-- Selecciona el tour que deseas modificar --</option>
            {listaTours.map((t) => (
              <option key={t.id} value={t.id}>{t.nombreTour}</option>
            ))}
          </select>
        </div>

        {/* Formulario que sólo aparece si hay un tour seleccionado */}
        {tourSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>

            {/* Nombre del Tour */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="nombreTour" className={styles.etiqueta}>Nombre del Tour</label>
              <input id="nombreTour" name="nombreTour" value={form.nombreTour} onChange={handleChange} className={styles.input} required disabled={cargando} />
            </div>

            {/* Destino con autocompletado */}
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
                  autoComplete="off"
                  required
                  disabled={cargando}
                />
                {mostrarDesplegable && destinosFiltrados.length > 0 && (
                  <ul className={styles.listaDesplegable}>
                    {destinosFiltrados.map((dest, index) => (
                      <li key={index} onClick={() => setForm(p => ({ ...p, destino: dest }))} className={styles.opcionDesplegable}>{dest}</li>
                    ))}
                  </ul>
                )}
                {errorDestino && <span className={styles.mensajeError}>[no hay coincidencias con destinos existentes]</span>}
              </div>
            </div>

            {/* Precio */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="precio" className={styles.etiqueta}>Precio ($ USD)</label>
              <input id="precio" name="precio" type="number" min="0" value={form.precio} onChange={handleChange} className={styles.input} required disabled={cargando} />
            </div>

            {/* Duración */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="duracion" className={styles.etiqueta}>Duración</label>
              <input id="duracion" name="duracion" type="text" value={form.duracion} onChange={handleChange} className={styles.input} required disabled={cargando} />
            </div>

            {/* Breve Descripción */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>Breve Descripción</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve} onChange={handleChange} className={styles.textarea} rows={2} required disabled={cargando} />
                <span className={styles.contador}>{form.descripcionBreve.length} / 150</span>
              </div>
            </div>

            {/* Fechas y Cupos */}
            <div className={styles.campoHorizontal}>
              <label htmlFor="calendario" className={styles.etiqueta}>Añadir Fechas</label>
              <div className={styles.contenedorFechasDinamicas}>
                <input id="calendario" type="date" value={nuevaFecha} onChange={handleAgregarFecha} className={styles.input} disabled={cargando} />
                {fechasSeleccionadas.length > 0 && (
                  <div className={styles.tablaFechasCupos}>
                    {fechasSeleccionadas.map((item, index) => (
                      <div key={index} className={styles.filaFechaCupo}>
                        <span className={styles.fechaTexto}>{item.fecha}</span>
                        <input
                          type="number"
                          min="1"
                          value={item.cupos}
                          onChange={(e) => handleCuposChange(index, e.target.value)}
                          className={styles.inputCupos}
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
              <textarea id="itinerario" name="itinerario" value={form.itinerario} onChange={handleChange} className={styles.textarea} rows={3} required disabled={cargando} />
            </div>

            {/* Descripción Detallada */}
            <div className={styles.campoVertical}>
              <label htmlFor="descripcionDetallada" className={styles.etiquetaNegrita}>DESCRIPCIÓN DETALLADA DEL TOUR</label>
              <div className={styles.editorSimulado}>
                <div className={styles.barraEditor}>
                  <span><b>B</b></span> <span><i>I</i></span> <span><u>U</u></span> <span><s>S</s></span> <span>≡ ▾</span> <span>🔗</span>
                </div>
                <textarea id="descripcionDetallada" name="descripcionDetallada" value={form.descripcionDetallada} onChange={handleChange} className={styles.textareaEditor} rows={4} required disabled={cargando} />
              </div>
            </div>

            {/* ESTRUCTURA DE LOS 3 BOTONES SOLICITADOS */}
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
                <button type="button" onClick={() => router.push("/")} className={styles.botonCancel} disabled={cargando}>
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