"use client"
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import style from "./page.module.css"
import { PaymentForm } from "@/components/PaymentForm";

type FechaYCupo = {
    fecha: string
    cupos: string
}

type Tour = {
    id: number;
    nombreTour: string;
    descripcionBreve: string;
    precio: string;
    duracion: string
    imagenes?: string[]
    fechasYCupos?: FechaYCupo[]
}

type MetodoPago = "stripe" | "manual" | null

export default function PaginaReservas() {
    const  searchParams = useSearchParams()
    const id = searchParams.get("id")
    const router = useRouter()

    const [tour, setTour] = useState<Tour | null>(null)
    const [cargando, setCargando] = useState(true)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("")
    const [cantidadCupos, setCantidadCupos] = useState(1)
    const [metodoPago, setMetodoPago] = useState<MetodoPago>(null)
    const [reservaCorfirmada, setReservaConfirmada] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [tipoCambio, setTipoCambio] = useState<number | null>(null)
    const [cargandoTipoCambio, setCargandoTipoCambio] = useState(true)

    useEffect(() => {
        async function cargarTipoCambio() {
            try {
                const resultado = await fetch("https://open.er-api.com/v6/latest/USD")
                if (!resultado.ok) return
                const datos = await resultado.json()
                setTipoCambio(datos.rates.CRC)
            } catch {
                console.error("Error al obtener tipo de cambio")
            } finally {
                setCargandoTipoCambio(false)
            }
        }

        async function cargarTour() {
            try {
                const resultado = await fetch("/api/tours")
                if (!resultado.ok) return
                const datos = await resultado.json()
                const tourEncontrado = datos.find((tourSeleccionado: Tour) => Number(tourSeleccionado.id) === Number(id))
                setTour(tourEncontrado ?? null)
            }catch {
                console.error("Error de conexión")               
            }finally {
                setCargando(false)
            }
        }
        if (id) {
            cargarTour()
        }
        cargarTipoCambio()
    }, [id])

    const cuposDisponibles = tour?.fechasYCupos?.find(f => f.fecha === fechaSeleccionada)?.cupos ?? "0"
    const precioTotal = tour? Number(tour.precio) * cantidadCupos : 0
    const precioTotalUSD = tipoCambio? Number((precioTotal / tipoCambio).toFixed(2)): 0

    async function handleReservar() {
        if (!fechaSeleccionada) return alert("Selecciona una fecha")
        if (cantidadCupos < 1) return alert("Debes selecionar al menos 1 cupo")
        setProcesando(true)
        try {
            const usuarioGuardado = localStorage.getItem("usuario")
            const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado): null
            const resultado = await fetch("/api/reservas", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    tourId: Number(id),
                    usuarioId: usuario?.id ?? 0,
                    cantidadCupos,
                    fecha: fechaSeleccionada,
                    estadoReserva: "pendiente"
                })
            })
            if (!resultado.ok) {
                const error = await resultado.json()
                alert(error.error || "Error al crear la reserva")
                return
            }
            setReservaConfirmada(true)
        }catch {
            alert("Error de conexión")
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) return (
        <div className={style.estadoCarga}>
            <div className={style.spinner}></div>
            <p>Cargando...</p>
        </div>
    )

    if (!tour) return (
        <div className={style.estadoRrror}>Tour no encontrado</div>
    )

    if(reservaCorfirmada) return (
        <div className={style.exitoContenedor}>
            <div className={style.exitoTarjeta}>
                <div className={style.exitoIcono}>✅</div>
                <h2>¡Reserva confirmada!</h2>
                <p>Tu reserva para<strong>{tour.nombreTour}</strong> el <strong>{fechaSeleccionada}</strong> ha sido registrada.</p>
                <p className={style.exitoNota}>Nos pondremos en contacto contigo pronto.</p>
                <img src="/logo.png" alt="Logo" className={style.logo} onClick={() => router.push("/paginaPrincipal")}/>
            </div>
        </div>
    )

    return (
        <div className={style.pagina}>
            {/*Menu superior*/}
            <div className={style.menuSuperior}>
                <div className={style.menuIzquierdo}>
                <img src="/logo.png" alt="Logo" className={style.imagen} onClick={() => router.push("/paginaPrincipal")}/>
                </div>
                <div className={style.menuDerecho}>
                    <span className={style.breadcrumb}>Reserva para {tour.nombreTour}</span>
                </div>
            </div>

            {/*Contenedor */}
            <div className={style.contenedor}>
                <h1 className={style.titulo}>Completa tu reserva</h1>
                <div className={style.cuerpo}>
                    {/*Columna izquierda */}
                    <div className={style.columnaIzquierda}>
                        {/*Resumen tour*/}
                        <div className={style.seccion}>
                            <h2 className={style.tituloSeccion}>Resumen del tour</h2>
                            <div className={style.resumenTour}>
                                {tour.imagenes && tour.imagenes.length > 0 && (
                                    <img
                                        src={tour.imagenes[0]}
                                        alt={tour.nombreTour}
                                        className={style.imagenTour}
                                    />
                                )}
                                <div className={style.resumenInfo}>
                                    <h3 className={style.resumenNombre}>{tour.nombreTour}</h3>
                                    <p className={style.resumenDescripcion}>{tour.descripcionBreve}</p>
                                    <div className={style.info}>
                                        <span className={style.chip}>🕐 {tour.duracion}</span>
                                        <span className={style.chip}>✅ Cancelación gratuita</span>
                                        <span className={style.chip}>🗺️ Guía incluido</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/*Fechas */}
                        <div className={style.seccion}>
                            <h2 className={style.tituloSeccion}>Selecciona una fecha</h2>
                            <div className={style.fechasLista}>
                                {tour.fechasYCupos?.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${style.fechaItem} ${fechaSeleccionada === item.fecha ? style.fechaActiva : ""}`}
                                        onClick={() => {
                                            setFechaSeleccionada(item.fecha)
                                            setCantidadCupos(1)
                                        }}>
                                        <span className={style.fechaTexto}>
                                            📅 {new Date(item.fecha).toLocaleDateString("es-CR", {
                                                weekday: "long", day: "numeric", month: "long", year: "numeric"
                                            })}
                                        </span>
                                        <span className={style.cuposInfo}>{item.cupos} cupos</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/*Cantidad de perosnas*/}
                        {fechaSeleccionada && (
                            <div className={style.seccion}>
                                <h2 className={style.tituloSeccion}>Cantidad de personas</h2>
                                <div className={style.cuposControl}>
                                    <button
                                            className={style.botonCupo}
                                            onClick={() => setCantidadCupos(Math.max(1, cantidadCupos - 1))}
                                        >-</button>
                                        <span className={style.cupoNumero}>{cantidadCupos}</span>
                                        <button
                                            className={style.botonCupo}
                                            onClick={() => setCantidadCupos(Math.min(Number(cuposDisponibles), cantidadCupos + 1))}
                                        >+</button>
                                        <span className={style.cuposMax}>Máx. {cuposDisponibles} disponibles</span>
                                </div>
                            </div>
                        )}

                        {/*Metodo de pago */}
                        {fechaSeleccionada && (
                            <div className={style.seccion}>
                                <h2 className={style.tituloSeccion}>Método de pago</h2>
                                <div className={style.metodosPago}>
                                    {/*PAGO MANUAL*/}
                                    <div
                                        className={`${style.metodoPago} ${metodoPago === "manual" ? style.metodoActivo : ""}`}
                                        onClick={() => setMetodoPago("manual")}>
                                        <span className={style.metodoIcono}>💵</span>
                                        <div>
                                            <p className={style.metodoTitulo}>Pago manual</p>
                                            <p className={style.metodoDesc}>Paga en nuestra oficina o al momento del tour</p>
                                        </div>
                                        {metodoPago === "manual" && <span className={style.check}>✓</span>}
                                    </div>
                                    {/*PAGO CON STRIPE */}
                                    <div className={`${style.metodoPago} ${metodoPago === "stripe" ? style.metodoActivo : ""}`} onClick={() => setMetodoPago("stripe")}>
                                        <span className={style.metodoIcono}>💳</span>
                                        <div>
                                            <p className={style.metodoTitulo}>Pago con tarjeta</p>
                                            <p className={style.metodoDesc}>Visa, Mastercard, American Express</p>
                                        </div>
                                        {metodoPago === "stripe" && <span className={style.check}>✓</span>}
                                    </div>
                                </div>

                                {/*Instrucciones pago manual */}
                                {metodoPago === "manual" && (
                                    <div className={style.pagoManual}>
                                        <h3>Pago en efectivo</h3>
                                        <p>Puedes realizar tu pago en efectivo en nuestra oficina o al momento del tour.</p>
                                        <div className={style.datosOficina}>
                                            <p><strong>📍 Oficina central:</strong> Limón, Costa Rica</p>
                                            <p><strong>🕐 Horario:</strong> Lunes a Viernes 10:00am - 5:00pm</p>
                                            <p><strong>💵 Monto a cancelar:</strong> ₡{precioTotal.toLocaleString("es-CR")}</p>
                                        </div>
                                        <p className={style.notaOficina}>Al confirmar tu reserva quedará en estado <strong>pendiente</strong> hasta que realices el pago en efectivo.</p>
                                        <button className={style.botonAccion} onClick={handleReservar} disabled={procesando}>
                                            {procesando ? "Procesando..." : "Confirmar reserva"}
                                        </button>
                                    </div>
                                )}

                                {/*Stripe */}
                                {metodoPago === "stripe" && (
                                    <div className={style.pagoStripe}>
                                        {cargandoTipoCambio ? (
                                            <p className={style.notaStripe}>Obteniendo tipo de cambio...</p>
                                        ) : precioTotalUSD <= 0 ? (
                                            <p className={style.notaStripe}>No se pudo obtener el tipo de cambio. Intenta de nuevo.</p>
                                        ) : (
                                            <>
                                                <p className={style.notaStripe}>
                                                    Se cobrarán <strong>${precioTotalUSD.toFixed(2)} USD</strong> por {cantidadCupos} persona{cantidadCupos > 1 ? "s" : ""}
                                                </p>
                                                <p className={style.tipoCambio}>
                                                    Tipo de cambio: ₡{tipoCambio?.toLocaleString("es-CR")} por $1 USD
                                                </p>
                                                <PaymentForm
                                                    amount={precioTotalUSD}
                                                    currency="usd"
                                                    description={`Reserva: ${tour.nombreTour} - ${fechaSeleccionada}`}
                                                    metadata={{
                                                        tourId: String(tour.id),
                                                        fecha: fechaSeleccionada,
                                                        cupos: String(cantidadCupos)
                                                    }}
                                                    onSuccess={async () => {
                                                        await handleReservar()
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/*Columna derecha */}
                    <div className={style.columnaDerecha}>
                        <div className={style.contenedorResumen}>
                            <h2 className={style.tituloSeccion}>Resumen de pago</h2>
                            <div className={style.lineaPrecio}>
                                <span>Precio por persona</span>
                                <span>₡{Number(tour.precio).toLocaleString("es-CR")}</span>
                            </div>
                            <div className={style.lineaPrecio}>
                                <span>Personas</span>
                                <span>x {cantidadCupos}</span>
                            </div>
                            {fechaSeleccionada && (
                                <div className={style.lineaPrecio}>
                                    <span>Fecha</span>
                                    <span>{new Date(fechaSeleccionada).toLocaleDateString("es-CR")}</span>
                                </div>
                            )}
                            <div className={style.separador}></div>
                            <div className={style.lineaTotal}>
                                <span>Total</span>
                                <span>₡{precioTotal.toLocaleString("es-CR")}</span>
                            </div>
                            {metodoPago === "stripe" && (
                                <p className={style.totalUSD}>${precioTotalUSD.toFixed(2)} USD</p>
                            )}
                            {!fechaSeleccionada && (
                                <p className={style.notaSeleccion}>Selecciona una fecha para continuar</p>
                            )}
                            {fechaSeleccionada && !metodoPago && (
                                <p className={style.notaSeleccion}>Selecciona un método de pago</p>
                            )}
                            <div className={style.garantias}>
                                <p>✅ Cancelación gratuita</p>
                                <p>🔒 Pago seguro</p>
                                <p>📞 Soporte 24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}

