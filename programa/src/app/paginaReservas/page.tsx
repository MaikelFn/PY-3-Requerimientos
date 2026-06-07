"use client"
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import style from "./page.module.css"
import { PaymentForm } from "@/components/PaymentForm";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

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
    const searchParams = useSearchParams()
    const id = searchParams.get("id")
    const router = useRouter()

    const [tour, setTour] = useState<Tour | null>(null)
    const [cargando, setCargando] = useState(true)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("")
    const [cantidadCupos, setCantidadCupos] = useState(1)
    const [metodoPago, setMetodoPago] = useState<MetodoPago>(null)
    const [reservaConfirmada, setReservaConfirmada] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const { currency, exchangeRate, loading: cambioLoading, formatCurrency } = useCurrency()
    const { idioma, t } = useLanguage()
    const locale = idioma === "en" ? "en-US" : "es-CR"

    // Las claves de traduccionesReservas usan "CRC"/"USD" pero aquí usamos t() del LanguageContext
    // que busca en todos los diccionarios. Las claves de reservas están en traduccionesReservas
    // separadas por moneda, así que las manejamos directamente con el diccionario según currency.
    // Para simplificar, usamos t() para las claves que existen en traduccionesUI/Tours,
    // y un helper local para las claves exclusivas de reservas.

    useEffect(() => {
        async function cargarTour() {
            try {
                const resultado = await fetch("/api/tours")
                if (!resultado.ok) return
                const datos = await resultado.json()
                const tourEncontrado = datos.find((tourSeleccionado: Tour) => Number(tourSeleccionado.id) === Number(id))
                setTour(tourEncontrado ?? null)
            } catch {
                console.error("Error de conexión")
            } finally {
                setCargando(false)
            }
        }
        if (id) cargarTour()
    }, [id])

    const cuposDisponibles = tour?.fechasYCupos?.find(f => f.fecha === fechaSeleccionada)?.cupos ?? "0"
    const precioTotal = tour ? Number(tour.precio) * cantidadCupos : 0
    const precioTotalUSD = currency === "CRC" ? Number((precioTotal / exchangeRate).toFixed(2)) : precioTotal
    const precioPorPersona = tour ? Number(tour.precio) : 0
    const stripeAmount = currency === "CRC" ? precioTotalUSD : precioTotal

    async function handleReservar() {
        if (!fechaSeleccionada) return alert(t("seleccionaFecha"))
        if (cantidadCupos < 1) return alert(t("seleccionaFecha"))
        setProcesando(true)
        try {
            const usuarioGuardado = localStorage.getItem("usuario")
            const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null
            const resultado = await fetch("/api/reservas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        } catch {
            alert(t("errorConexion"))
        } finally {
            setProcesando(false)
        }
    }

    function handlePagoExitoso() {
        setReservaConfirmada(true)
    }

    if (cargando) return (
        <div className={style.estadoCarga}>
            <div className={style.spinner}></div>
            <p>{t("cargar")}</p>
        </div>
    )

    if (!tour) return (
        <div className={style.estadoRrror}>{t("tourNoEncontrado")}</div>
    )

    if (reservaConfirmada) return (
        <div className={style.exitoContenedor}>
            <div className={style.exitoTarjeta}>
                <div className={style.exitoIcono}>✅</div>
                <h2>{t("reservaConfirmada")}</h2>
                <p>
                    {t("fechaViaje")} <strong>{tour.nombreTour}</strong>{" "}
                    {t("reservadoEl")} <strong>{fechaSeleccionada}</strong>
                </p>
                <p className={style.exitoNota}>{t("notaExito")}</p>
                <img
                    src="/logo.png"
                    alt="Logo"
                    className={style.logo}
                    onClick={() => router.push("/paginaPrincipal")}
                />
            </div>
        </div>
    )

    return (
        <div className={style.pagina}>
            {/* Menú superior */}
            <div className={style.menuSuperior}>
                <div className={style.menuIzquierdo}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className={style.imagen}
                        onClick={() => router.push("/paginaPrincipal")}
                    />
                </div>
                <div className={style.menuDerecho}>
                    <span className={style.breadcrumb}>
                        {t("resumenTour")} {tour.nombreTour}
                    </span>
                </div>
            </div>

            {/* Contenedor */}
            <div className={style.contenedor}>
                <h1 className={style.titulo}>{t("titulo")}</h1>
                <div className={style.cuerpo}>
                    {/* Columna izquierda */}
                    <div className={style.columnaIzquierda}>

                        {/* Resumen tour */}
                        <div className={style.seccion}>
                            <h2 className={style.tituloSeccion}>{t("resumenTour")}</h2>
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
                                        <span className={style.chip}>✅ {t("cancelacion")}</span>
                                        <span className={style.chip}>🗺️ {t("guia")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fechas */}
                        <div className={style.seccion}>
                            <h2 className={style.tituloSeccion}>{t("seleccionaFecha")}</h2>
                            <div className={style.fechasLista}>
                                {tour.fechasYCupos?.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`${style.fechaItem} ${fechaSeleccionada === item.fecha ? style.fechaActiva : ""}`}
                                        onClick={() => {
                                            setFechaSeleccionada(item.fecha)
                                            setCantidadCupos(1)
                                        }}
                                    >
                                        <span className={style.fechaTexto}>
                                            📅 {new Date(item.fecha).toLocaleDateString(
                                                locale,
                                                { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                                            )}
                                        </span>
                                        <span className={style.cuposInfo}>{item.cupos} {t("cupos")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cantidad de personas */}
                        {fechaSeleccionada && (
                            <div className={style.seccion}>
                                <h2 className={style.tituloSeccion}>{t("personas")}</h2>
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
                                    <span className={style.cuposMax}>
                                        {t("max")} {cuposDisponibles} {t("disponibles")}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Método de pago */}
                        {fechaSeleccionada && (
                            <div className={style.seccion}>
                                <h2 className={style.tituloSeccion}>{t("metodoPago")}</h2>
                                <div className={style.metodosPago}>

                                    {/* Pago manual */}
                                    <div
                                        className={`${style.metodoPago} ${metodoPago === "manual" ? style.metodoActivo : ""}`}
                                        onClick={() => setMetodoPago("manual")}
                                    >
                                        <span className={style.metodoIcono}>💵</span>
                                        <div>
                                            <p className={style.metodoTitulo}>{t("pagoManual")}</p>
                                            <p className={style.metodoDesc}>{t("pagoManualDesc")}</p>
                                        </div>
                                        {metodoPago === "manual" && <span className={style.check}>✓</span>}
                                    </div>

                                    {/* Pago con tarjeta */}
                                    <div
                                        className={`${style.metodoPago} ${metodoPago === "stripe" ? style.metodoActivo : ""}`}
                                        onClick={() => setMetodoPago("stripe")}
                                    >
                                        <span className={style.metodoIcono}>💳</span>
                                        <div>
                                            <p className={style.metodoTitulo}>{t("pagoTarjeta")}</p>
                                            <p className={style.metodoDesc}>{t("pagoTarjetaDesc")}</p>
                                        </div>
                                        {metodoPago === "stripe" && <span className={style.check}>✓</span>}
                                    </div>
                                </div>

                                {/* Instrucciones pago manual */}
                                {metodoPago === "manual" && (
                                    <div className={style.pagoManual}>
                                        <h3>{t("efectivo")}</h3>
                                        <p>{t("efectivoDesc")}</p>
                                        <div className={style.datosOficina}>
                                            <p><strong>📍 {t("oficina")}</strong> Limón, Costa Rica</p>
                                            <p><strong>🕐 {t("horario")}</strong> Lunes a Viernes 10:00am - 5:00pm</p>
                                            <p><strong>💵 {t("montoCancelar")}</strong> {formatCurrency(precioTotal)}</p>
                                        </div>
                                        <p className={style.notaOficina}>{t("notaPendiente")}</p>
                                        <button
                                            className={style.botonAccion}
                                            onClick={handleReservar}
                                            disabled={procesando}
                                        >
                                            {procesando ? t("procesando") : t("confirmarBtn")}
                                        </button>
                                    </div>
                                )}

                                {/* Stripe */}
                                {metodoPago === "stripe" && (
                                    <div className={style.pagoStripe}>
                                        {currency === "CRC" && cambioLoading ? (
                                            <p className={style.notaStripe}>{t("obteniendoTC")}</p>
                                        ) : precioTotalUSD <= 0 ? (
                                            <p className={style.notaStripe}>{t("errorTC")}</p>
                                        ) : (
                                            <>
                                                <p className={style.notaStripe}>
                                                    {t("seCobraran")} <strong>${stripeAmount.toFixed(2)} USD</strong>{" "}
                                                    {t("por")} {cantidadCupos} {t("persona")}{cantidadCupos > 1 ? (idioma === "en" ? "s" : "s") : ""}
                                                </p>
                                                {currency === "CRC" && (
                                                    <p className={style.tipoCambio}>
                                                        Tipo de cambio: ₡{exchangeRate.toLocaleString("es-CR")} por $1 USD
                                                    </p>
                                                )}
                                                <PaymentForm
                                                    amount={precioTotalUSD}
                                                    currency="usd"
                                                    description={`Reserva: ${tour.nombreTour} - ${fechaSeleccionada}`}
                                                    metadata={{
                                                        tourId: String(tour.id),
                                                        fecha: fechaSeleccionada,
                                                        cupos: String(cantidadCupos)
                                                    }}
                                                    reservaData={{
                                                        tourId: Number(id),
                                                        usuarioId: Number(JSON.parse(localStorage.getItem("usuario") || "null")?.id || 0),
                                                        cantidadCupos,
                                                        fecha: fechaSeleccionada,
                                                    }}
                                                    onSuccess={handlePagoExitoso}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha */}
                    <div className={style.columnaDerecha}>
                        <div className={style.contenedorResumen}>
                            <h2 className={style.tituloSeccion}>{t("resumenPago")}</h2>
                            <div className={style.lineaPrecio}>
                                <span>{t("precioPersona")}</span>
                                <span>{formatCurrency(precioPorPersona)}</span>
                            </div>
                            <div className={style.lineaPrecio}>
                                <span>{t("personas")}</span>
                                <span>x {cantidadCupos}</span>
                            </div>
                            {fechaSeleccionada && (
                                <div className={style.lineaPrecio}>
                                    <span>{t("fecha")}</span>
                                    <span>{new Date(fechaSeleccionada).toLocaleDateString(locale)}</span>
                                </div>
                            )}
                            <div className={style.separador}></div>
                            <div className={style.lineaTotal}>
                                <span>{t("total")}</span>
                                <span>{formatCurrency(precioTotal)}</span>
                            </div>
                            {metodoPago === "stripe" && (
                                <p className={style.totalUSD}>${precioTotalUSD.toFixed(2)} USD</p>
                            )}
                            {!fechaSeleccionada && (
                                <p className={style.notaSeleccion}>{t("seleccionaFechaNota")}</p>
                            )}
                            {fechaSeleccionada && !metodoPago && (
                                <p className={style.notaSeleccion}>{t("seleccionaMetodoNota")}</p>
                            )}
                            <div className={style.garantias}>
                                <p>✅ {t("cancelacion")}</p>
                                <p>🔒 {t("pagoSeguro")}</p>
                                <p>📞 {t("soporte")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}