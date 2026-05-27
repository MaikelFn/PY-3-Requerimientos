"use client";
import {useEffect, useState} from "react";
import style from "./page.module.css"


type Tour = {
    id?: string;
    nombreTour: string;
    descripcionBreve: string;
    precio: string;
    imagenes?: string[];
};


export default function PaginaPrincipal() {
    const [usuario, setUsuario] = useState("");
    const [tours, setTours] = useState<Tour[]>([]);
    const [query, setQuery] = useState("")
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
                {/*Menu derecho*/}
                <div className={style.menuDerecho}>
                    {/*Perfil*/}
                    <div className={style.menu}>
                        <span>PERFIL</span> 
                        <div className={style.submenu}>
                            <a href="#reservas">Historial Reservas</a>
                            <a href="#pagos">Historial Pagos</a>
                        </div>
                    </div>
                    {/* idioma / moneda*/}
                    <div className={style.menu}>
                        <span>ES / USD</span>
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
                        <span>CONTACTO</span>
                        <div className={style.submenu}>
                            <a href="#contacto">Contacto empresa</a>
                            <a>Email: contacto@tours.com</a>
                            <a>Tel: +506 8888-8888</a>
                        </div>
                    </div>

                </div>
            </div>
            {/*Banner*/}
            <div className={style.banner}>
                <h1>Bienvenido a bordo! {usuario}</h1>

                {/*Botón para cerrar sesión*/}
                <button className={style.boton} onClick={() => {
                    localStorage.removeItem("usuario");
                    window.location.href = "/";
                }}>
                    Cerrar sesión
                </button>
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
                            <p>${tour.precio}</p>
                            <button className={style.botonDetalle}>
                                Ver detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}