"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import style from "./page.module.css"
import { useCurrency } from "@/context/CurrencyContext"

type Reserva = {
    id: number
    tourId: number
    usuarioId: number
    cantidadCupos: number
    fecha: string
    estadoReserva: "confirmada" | "pendiente" | "cancelada"
    fechaRegistro: string
}

type Tour = {
    id: number
    nombreTour: string
    precio: string
    imagenes?: string[]
    duracion: string
}

export default function HistorialReservas() {
    const router = useRouter()
    const { formatCurrency } = useCurrency()
    const [reservas, setReservas] = useState<Reserva[]>([])
    const [tours, setTours] = useState<Tour[]>([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario")
        if (!usuarioGuardado) {
            router.push("/")
            return
        }
        const usuario = JSON.parse(usuarioGuardado)

        async function cargarDatos() {
            try {
                const [resReservas, resTours] = await Promise.all([
                    fetch(`/api/reservas?usuarioId=${usuario.id}`),
                    fetch("/api/tours")
                ])
                const datosReservas = await resReservas.json()
                const datosTours = await resTours.json()
                setReservas(datosReservas)
                setTours(datosTours)
            } catch (error) {
                console.error("Error al cargar datos:", error)
            } finally {
                setCargando(false)
            }
        }
        cargarDatos()
    }, [])

    function obtenerTour(tourId: number): Tour | undefined {
        return tours.find(t => t.id === tourId)
    }

    function colorEstado(estado: string) {
        if (estado === "confirmada") return style.estadoConfirmada
        if (estado === "cancelada") return style.estadoCancelada
        return style.estadoPendiente
    }

    if (cargando) return (
        <div className={style.estadoCarga}>
            <div className={style.spinner}></div>
            <p>Cargando reservas...</p>
        </div>
    )

    return (
        <div className={style.pagina}>
            {/* ENCABEZADO */}
            <div className={style.encabaezado}>
                <img src="/logo.png" alt="Logo" className={style.logo} onClick={() => router.push("/paginaPrincipal")}/>
                <h1 className={style.titulo}>Mis reservas</h1>
            </div>

            <div className={style.contenedor}>
                {reservas.length === 0 ? (
                    <div className={style.sinReservas}>
                        <span>🗓️</span>
                        <p>No tienes reservas registradas aún.</p>
                        <button className={style.botonExplorar} onClick={() => router.push("/paginaPrincipal")}>
                            Explorar tours
                        </button>
                    </div>
                ) : (
                    <div className={style.lista}>
                        {reservas.map(reserva => {
                            const tour = obtenerTour(reserva.tourId)
                            const precioTotal = tour ? Number(tour.precio) * reserva.cantidadCupos : 0
                            return (
                                <div key={reserva.id} className={style.tarjeta}>
                                    {/* IMAGEN */}
                                    <div className={style.imagenContenedor}>
                                        {tour?.imagenes && tour.imagenes.length > 0 ? (
                                            <img src={tour.imagenes[0]} alt={tour?.nombreTour} className={style.imagen} />
                                        ) : (
                                            <div className={style.sinImagen}>🌄</div>
                                        )}
                                    </div>

                                    {/* INFO */}
                                    <div className={style.info}>
                                        <div className={style.infoTop}>
                                            <h3 className={style.nombreTour}>{tour?.nombreTour ?? `Tour #${reserva.tourId}`}</h3>
                                            <span className={`${style.estado} ${colorEstado(reserva.estadoReserva)}`}>
                                                {reserva.estadoReserva.charAt(0).toUpperCase() + reserva.estadoReserva.slice(1)}
                                            </span>
                                        </div>

                                        <div className={style.detalles}>
                                            <span>📅 {new Date(reserva.fecha).toLocaleDateString("es-CR", {
                                                weekday: "long", day: "numeric", month: "long", year: "numeric"
                                            })}</span>
                                            <span>👥 {reserva.cantidadCupos} persona{reserva.cantidadCupos > 1 ? "s" : ""}</span>
                                            {tour?.duracion && <span>🕐 {tour.duracion}</span>}
                                        </div>

                                        <div className={style.infoBottom}>
                                            <span className={style.precio}>{formatCurrency(precioTotal)}</span>
                                            <span className={style.fechaRegistro}>
                                                Reservado el {new Date(reserva.fechaRegistro).toLocaleDateString("es-CR")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}