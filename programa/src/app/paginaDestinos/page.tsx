"use client";
import {useEffect, useState} from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type Destino = {
    id?: number;
    nombre: string;
    ubicacion: string;
    descripcionBreve: string;
    descripcionDetallada: string;
    imagenes?: string[];
    descripcionBreveEn?: string;
    descripcionDetalladaEn?: string;
};

export default function PaginaDestinos() {
    const [destinos, setDestinos] = useState<Destino[]>([]);
    const [query, setQuery] = useState("");
    const router = useRouter();
    const { t, idioma } = useLanguage();
    
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
    }, [idioma]);

    return (
        <main className={style.fondo}>
            <div className={style.contenedor}>
                {/* Encabezado */}
                <div className={style.encabezado}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className={style.logo}
                        onClick={() => router.push("/paginaPrincipal")}
                    />
                    <h1 className={style.tituloPrincipal}>
                        {t("exploraNuestrosDestinosDisponibles")}
                    </h1>

                    {/* Buscador */}
                    <div className={style.buscador}>
                        <span>🔍</span>
                        <input
                            type="text"
                            placeholder={t("buscarDestinoPorNombreUbicacion")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={style.input}
                        />
                    </div>
                </div>

                {/* Lista de destinos */}
                <div className={style.lista}>
                    {destinosFiltrados.length === 0 ? (
                        <div className={style.sinResultados}>
                            <p>{t("noSeEncontraronDestinos")}</p>
                        </div>
                    ) : (
                        destinosFiltrados.map(destino => (
                            <TarjetaDestino key={destino.id} destino={destino} idioma={idioma} />
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}

function TarjetaDestino({ destino, idioma }: { destino: Destino; idioma: string }) {
    const [indiceImagen, setIndiceImagen] = useState(0);
    const [mouseEncima, setMouseEncima] = useState(false);
    const imagenes = destino.imagenes ?? [];

    // Obtener datos según el idioma
    const descripcionBreve = idioma === "en" ? (destino.descripcionBreveEn || destino.descripcionBreve) : destino.descripcionBreve;
    const descripcionDetallada = idioma === "en" ? (destino.descripcionDetalladaEn || destino.descripcionDetallada) : destino.descripcionDetallada;

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
        <div
            className={style.tarjeta}
            onMouseEnter={() => setMouseEncima(true)}
            onMouseLeave={() => setMouseEncima(false)}
        >
            {/* Imagen del destino */}
            <div className={style.imagenContenedor}>
                {imagenes.length > 0 ? (
                    <img
                        src={imagenes[indiceImagen]}
                        alt={destino.nombre}
                        className={style.imagen}
                    />
                ) : (
                    <div className={style.sinImagen}>🌄</div>
                )}
                {imagenes.length > 1 && (
                    <div className={style.indicadores}>
                        {imagenes.map((_, indice) => (
                            <span
                                key={indice}
                                className={`${style.indicador} ${indice === indiceImagen ? style.activo : ""}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Información del destino */}
            <div className={style.informacion}>
                <h3>{destino.nombre}</h3>
                <p className={style.ubicacion}>📍{destino.ubicacion}</p>
                <p>{descripcionBreve}</p>
                <p>{descripcionDetallada}</p>
            </div>
        </div>
    );
}