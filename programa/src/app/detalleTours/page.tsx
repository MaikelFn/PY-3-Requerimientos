"use client"
import { useEffect, useState } from "react"
import {useRouter} from "next/navigation"
import style from "./page.module.css"
import { TourGuardado } from "@/src/lib/tours"
import { useSearchParams } from "next/navigation"

export default function DetalleTours() {
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const router = useRouter()
    const [tour, setTour] = useState<TourGuardado | null>(null)
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)



    useEffect(() => {
        async function cargarTour() {
            try{
                // llamada para obtener el tour por id
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
    // manejo de estados
    if (cargando) return <p>Cargando...</p>
    if (error) return <div>{error}</div>
    if (!tour) return <div>Tour no encontrado</div>

    const lineasItinerario = tour.itinerario?.split("\n").filter(l => l.trim() !== "") || []

    return (
        <div className={style.contenedor}>
            {/*volver*/}
            <button className={style.volver} onClick={() => router.back()}>← Volver</button>
            {tour.imagenes?.map((img, index) => (
                <img key={index} src={img} alt={tour.nombreTour}/>
            ))}

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
                            <span className={style.precio}>₡{Number(tour.precio).toLocaleString()}</span>
                            <span className={style.porPersona}>por persona</span>
                        </div>

                        {/* FECHAS DISPONIBLES */}
                        {tour.fechasYCupos && tour.fechasYCupos.length > 0 && (
                            <div className={style.fechas}>
                                <p className={style.fechasLabel}>Selecciona una fecha</p>
                                {tour.fechasYCupos.map((item, i) => (
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
                        onClick={() => router.push(`/reserva/${tour.id}`)}>Reservar ahora</button>
                        <p className={style.notaReserva}>Sin cobros hasta confirmar</p>
                    </div>
                </div>
            </div>
        </div>
    )
}