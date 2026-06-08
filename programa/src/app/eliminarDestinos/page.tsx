"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { useLanguage } from "@/context/LanguageContext"

type Destino = {
  id: number; nombre: string; ubicacion: string
  descripcionBreve: string; descripcionDetallada: string; imagenes?: string[]
}

export default function VisualizarDestinos() {
  const router = useRouter()
  const { t } = useLanguage()

  const [listaDestinos, setListaDestinos] = useState<Destino[]>([])
  const [destinoSeleccionadoId, setDestinoSeleccionadoId] = useState<string>("")
  const [destino, setDestino] = useState<Destino | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    async function obtenerDestinos() {
      try {
        const res = await fetch("/api/destinos")
        if (res.ok) setListaDestinos(await res.json())
      } catch (error) {
        console.error("Error obteniendo los destinos:", error)
      }
    }
    obtenerDestinos()
  }, [])

  const handleSelectDestino = (idString: string) => {
    setDestinoSeleccionadoId(idString)
    if (!idString) { setDestino(null); return }
    const encontrado = listaDestinos.find((d) => d.id === Number(idString))
    setDestino(encontrado || null)
  }

  const handleCancelarSeleccion = () => { setDestinoSeleccionadoId(""); setDestino(null) }

  const handleEliminarDestino = async () => {
    if (!destinoSeleccionadoId) return
    const confirmar = confirm(t("confirmarEliminarDestino").replace("{nombre}", destino?.nombre || ""))
    if (!confirmar) return
    setCargando(true)
    try {
      const res = await fetch(`/api/destinos/${destinoSeleccionadoId}`, { method: "DELETE" })
      if (res.ok) {
        alert(t("destinoEliminadoOk"))
        setListaDestinos((prev) => prev.filter((d) => d.id !== Number(destinoSeleccionadoId)))
        handleCancelarSeleccion()
      } else {
        alert(t("errorEliminarDestino"))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className={styles.contenedor}>
      <img src="/logo.png" alt="Logo" className={styles.logo} onClick={() => router.push("/paginaPrincipal")} />
      <div className={styles.tarjeta}>

        {!destinoSeleccionadoId && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
          </div>
        )}

        <div className={styles.campoHorizontal} style={{ marginBottom: "2rem", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem" }}>
          <label htmlFor="selectorDestino" className={styles.etiqueta} style={{ color: "#000" }}>{t("seleccionarDestinoLabel")}</label>
          <select id="selectorDestino" className={styles.valorTexto} value={destinoSeleccionadoId}
            onChange={(e) => handleSelectDestino(e.target.value)} disabled={cargando} style={{ color: "#000" }}>
            <option value="">{t("elegirDestinoDetalle")}</option>
            {listaDestinos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        {destino && (
          <div className={styles.formulario}>

            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>{t("nombreDestinoDetalle")}</span>
              <div className={styles.valorTexto}>{destino.nombre}</div>
            </div>

            <div className={styles.campoHorizontal}>
              <span className={styles.etiqueta}>{t("ubicacionGeografica")}</span>
              <div className={styles.valorTexto}>{destino.ubicacion}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("breveDescDetalle")}</span>
              <div className={styles.bloqueDetalle}>{destino.descripcionBreve}</div>
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("descripcionDetalladaDetalle")}</span>
              <div className={styles.bloqueDetalle} dangerouslySetInnerHTML={{ __html: destino.descripcionDetallada }} />
            </div>

            <div className={styles.campoVertical}>
              <span className={styles.etiquetaNegrita}>{t("imagenesDestinoDetalle")}</span>
              <div className={styles.galeriaImagenes}>
                {destino.imagenes && destino.imagenes.length > 0 ? (
                  destino.imagenes.map((ruta, idx) => (
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
              <button type="button" onClick={handleEliminarDestino} className={styles.botonEliminar} disabled={cargando}>
                {cargando ? t("eliminando") : t("eliminarDestino")}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}