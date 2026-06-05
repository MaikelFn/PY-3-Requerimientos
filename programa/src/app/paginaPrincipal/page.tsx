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

type UsuarioAutenticado = {
    nombre: string;
    correo: string;
    roll: string; 
};

export default function PaginaPrincipal() {
    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [tours, setTours] = useState<Tour[]>([]);
    const [query, setQuery] = useState("");
    const [precioMinimo, setPrecioMinimo] = useState("");
    const [precioMaximo, setPrecioMaximo] = useState("");
    const [queryFiltro, setQueryFiltro] = useState("");
    const [precioMinimoFiltro, setPrecioMinimoFiltro] = useState("");
    const [precioMaximoFiltro, setPrecioMaximoFiltro] = useState("");
    const router = useRouter();

    // Filtrar los tours según el texto de búsqueda y los rangos de precio
    const toursFiltrados = tours.filter(tour => {
        const coincideTexto = tour.nombreTour.toLowerCase().includes(queryFiltro.toLowerCase()) ||
            tour.descripcionBreve.toLowerCase().includes(queryFiltro.toLowerCase());
        
        const precio = Number(tour.precio);
        const coincidePrecioMinimo = precioMinimoFiltro === "" || precio >= Number(precioMinimoFiltro);
        const coincidePrecioMaximo = precioMaximoFiltro === "" || precio <= Number(precioMaximoFiltro);
        return coincideTexto && coincidePrecioMinimo && coincidePrecioMaximo;
    });

    const aplicarFiltros = () => {
        setQueryFiltro(query);
        setPrecioMinimoFiltro(precioMinimo);
        setPrecioMaximoFiltro(precioMaximo);
    }

    const limpiarFiltros = () => {
        setQuery("");
        setPrecioMinimo("");
        setPrecioMaximo("");
        setQueryFiltro("");
        setPrecioMinimoFiltro("");
        setPrecioMaximoFiltro("");
    }

    useEffect(() => {
        const datosUsuarioLocal = localStorage.getItem("usuario");
        if (datosUsuarioLocal) {
            try {
                setUsuario(JSON.parse(datosUsuarioLocal));
            } catch (e) {
                console.error("Error al parsear el usuario", e);
            }
        }

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
                </div>

                <div className={style.menuDerecho}>
                    
                    {/* CONDICIONAL: Solo se muestra si el rol del usuario es 'Administrador' */}
                    {usuario && usuario.roll === "Administrador" && (
                        <div className={style.menu}>
                            <div className={style.itemMenu}>
                                <span>⚙️</span>
                                <p>Panel Administrativo</p>
                            </div>
                            <div className={style.submenu}>
                                <p><strong>Gestión:</strong></p>
                                <a 
                                    style={{ cursor: "pointer", pointerEvents: "auto" }} 
                                    onClick={() => router.push("/administrativo")}
                                >
                                    Ir al panel administrativo
                                </a>
                            </div>
                        </div>
                    )}

                    {/* PERFIL */}
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>👤</span>
                            <p>Perfil</p>
                        </div>
                        <div className={style.submenu}>
                            <a style={{ cursor: "pointer", pointerEvents: "auto" }}
                                onClick={() => router.push("/historialReservas")}>
                                Historial Reservas
                            </a>
                            <a style={{ cursor: "pointer", pointerEvents: "auto" }}
                                onClick={() => router.push("/historialFacturas") }>
                                Historial Pagos
                            </a>
                            <button className={style.botonCerrar} onClick={() => {
                                localStorage.removeItem("usuario");
                                window.location.href = "/";}}>
                                Cerrar sesión
                            </button>
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
            
            {/* Buscador */}
            <div className={style.buscador}>
                <input 
                    type="text" 
                    placeholder="Encuentra lugares y actividades" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    className={style.input} 
                />
                <input 
                    type="number"
                    placeholder="Precio mínimo"
                    value={precioMinimo}
                    min="0"
                    onChange={(e) => setPrecioMinimo(e.target.value)}
                    className={style.input}
                />
                <input
                    type="number"
                    placeholder="Precio máximo"
                    value={precioMaximo}
                    min="0"
                    onChange={(e) => setPrecioMaximo(e.target.value)}
                    className={style.input}
                />
                <button
                    onClick={aplicarFiltros}
                    className={style.botonBuscar}>
                        Buscar
                </button>
                <button
                    onClick={limpiarFiltros}
                    className={style.botonLimpiar}>
                        Limpiar
                </button>
            </div>

            <div className={style.contenido}>
                <h2>Explora el mundo con nosotros</h2>
                <p>Descubre destinos increíbles, reserva tus viajes y vive experiencias inolvidables.</p>
            </div>

            <button 
                    className={style.botonExplorar}
                    onClick={() => router.push("/paginaDestinos")}
                >
                    Ver destinos
                </button>

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
        if (!mouseEncima || !tieneMultiplesImagenes) {
            setIndiceImagen(0);
            return;
        }

        const intervalo = setInterval(() => {
            setIndiceImagen((idPrevio) => (idPrevio + 1) % imagenes.length);
        }, 1500);

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