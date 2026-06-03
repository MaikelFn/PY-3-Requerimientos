"use client";
import {useEffect, useState} from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";

type Destino = {
    id?: number;
    nombre: string;
    ubicacion: string;
    descripcionBreve: string;
    descripcionDetallada: string;
    imagenes?: string[];
};

export default function PaginaDestinos() {
    const [destinos, setDestinos] = useState<Destino[]>([]);
    const [query, setQuery] = useState("");
    const router = useRouter();
    
    const destinosFiltrados = destinos.filter(destino =>
        destino.nombre.toLowerCase().includes(query.toLowerCase()) ||
        destino.ubicacion.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        async function cargarDestinos() {
            const respuesta = await fetch("/api/destinos");
            const datos = await respuesta.json();
            setDestinos(datos);
        }
        cargarDestinos();
    }, []);

    return (
        <div className={style.contenedor}>
            {/*Encabezado*/}
            <div className={style.encabezado}>
                <button className={style.botonRegresar} onClick={() => router.push("/paginaPrincipal")}> ← Volver</button>
                <h1 className={style.tituloPrincipal}>Explora nuestros destinos disponibles</h1>
            
            {/*Buscado*/}
            <div className={style.buscador}>
                <span>🔍</span>
                <input type="text" placeholder="Buscar destino por nombre o ubicación..." value={query} onChange={(e) => setQuery(e.target.value)} className={style.input}/>
            </div>
            </div>

            
            {/*Lista de destinos*/}
            <div className={style.lista}>
                {destinosFiltrados.length === 0 ?(
                    <div className={style.sinResultados}>
                        <p>No se encontraron destinos.</p>
                    </div>
                ) : (
                    destinosFiltrados.map(destino => (
                        <TarjetaDestino key={destino.id} destino={destino}/>
                    ))
                )}
            </div>
        </div>
    );
}

function TarjetaDestino({destino}:{destino: Destino}) {
    const [indiceImagen, setIndiceImagen] = useState(0);
    const [mouseEncima, setMouseEncima] = useState(false);
    const imagenes = destino.imagenes ?? [];

    useEffect(() => {
        if (!mouseEncima || imagenes.length <= 1) {
            setIndiceImagen(0);
            return;
        }
        const intervalo = setInterval(() => {
            setIndiceImagen((previo) => (previo + 1) % imagenes.length);
        }, 1500); 
        return () => clearInterval(intervalo);
    }, [mouseEncima, imagenes.length]);

    return (
        <div className={style.tarjeta} onMouseEnter={() => setMouseEncima(true)} onMouseLeave={() => setMouseEncima(false)}>
            
            {/*Imagen del destino*/}
            <div className={style.imagenContenedor}>
                {imagenes.length > 0 ? (
                    <img src={imagenes[indiceImagen]}
                        alt={destino.nombre}
                        className={style.imagen}/>
                    ) : (
                        <div className={style.sinImagen}>🌄</div>
                )}
                {imagenes.length > 1 && (
                    <div className={style.indicadores}>
                        {imagenes.map((_, indice) => (
                            <span key={indice} className={`${style.indicador} ${indice === indiceImagen ? style.activo : ""}`}/>
                        ))}
                    </div>
                )}
            </div>

            {/*Información del destino*/}
            <div className={style.informacion}>
                <h3>{destino.nombre}</h3>
                <p className={style.ubicacion}>📍{destino.ubicacion}</p>
                <p>{destino.descripcionBreve}</p>
                <p>{destino.descripcionDetallada}</p>
            </div>
        </div>
    )
}