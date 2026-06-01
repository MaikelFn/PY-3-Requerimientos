"use client";
import { useEffect, useState } from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";

type Tour = {
    id?: number;
    nombreTour: string;
    descripcionBreve: string;
    precio: string;
    imagenes?: string[];
};

export default function PaginaPrincipal() {
    const [usuario, setUsuario] = useState("");
    const [tours, setTours] = useState<Tour[]>([]);
    const [query, setQuery] = useState("");

    const toursFiltrados = tours.filter(tour =>
        tour.nombreTour.toLowerCase().includes(query.toLowerCase()) ||
        tour.descripcionBreve.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        async function cargarTours(){
            try {
                const respuesta = await fetch("/api/tours");
                if (!respuesta.ok) {
                    throw new Error("Error al cargar tours");
                }
                const datos = await respuesta.json();
                setTours(datos);
            } catch (error) {
                console.error("Error al cargar tours:", error);
            }
        }
        cargarTours();
    }, []); 

    return (
        <div className={style.contenedor}>
            <div className={style.menuSuperior}>
                <div className={style.menuIzquierdo}>
                    <button className={style.botonCerrar} onClick={() => {
                        localStorage.removeItem("usuario");
                        window.location.href = "/";
                    }}>
                        Cerrar sesión
                    </button>
                </div>

                <div className={style.menuDerecho}>
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>👤</span>
                            <p>Perfil</p>
                        </div>
                        <div className={style.submenu}>
                            <a href="#reservas">Historial Reservas</a>
                            <a href="#pagos">Historial Pagos</a>
                        </div>
                    </div>
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>🌐</span>
                            <p>ES/USD$</p>
                        </div>
                        <div className={style.submenu}>
                            <p><strong>Idioma:</strong></p>
                            <a>Español</a>
                            <a>Inglish</a>
                            <p><strong>Moneda:</strong></p>
                            <a>USD ($)</a>
                            <a>CRC (₡)</a>
                        </div>
                    </div>
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>📞</span>
                            <p>Contacto</p>
                        </div>
                        <div className={style.submenu}>
                            <p><strong>Contacto:</strong></p>
                            <p>Email: contacto@tours.com</p>
                            <p>Tel: +506 8888-8888</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={style.banner}></div>

            <div className={style.buscador}>
                <input 
                    type="text" 
                    placeholder="Encuentra lugares y actividades" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    className={style.input} 
                />
            </div>

            <div className={style.contenido}>
                <h2>Explora el mundo con nosotros</h2>
                <p>Descubre destinos increíbles, reserva tus viajes y vive experiencias inolvidables.</p>
            </div>

            {/* Sección de Tours Destacados */}
            <div className={style.tours}>
                <h2 className={style.tituloSeccion}>Tours destacados</h2>
                {toursFiltrados.map((tour) => (
                    <TarjetaTour key={tour.id} tour={tour} />
                ))}
            </div>
        </div>
    );
}

// SUBCOMPONENTE INTERNO PARA ENCAPSULAR LA LÓGICA DEL HOVER Y DEL CARRUSEL AUTOMÁTICO
function TarjetaTour({ tour }: { tour: Tour }) {
    const router = useRouter();
    const [indiceImagen, setIndiceImagen] = useState(0);
    const [mouseEncima, setMouseEncima] = useState(false);

    const imagenes = tour.imagenes ?? [];
    const tieneMultiplesImagenes = imagenes.length > 1;

    useEffect(() => {
        // Si el mouse no está encima o el tour solo tiene una o ninguna imagen, no hace falta activar el intervalo
        if (!mouseEncima || !tieneMultiplesImagenes) {
            setIndiceImagen(0); // Resetea a la primera imagen al salir
            return;
        }

        // Crear un intervalo que cambie la imagen cada 1.5 segundos (1500 ms)
        const intervalo = setInterval(() => {
            setIndiceImagen((idPrevio) => (idPrevio + 1) % imagenes.length);
        }, 1500);

        // Limpiar el intervalo cuando el mouse salga o el componente cambie
        return () => clearInterval(intervalo);
    }, [mouseEncima, imagenes.length, tieneMultiplesImagenes]);

    return (
        <div 
            className={style.tour}
            onMouseEnter={() => setMouseEncima(true)}
            onMouseLeave={() => setMouseEncima(false)}
        >
            {/* Contenedor de la Imagen con transiciones estables */}
            <div className={style.contenedorImagen}>
                {imagenes.length > 0 ? (
                    <img 
                        src={imagenes[indiceImagen]} 
                        alt={`${tour.nombreTour} - ${indiceImagen + 1}`} 
                        className={style.imagenTour} 
                    />
                ) : (
                    <div className={style.sinImagen}>
                        <span>🌄</span>
                        <p>Imagen no disponible</p>
                    </div>
                )}
            </div>

            {/* Información del tour */}
            <div className={style.info}>
                <h3>{tour.nombreTour}</h3>
                <p className={style.descripcion}>{tour.descripcionBreve}</p>
            </div>

            {/* Precio y acción */}
            <div className={style.precio}>
                <p>₡{tour.precio}</p>
                <button className={style.botonDetalle} onClick={() => {
                    if (tour.id !== undefined) {
                        sessionStorage.setItem("tourSeleccionado", JSON.stringify(tour));
                        router.push(`/detalleTours?id=${tour.id}`);
                    } else {
                        console.error("ID del tour no definido", tour);
                    }
                }}>
                    Ver detalles
                </button>
            </div>
        </div>
    );
}