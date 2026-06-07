"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { useLanguage } from "@/context/LanguageContext"

type FechaCupo = {
  fecha: string
  cupos: string
}

type ImagenItem = {
  archivo: File | null
  preview: string
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
  imagenes?: string[]
}

type DestinoBase = {
  id: number
  nombre: string
}

export default function FormularioModificarTours() {
  const router = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const [listaTours, setListaTours] = useState<Tour[]>([])
  const [listaDestinosBase, setListaDestinosBase] = useState<string[]>([])
  const [tourSeleccionadoId, setTourSeleccionadoId] = useState<string>("")

  const [form, setForm] = useState({
    nombreTour: "", destino: "", precio: "", duracion: "",
    descripcionBreve: "", itinerario: "", descripcionDetallada: "",
  })

  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<FechaCupo[]>([])
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [imagenes, setImagenes] = useState<ImagenItem[]>([])
  const [mostrarDesplegable, setMostrarDesplegable] = useState(false)
  const [errorDestino, setErrorDestino] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function obtenerDatosIniciales() {
      try {
        const resTours = await fetch("/api/tours")
        if (resTours.ok) setListaTours(await resTours.json())
        const resDestinos = await fetch("/api/destinos")
        if (resDestinos.ok) {
          const datosDestinos: DestinoBase[] = await resDestinos.json()
          setListaDestinosBase(datosDestinos.map(dest => dest.nombre))
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
    if (!idString) { handleLimpiar(); return }
    const tour = listaTours.find((t) => t.id === Number(idString))
    if (tour) {
      setForm({ nombreTour: tour.nombreTour, destino: tour.destino, precio: tour.precio, duracion: tour.duracion, descripcionBreve: tour.descripcionBreve, itinerario: tour.itinerario, descripcionDetallada: tour.descripcionDetallada })
      setFechasSeleccionadas(tour.fechasYCupos || [])
      if (tour.imagenes && Array.isArray(tour.imagenes)) {
        setImagenes(tour.imagenes.map((ruta) => ({ archivo: null, preview: ruta })))
      } else {
        setImagenes([])
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = () => {
    if (editorRef.current) {
      setForm((prev) => ({ ...prev, descripcionDetallada: editorRef.current!.innerHTML }))
    }
  }

  const ejecutarComando = (comando: string) => {
    document.execCommand(comando, false, undefined)
    handleEditorChange()
    editorRef.current?.focus()
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    Array.from(e.target.files).forEach((archivo) => {
      if (imagenes.some((img) => img.archivo?.name === archivo.name)) return
      const reader = new FileReader()
      reader.onload = (evento) => {
        setImagenes((prev) => [...prev, { archivo, preview: evento.target?.result as string }])
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
    if (!tourSeleccionadoId || errorDestino) return
    setCargando(true)
    try {
      const formData = new FormData()
      formData.append("nombreTour", form.nombreTour)
      formData.append("destino", form.destino)
      formData.append("precio", form.precio)
      formData.append("duracion", form.duracion)
      formData.append("descripcionBreve", form.descripcionBreve)
      formData.append("itinerario", form.itinerario)
      formData.append("descripcionDetallada", form.descripcionDetallada)
      formData.append("fechasYCupos", JSON.stringify(fechasSeleccionadas))
      const imagenesExistentesMantenidas: string[] = []
      imagenes.forEach((img) => {
        if (img.archivo === null) imagenesExistentesMantenidas.push(img.preview)
        else formData.append("imagenes", img.archivo)
      })
      formData.append("imagenesExistentes", JSON.stringify(imagenesExistentesMantenidas))
      const res = await fetch(`/api/tours/${tourSeleccionadoId}`, { method: "PUT", body: formData })
      if (res.ok) {
        alert(t("tourModificadoOk"))
        router.push("/administrativo")
      } else {
        alert(t("errorActualizarTour"))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleLimpiar = () => {
    setTourSeleccionadoId("")
    setForm({ nombreTour: "", destino: "", precio: "", duracion: "", descripcionBreve: "", itinerario: "", descripcionDetallada: "" })
    setFechasSeleccionadas([])
    setImagenes([])
    setErrorDestino(false)
    if (editorRef.current) editorRef.current.innerHTML = ""
  }

  const estiloTextoNegro = { color: "#000000" }

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>

        {/* BOTÓN VOLVER */}
        {!tourSeleccionadoId && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <button type="button" onClick={() => router.push("/administrativo")} className={styles.botonCancel}
              style={{ width: "auto", padding: "0.5rem 1.5rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.50rem" }}>
              {t("volver")}
            </button>
          </div>
        )}

        {/* SELECTOR SUPERIOR */}
        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorTour" className={styles.etiqueta} style={{ fontWeight: "bold", color: "#000" }}>
            {t("modificarTourLabel")}
          </label>
          <select id="selectorTour" className={styles.input} value={tourSeleccionadoId}
            onChange={(e) => handleSelectTour(e.target.value)} style={estiloTextoNegro}>
            <option value="">{t("seleccionaTourModificar")}</option>
            {listaTours.map((t) => (
              <option key={t.id} value={t.id} style={estiloTextoNegro}>{t.nombreTour}</option>
            ))}
          </select>
        </div>

        {/* Formulario */}
        {tourSeleccionadoId && (
          <form onSubmit={handleGuardarCambios} className={styles.formulario}>

            <div className={styles.campoHorizontal}>
              <label htmlFor="nombreTour" className={styles.etiqueta}>{t("nombreTourLabel")}</label>
              <input id="nombreTour" name="nombreTour" value={form.nombreTour || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="destino" className={styles.etiqueta}>{t("destinoInputLabel")}</label>
              <div className={styles.contenedorBuscador}>
                <input id="destino" name="destino" value={form.destino || ""} onChange={handleChange}
                  onFocus={() => setMostrarDesplegable(true)}
                  onBlur={() => setTimeout(() => setMostrarDesplegable(false), 200)}
                  className={`${styles.input} ${errorDestino ? styles.inputError : ""}`}
                  style={estiloTextoNegro} autoComplete="off" required disabled={cargando} />
                {mostrarDesplegable && destinosFiltrados.length > 0 && (
                  <ul className={styles.listaDesplegable} style={estiloTextoNegro}>
                    {destinosFiltrados.map((dest, index) => (
                      <li key={index} onClick={() => setForm(p => ({ ...p, destino: dest }))} className={styles.opcionDesplegable} style={estiloTextoNegro}>{dest}</li>
                    ))}
                  </ul>
                )}
                {errorDestino && <span className={styles.mensajeError}>{t("noCoincidenciasDestino")}</span>}
              </div>
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="precio" className={styles.etiqueta}>{t("precioLabel")}</label>
              <input id="precio" name="precio" type="number" min="0" value={form.precio || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="duracion" className={styles.etiqueta}>{t("duracionLabel")}</label>
              <input id="duracion" name="duracion" type="text" value={form.duracion || ""} onChange={handleChange} className={styles.input} style={estiloTextoNegro} required disabled={cargando} />
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="descripcionBreve" className={styles.etiqueta}>{t("breveDescLabel")}</label>
              <div className={styles.contenedorContador}>
                <textarea id="descripcionBreve" name="descripcionBreve" maxLength={150} value={form.descripcionBreve || ""} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={2} required disabled={cargando} />
                <span className={styles.contador}>{(form.descripcionBreve || "").length} / 150</span>
              </div>
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="calendario" className={styles.etiqueta}>{t("añadirFechasLabel")}</label>
              <div className={styles.contenedorFechasDinamicas}>
                <input id="calendario" type="date" value={nuevaFecha} onChange={handleAgregarFecha} className={styles.input} style={estiloTextoNegro} disabled={cargando} />
                {fechasSeleccionadas.length > 0 && (
                  <div className={styles.tablaFechasCupos}>
                    {fechasSeleccionadas.map((item, index) => (
                      <div key={index} className={styles.filaFechaCupo}>
                        <span className={styles.fechaTexto} style={estiloTextoNegro}>{item.fecha}</span>
                        <input type="number" min="1" value={item.cupos || ""} onChange={(e) => handleCuposChange(index, e.target.value)} className={styles.inputCupos} style={estiloTextoNegro} required disabled={cargando} />
                        <button type="button" onClick={() => handleEliminarFecha(index)} className={styles.botonEliminarFecha} disabled={cargando}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.campoHorizontal}>
              <label htmlFor="itinerario" className={styles.etiqueta}>{t("itinerarioLabel")}</label>
              <textarea id="itinerario" name="itinerario" value={form.itinerario || ""} onChange={handleChange} className={styles.textarea} style={estiloTextoNegro} rows={3} required disabled={cargando} />
            </div>

            <div className={styles.campoVertical}>
              <label className={styles.etiquetaNegrita}>{t("descripcionDetalladaLabel")}</label>
              <div className={styles.editorSimulado} style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", background: "#fff" }}>
                <div className={styles.barraEditor} style={{ display: "flex", gap: "8px", padding: "6px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                  <button type="button" onClick={() => ejecutarComando("bold")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontWeight: "bold", color: "#000" }}>B</button>
                  <button type="button" onClick={() => ejecutarComando("italic")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", fontStyle: "italic", color: "#000" }}>I</button>
                  <button type="button" onClick={() => ejecutarComando("underline")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "underline", color: "#000" }}>U</button>
                  <button type="button" onClick={() => ejecutarComando("strikeThrough")} style={{ cursor: "pointer", padding: "2px 8px", background: "#fff", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "line-through", color: "#000" }}>S</button>
                </div>
                <div id="descripcionDetallada" ref={editorRef} contentEditable onInput={handleEditorChange} onBlur={handleEditorChange}
                  style={{ ...estiloTextoNegro, width: "100%", minHeight: "140px", padding: "12px", outline: "none", background: "#ffffff", overflowY: "auto" }} />
              </div>
            </div>

            <div className={styles.campoVertical}>
              <label className={styles.etiquetaNegrita}>{t("imagenesLabel")}</label>
              <div className={styles.zonaSubidaHorizontal}>
                <div className={styles.previsualizaciones}>
                  {imagenes.length === 0 ? (
                    <div className={styles.cuadroFoto}>🌄</div>
                  ) : (
                    imagenes.map((img, index) => (
                      <div key={index} style={{ position: "relative", display: "inline-block" }}>
                        <img src={img.preview} alt={`Preview ${index + 1}`} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                        <button type="button" onClick={() => handleEliminarImagen(index)}
                          style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", lineHeight: "20px", textAlign: "center", padding: 0 }}
                          disabled={cargando}>×</button>
                      </div>
                    ))
                  )}
                </div>
                <label htmlFor="imagenArchivo" className={styles.botonSeleccionar}>
                  {t("seleccionarArchivos")}
                  <input id="imagenArchivo" type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} disabled={cargando} />
                </label>
              </div>
            </div>

            <div className={styles.acciones} style={{ justifyContent: "flex-end", marginTop: "2.5rem" }}>
              <button type="button" onClick={handleLimpiar} className={styles.botonCancel} disabled={cargando}>
                {t("cancelar")}
              </button>
              <button type="submit" className={styles.botonSubmit} disabled={cargando || errorDestino}>
                {cargando ? t("guardando") : t("guardarCambios")}
              </button>
            </div>

          </form>
        )}
      </div>
    </main>
  )
}