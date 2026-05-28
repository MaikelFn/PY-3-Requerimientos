"use client"
import { useEffect, useState } from "react"
import {useParams, useRouter} from "next/navigation"
import style from "./page.module.css"
import { TourGuardado } from "@/src/lib/tours"



export default function DetalleTours() {
    const {id} = useParams()
    const router = useRouter()
    const [tour, setTour] = useState<TourGuardado | null>(null)
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function cargarTour() {
            try{
                // llamada para obtener el tour por id
                const respuesta = await fetch("/api/tours")
                const datosTour = await respuesta.json()
                const tourEncontrado = datosTour.find((t: TourGuardado) => t.id === Number(id))
                if (!tourEncontrado) {
                    setError("Tour no encontrado")
                }else {
                    setTour(tourEncontrado)
                }
                setTour(datosTour)
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

    return (
        <div className={style.contenedor}>
            {/*volver*/}
            <button className={style.volcer} onClick={() => router.back()}>← Volver</button>
            {tour.imagenes?.map((img, index) => (
                <img key={index} src={img} alt={tour.nombreTour}/>
            ))}

            {/* Información del tour */}
            <h1>{tour.nombreTour}</h1>
            <p><strong>Descripción:</strong>{tour.descripcionDetallada}</p>
            <p><strong>Precio:</strong>{tour.precio}</p>
            <p><strong>Duración:</strong>{tour.duracion}</p>
            <p><strong>Itinerario:</strong>{tour.itinerario}</p>

            {/* Disponibilidad */}
            <h3>Disponiblidad</h3>
            <ul>
                {tour.fechasYCupos?.map((fecha, index) => (
                    <li key={index}>{fecha.fecha} - {fecha.cupos} cupos disponibles</li>
                ))}
            </ul> 
            
            {/* Botón para reservar */}
            <button className={style.reservar} onClick={() => router.push(`/reserva/${tour.id}`)}>Reservar este tour</button>
        </div>
    )
}