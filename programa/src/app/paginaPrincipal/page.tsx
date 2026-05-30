"use client";
import {useEffect, useState} from "react";
import style from "./page.module.css"
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
    const [query, setQuery] = useState("")
    const router = useRouter();
    const toursFiltrados = tours.filter(tour =>
    tour.nombreTour.toLowerCase().includes(query.toLowerCase()) ||
    tour.descripcionBreve.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        /*
        // Verificar si el usuario está autenticado
        const user = localStorage.getItem("usuario");
        //  Si no hay usuario redirigir al login
        if (!user) {
            window.location.href = "/";
        } else {
            setUsuario(user);
        }*/

        async function cargarTours(){
            try{
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
    }, []); // Solo se ejecuta una vez al cargar
    return(

        <div className={style.contenedor}>
            <div className={style.menuSuperior}>
                <div className={style.menuIzquierdo}>
                    {/*Botón para cerrar sesión*/}
                    <button className={style.botonCerrar} onClick={() => {
                        localStorage.removeItem("usuario");
                        window.location.href = "/";
                    }}>
                        Cerrar sesión
                    </button>
                </div>

                {/*Menu derecho*/}
                <div className={style.menuDerecho}>
                    {/*Perfil*/}
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
                    {/* idioma / moneda*/}
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
                    {/*Contacto */}
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
            {/*Banner*/}
            <div className={style.banner}>
            </div>
            {/*Buscador de tours*/}
            <div className={style.buscador}>
                <input type="text" placeholder="Encuentra lugares y actividades" value={query} onChange={(e) => setQuery(e.target.value)} className={style.input} />
            </div>
            {/*Contenido principal*/}
            <div className={style.contenido}>
                <h2>Explora el mundo con nosotros</h2>
                <p>Descubre destinos increíbles, reserva tus viajes y vive experiencias inolvidables.</p>

            </div>
            {/*Tours destacados*/}
            <div className={style.tours}>
                <h2 className={style.tituloSeccion}>Tours destacados</h2>
                {toursFiltrados.map((tour) => (
                    <div key={tour.id} className={style.tour}>
                        
                        {/*Información del tour*/}
                        <div className={style.info}>
                            <h3>{tour.nombreTour}</h3>
                            {/*Descripción del tour*/}
                            <p className={style.descripcion}>{tour.descripcionBreve}</p>
                        </div>
                        {/*precio */}
                        <div className={style.precio}>
                            <p>₡{tour.precio}</p>
                            {/*Botón para ver detalles del tour*/}
                            <button className={style.botonDetalle} onClick={() => {
                                if(tour.id !== undefined) {
                                    {/* Guardar el tour seleccionado en sessionStorage para acceder a él en la página de detalles */}
                                    sessionStorage.setItem("tourSeleccionado", JSON.stringify(tour));
                                    router.push(`/detalleTours?id=${tour.id}`)
                                } else {
                                    console.error("ID del tour no definido", tour);
                                }
                            }}>Ver detalles</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}