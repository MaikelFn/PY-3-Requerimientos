"use client"
import { Suspense } from "react"
import { useEffect, useState } from "react"
import {useRouter} from "next/navigation"
import style from "./page.module.css"
import { TourGuardado } from "@/lib/tours"
import { useSearchParams } from "next/navigation"
import { useCurrency } from "@/context/CurrencyContext"

export const dynamic = 'force-dynamic'

function DetalleToursContenido() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const router = useRouter()
    const [tour, setTour] = useState<TourGuardado | null>(null)
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
    const [imagenActiva, setImagenActiva] = useState(0)
    const { formatCurrency } = useCurrency()

    useEffect(() => {
        async function cargarTour() {
            try{
                const respuesta = await fetch("/api/tours")
                const datosTour = await respuesta.json()
                const tourEncontrado = datosTour.find((t: TourGuardado) => Number(t.id) === Number(id))
                if (!tourEncontrado) {
                    setError("Tour no encontrado")
                }else {
                    setTour(tourEncontrado)
                }
            } catch (error) {
                setError("Error al cargar el tour")
            } finally {
                setCargando(false)
            }
        }
        if (id) cargarTour()
    }, [id])

    if (cargando) return <p>Cargando...</p>
    if (error) return <div>{error}</div>
    if (!tour) return <div>Tour no encontrado</div>

    const lineasItinerario = tour.itinerario?.split("\n").filter(l => l.trim() !== "") || []

    return (
        <div className={style.contenedor}>
            {/*volver*/}
            <img src="/logo.png" alt="Logo" className={style.logo} onClick={() => router.push("/paginaPrincipal")}/>
            
            {/*Galeria de imágenes*/}
            <div className={style.galeria}>
                <div className={style.imagenPrincipal}>
                    {tour.imagenes && tour.imagenes.length > 0 ? (
                        <img src={tour.imagenes[imagenActiva]} alt={tour.nombreTour} />
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
            <h1 className={style.titulo}>{tour.nombreTour}</h1>
            <p className={style.descripcionCorta}>{tour.descripcionBreve}</p>

            {/* CUERPO */}
            <div className={style.cuerpo}>

                {/* COLUMNA IZQUIERDA */}
                <div className={style.columnaIzquierda}>

                    {/* DESCRIPCIÓN */}
                    <section className={style.seccion}>
                        <p className={style.descripcionDetallada}>{tour.descripcionDetallada}</p>
                    </section>

                    {/* INFORMACIÓN GENERAL */}
                    <section className={style.seccion}>
                        <h2 className={style.tituloSeccion}>Información general</h2>
                        <div className={style.infoGeneral}>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>🕐</span>
                                <div>
                                    <p className={style.infoLabel}>Duración</p>
                                    <p className={style.infoValor}>{tour.duracion}</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>✅</span>
                                <div>
                                    <p className={style.infoLabel}>Cancelación</p>
                                    <p className={style.infoValor}>Gratuita con 24h de antelación</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>👥</span>
                                <div>
                                    <p className={style.infoLabel}>Grupo</p>
                                    <p className={style.infoValor}>Grupo privado disponible</p>
                                </div>
                            </div>
                            <div className={style.infoItem}>
                                <span className={style.infoIcono}>🗺️</span>
                                <div>
                                    <p className={style.infoLabel}>Guía</p>
                                    <p className={style.infoValor}>Guía especializado incluido</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ITINERARIO */}
                    {lineasItinerario.length > 0 && (
                        <section className={style.seccion}>
                            <h2 className={style.tituloSeccion}>Itinerario</h2>
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
                            <span className={style.desde}>Desde</span>
                            <span className={style.precio}>{formatCurrency(Number(tour.precio))}</span>
                            <span className={style.porPersona}>por persona</span>
                        </div>

                        {/* FECHAS DISPONIBLES */}
                        {tour.fechasYCupos && tour.fechasYCupos.filter(f => Number(f.cupos) > 0).length > 0 && (
                            <div className={style.fechas}>
                                <p className={style.fechasLabel}>Fechas disponibles</p>
                                {tour.fechasYCupos.filter(item => Number(item.cupos) > 0).map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${style.fechaItem} ${fechaSeleccionada === item.fecha ? style.fechaSeleccionada : ""}`}
                                        onClick={() => setFechaSeleccionada(item.fecha)}>
                                        <span className={style.fechaTexto}>
                                            📅 {new Date(item.fecha).toLocaleDateString("es-CR", {
                                                weekday: "long", day: "numeric", month: "long"
                                            })}
                                        </span>
                                        <span className={style.cupos}>{item.cupos} cupos disponibles</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className={style.btnReservar}
                        onClick={() => router.push(`/paginaReservas?id=${tour.id}`)}>Reservar ahora</button>
                        <p className={style.notaReserva}>Sin cobros hasta confirmar</p>
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