"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { useLanguage } from "@/context/LanguageContext"

type FechaCupo = { fecha: string; cupos: string }
type Tour = {
  id: number; nombreTour: string; destinoId: number; precio: string; duracion: string
  descripcionBreve: string; itinerario: string; descripcionDetallada: string
  imagenes?: string[]; fechasYCupos?: FechaCupo[]
}
type Destino = { id: number; nombre: string }

export default function VisualizarTours() {
  const router = useRouter()
  const { t } = useLanguage()

  const [listaTours, setListaTours] = useState<Tour[]>([])
  const [listaDestinos, setListaDestinos] = useState<Destino[]>([])
  const [tourSeleccionadoId, setTourSeleccionadoId] = useState<string>("")
  const [tour, setTour] = useState<Tour | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resTours, resDestinos] = await Promise.all([fetch("/api/tours"), fetch("/api/destinos")])
        if (resTours.ok) setListaTours(await resTours.json())
        if (resDestinos.ok) setListaDestinos(await resDestinos.json())
      } catch (error) {
        console.error("Error cargando los datos:", error)
      }
    }
    cargarDatos()
  }, [])

  const handleSelectTour = (idString: string) => {
    setTourSeleccionadoId(idString)
    if (!idString) { setTour(null); return }
    const encontrado = listaTours.find((t) => t.id === Number(idString))
    setTour(encontrado || null)
  }

  const handleCancelarSeleccion = () => { setTourSeleccionadoId(""); setTour(null) }

  const handleEliminarTour = async () => {
    if (!tourSeleccionadoId) return
    const confirmar = confirm(t("confirmarEliminarTour").replace("{nombre}", tour?.nombreTour || ""))
    if (!confirmar) return
    setCargando(true)
    try {
      const res = await fetch(`/api/tours/${tourSeleccionadoId}`, { method: "DELETE" })
      if (res.ok) {
        alert(t("tourEliminadoOk"))
        setListaTours((prev) => prev.filter((t) => t.id !== Number(tourSeleccionadoId)))
        handleCancelarSeleccion()
      } else {
        const err = await res.json()
        alert(err.error || t("errorEliminarTour"))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const nombreDestinoAsociado = listaDestinos.find((d) => d.id === tour?.destinoId)?.nombre || t("noDisponible")

  return (
    <main className={styles.contenedor}>
      <div className={styles.tarjeta}>

        {!tourSeleccionadoId && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
            <button type="button" onClick={() => router.push("/administrativo")} className={styles.botonCancel}
              style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}>
              {t("volver")}
            </button>
          </div>
        )}

        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorTour" className={styles.etiqueta} style={{ color: "#000" }}>{t("seleccionarTourLabel")}</label>
          <select id="selectorTour" className={styles.valorTexto} value={tourSeleccionadoId}
            onChange={(e) => handleSelectTour(e.target.value)} disabled={cargando} style={{ color: "#000" }}>
            <option value="">{t("elegirTourDetalle")}</option>
            {listaTours.map((t) => (
              <option key={t.id} value={t.id}>{t.nombreTour}</option>
            ))}
          </select>
        </div>

        {tour && (
          <div className={styles.formulario}>

            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>{t("nombreTourDetalle")}</span>
              <div className={styles.valorTexto}>{tour.nombreTour}</div>
            </div>

            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>{t("destinoVinculado")}</span>
              <div className={styles.valorTexto}>{nombreDestinoAsociado}</div>
            </div>

            <div className={styles.filaDoble}>
              <div className={styles.campoVertical}>
                <span className={styles.etiquetaNegrita}>{t("precioDetalle")}</span>
                <div className={styles.valorTexto}>{tour.precio}</div>
              </div>
              <div className={styles.campoVertical}>
                <span className={styles.etiquetaNegrita}>{t("duracionDetalle")}</span>
                <div className={styles.valorTexto}>{tour.duracion}</div>
              </div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("breveDescDetalle")}</span>
              <div className={styles.bloqueDetalle}>{tour.descripcionBreve}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("itinerarioDetalle")}</span>
              <div className={styles.bloqueDetalle}>{tour.itinerario}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("descripcionDetalladaDetalle")}</span>
              <div className={styles.bloqueDetalle} dangerouslySetInnerHTML={{ __html: tour.descripcionDetallada }} />
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("fechasDisponiblesCupos")}</span>
              <div className={styles.listaFechas}>
                {tour.fechasYCupos && tour.fechasYCupos.length > 0 ? (
                  tour.fechasYCupos.map((fc, index) => (
                    <div key={index} className={styles.itemFecha}>
                      <span>📅 <strong>{t("fechaLabel")}</strong> {fc.fecha}</span>
                      <span>👥 <strong>{t("cuposRestantes")}</strong> {fc.cupos}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.valorTexto} style={{ color: "#64748b" }}>{t("sinFechas")}</div>
                )}
              </div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("imagenesIlustrativas")}</span>
              <div className={styles.galeriaImagenes}>
                {tour.imagenes && tour.imagenes.length > 0 ? (
                  tour.imagenes.map((ruta, idx) => (
                    <img key={idx} src={ruta} alt={`Imagen ${idx + 1}`}
                      style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  ))
                ) : (
                  <div className={styles.valorTexto} style={{ width: "100%", color: "#64748b" }}>{t("sinImagenes")}</div>
                )}
              </div>
            </div>

            <div className={styles.acciones}>
              <button type="button" onClick={() => router.push("/administrativo")} className={styles.botonCancel} disabled={cargando}>
                {t("volverPanel")}
              </button>
              <button type="button" onClick={handleCancelarSeleccion} className={styles.botonCancel} disabled={cargando}>
                {t("cancelarSeleccion")}
              </button>
              <button type="button" onClick={handleEliminarTour} className={styles.botonEliminar} disabled={cargando}>
                {cargando ? t("eliminando") : t("eliminarTour")}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}