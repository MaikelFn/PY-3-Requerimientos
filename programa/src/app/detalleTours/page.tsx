"use client"
import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import style from "./page.module.css"
import { useSearchParams } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"
import { useLanguage } from "@/context/LanguageContext"

export const dynamic = 'force-dynamic'

// Tipo extendido con campos traducidos
type TourGuardado = {
    id: number
    nombreTour: string
    destinoId: number
    precio: string
    duracion: string
    descripcionBreve: string
    itinerario: string
    descripcionDetallada: string
    imagenes?: string[]
    fechasYCupos: { fecha: string; cupos: string }[]
    fechaRegistro: string
    // campos en inglés
    nombreTourEn?: string
    descripcionBreveEn?: string
    itinerarioEn?: string
    descripcionDetalladaEn?: string
}

// Helper: retorna el valor en el idioma correcto, con fallback al español
function campo(valor_es: string, valor_en: string | undefined, idioma: string): string {
    if (idioma === "en" && valor_en && valor_en.trim() !== "") return valor_en;
    return valor_es;
}

function DetalleToursContenido() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const router = useRouter()
    const [tour, setTour] = useState<TourGuardado | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
    const [imagenActiva, setImagenActiva] = useState(0)
    const { formatCurrency } = useCurrency()
    const { idioma, t } = useLanguage()

    useEffect(() => {
        async function cargarTour() {
            try {
                const respuesta = await fetch("/api/tours")
                const datosTour = await respuesta.json()
                const tourEncontrado = datosTour.find((t: TourGuardado) => Number(t.id) === Number(id))
                if (!tourEncontrado) {
                    setError(t("tourNoEncontrado"))
                } else {
                    setTour(tourEncontrado)
                }
            } catch {
                setError(t("errorCargarTour"))
            } finally {
                setCargando(false)
            }
        }
        if (id) cargarTour()
    }, [id])

    if (cargando) return <p>{t("cargar")}</p>
    if (error) return <div>{error}</div>
    if (!tour) return <div>{t("tourNoEncontrado")}</div>

    // Campos según idioma activo
    const nombreMostrar       = campo(tour.nombreTour,         tour.nombreTourEn,         idioma)
    const descBreveMostrar    = campo(tour.descripcionBreve,   tour.descripcionBreveEn,   idioma)
    const descDetalleMostrar  = campo(tour.descripcionDetallada, tour.descripcionDetalladaEn, idioma)
    const itinerarioMostrar   = campo(tour.itinerario,         tour.itinerarioEn,         idioma)

    const lineasItinerario = itinerarioMostrar?.split("\n").filter(l => l.trim() !== "") || []

    return (
        <div className={style.contenedor}>
            {/* Volver */}
            <img
                src="/logo.png"
                alt="Logo"
                className={style.logo}
                onClick={() => router.push("/paginaPrincipal")}
            />

            {/* Galería de imágenes */}
            <div className={style.galeria}>
                <div className={style.imagenPrincipal}>
                    {tour.imagenes && tour.imagenes.length > 0 ? (
                        <img src={tour.imagenes[imagenActiva]} alt={nombreMostrar} />
                    ) : (
                        <div className={style.sinImagen}>📷</div>
                    )}
                </div>
                {tour.imagenes && tour.imagenes.length > 1 && (
                    <div className={style.miniaturas}>
                        {tour.imagenes.map((img, i) => (
                            <div
                                key={i}
                                className={`${style.miniatura} ${i === imagenActiva ? style.miniaturaActiva : ""}`}
                                onClick={() => setImagenActiva(i)}
                            >
                                <img src={img} alt={`Imagen ${i + 1}`} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TÍTULO */}
            <h1 className={style.titulo}>{nombreMostrar}</h1>
            <p className={style.descripcionCorta}>{descBreveMostrar}</p>

            {/* CUERPO */}
            <div className={style.cuerpo}>

                {/* COLUMNA IZQUIERDA */}
                <div className={style.columnaIzquierda}>

                    {/* DESCRIPCIÓN DETALLADA */}
                    <section className={style.seccion}>
                        <p className={style.descripcionDetallada}>{descDetalleMostrar}</p>
                    </section>

                    {/* INFORMACIÓN GENERAL */}
                    <section className={style.seccion}>
                        <h2 className={style.tituloSeccion}>{t("informacionGeneral")}</h2>
                        <div className={style.infoGeneral}>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>🕐</span>
                                <div>
                                    <p className={style.infoLabel}>{t("duracion2")}</p>
                                    {/* duracion no se traduce, es un valor como "3 horas" */}
                                    <p className={style.infoValor}>{tour.duracion}</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>✅</span>
                                <div>
                                    <p className={style.infoLabel}>{t("cancelacion2")}</p>
                                    <p className={style.infoValor}>{t("cancelacionGratis2")}</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>👥</span>
                                <div>
                                    <p className={style.infoLabel}>{t("grupo2")}</p>
                                    <p className={style.infoValor}>{t("grupoPrivado2")}</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>🗺️</span>
                                <div>
                                    <p className={style.infoLabel}>{t("guia2")}</p>
                                    <p className={style.infoValor}>{t("guiaEspecializado2")}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ITINERARIO*/}
                    {lineasItinerario.length > 0 && (
                        <section className={style.seccion}>
                            <h2 className={style.tituloSeccion}>{t("itinerario2")}</h2>
                            <div className={style.itinerario}>
                                {lineasItinerario.map((linea, i) => (
                                    <div key={i} className={style.pasoItinerario}>
                                        <div className={style.pasoPunto}></div>
                                        <p>{linea.replace(/^\d+\.\s*/, "")}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* COLUMNA DERECHA - RESERVA */}
                <div className={style.columnaDerecha}>
                    <div className={style.reserva}>
                        <div className={style.precioTour}>
                            <span className={style.desde}>{t("desde2")}</span>
                            <span className={style.precio}>{formatCurrency(Number(tour.precio))}</span>
                            <span className={style.porPersona}>{t("porPersona2")}</span>
                        </div>

                        {/* FECHAS DISPONIBLES */}
                        {tour.fechasYCupos && tour.fechasYCupos.filter(f => Number(f.cupos) > 0).length > 0 && (
                            <div className={style.fechas}>
                                <p className={style.fechasLabel}>{t("fechasDisponibles2")}</p>
                                {tour.fechasYCupos.filter(item => Number(item.cupos) > 0).map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${style.fechaItem} ${fechaSeleccionada === item.fecha ? style.fechaSeleccionada : ""}`}
                                        onClick={() => setFechaSeleccionada(item.fecha)}
                                    >
                                        <span className={style.fechaTexto}>
                                            📅 {new Date(item.fecha).toLocaleDateString(
                                                idioma === "en" ? "en-US" : "es-CR",
                                                { weekday: "long", day: "numeric", month: "long" }
                                            )}
                                        </span>
                                        <span className={style.cupos}>
                                            {item.cupos} {t("cuposDisponibles2")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className={style.btnReservar}
                            onClick={() => router.push(`/paginaReservas?id=${tour.id}`)}
                        >
                            {t("reservarAhora2")}
                        </button>
                        <p className={style.notaReserva}>{t("sinCobros2")}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DetalleTours() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <p>Cargando...</p>
            </div>
        }>
            <DetalleToursContenido />
        </Suspense>
    )
}