"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import style from "./page.module.css"
import { useCurrency } from "@/context/CurrencyContext"

type Factura = {
    id: number
    tourId: number
    nombreTour: string
    destino: string
    usuarioId: number
    nombreUsuario: string
    cantidadCupos: number
    precio: string
    montoTotal: number
    fecha: string
    fechaRegistro: string
}

type Usuario = {
    id: number
    nombre: string
    apellido: string
    correo: string
    roll: string
}

export default function HistorialFacturas() {
    const router = useRouter()
    const { formatCurrency } = useCurrency()
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario")
        if (!usuarioGuardado) {
            router.push("/")
            return
        }

        try {
            const usuario = JSON.parse(usuarioGuardado) as Usuario
            cargarFacturas(usuario.id)
        } catch (error) {
            console.error("Error al leer el usuario:", error)
            router.push("/")
        }
    }, [router])

    async function cargarFacturas(usuarioId: number) {
        try {
            const respuesta = await fetch(`/api/facturas?usuarioId=${usuarioId}`)
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar el historial de pagos")
            }
            const datos = await respuesta.json()
            setFacturas(datos)
        } catch (error) {
            console.error("Error al cargar facturas:", error)
        } finally {
            setCargando(false)
        }
    }

    const montoTotalGastado = facturas.reduce((sum, factura) => sum + factura.montoTotal, 0)

    if (cargando) return (
        <div className={style.estadoCarga}>
            <div className={style.spinner}></div>
            <p>Cargando historial de facturas...</p>
        </div>
    )

    return (
        <div className={style.pagina}>
            <div className={style.encabezado}>
                <img src="/logo.png" alt="Logo" className={style.logo} onClick={() => router.push("/paginaPrincipal")} />
                <div>
                    <h1 className={style.titulo}>Historial de pagos</h1>
                    <p className={style.subtitulo}>Consulta tus facturas, montos y fechas de registro.</p>
                </div>
            </div>

            <div className={style.contenedor}>
                <div className={style.resumen}>
                    <div>
                        <span>Total de facturas</span>
                        <strong>{facturas.length}</strong>
                    </div>
                    <div>
                        <span>Monto total</span>
                        <strong>{formatCurrency(montoTotalGastado)}</strong>
                        <button className={style.botonExplorar} onClick={() => router.push("/paginaPrincipal")}>Ver tours</button>
                    </div>
                ) : (
                    <div className={style.lista}>
                        {facturas.map(factura => (
                            <div key={factura.id} className={style.tarjeta}>
                                <div className={style.info}>
                                    <div className={style.infoTop}>
                                        <h3 className={style.nombreTour}>{factura.nombreTour}</h3>
                                        <span className={style.detalleId}>Factura #{factura.id}</span>
                                    </div>

                                    <div className={style.detalles}>
                                        <span>📍 {factura.destino}</span>
                                        <span>📅 Viaje: {new Date(factura.fecha).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}</span>
                                        <span>👥 {factura.cantidadCupos} cupo{factura.cantidadCupos > 1 ? "s" : ""}</span>
                                        <span>💰 Precio unidad: {formatCurrency(Number(factura.precio))}</span>
                                    </div>

                                    <div className={style.infoBottom}>
                                        <div>
                                            <p className={style.precio}>{formatCurrency(factura.montoTotal)}</p>
                                            <p className={style.fechaRegistro}>Registrada el {new Date(factura.fechaRegistro).toLocaleDateString("es-CR")}</p>
                                        </div>
                                        <div className={style.nombreUsuario}>
                                            {factura.nombreUsuario}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
