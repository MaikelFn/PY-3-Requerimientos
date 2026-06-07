"use client";
import { useEffect, useState } from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

type FechaCupo = {
    fecha: string;
    cupos: string | number;
};

type Tour = {
    id?: number;
    nombreTour: string;
    descripcionBreve: string;
    precio: string;
    imagenes?: string[];
    fechasYCupos?: FechaCupo[];
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
    const { currency, setCurrency } = useCurrency();
    const { idioma, setIdioma, t } = useLanguage(); // <-- hook de idioma

    const toursFiltrados = tours.filter(tour => {
        const coincideTexto =
            tour.nombreTour.toLowerCase().includes(queryFiltro.toLowerCase()) ||
            tour.descripcionBreve.toLowerCase().includes(queryFiltro.toLowerCase());

        const precio = Number(tour.precio);
        const coincidePrecioMinimo = precioMinimoFiltro === "" || precio >= Number(precioMinimoFiltro);
        const coincidePrecioMaximo = precioMaximoFiltro === "" || precio <= Number(precioMaximoFiltro);

        const tieneCuposDisponibles = tour.fechasYCupos?.some(f => Number(f.cupos) > 0) ?? true;

        return coincideTexto && coincidePrecioMinimo && coincidePrecioMaximo && tieneCuposDisponibles;
    });

    const aplicarFiltros = () => {
        setQueryFiltro(query);
        setPrecioMinimoFiltro(precioMinimo);
        setPrecioMaximoFiltro(precioMaximo);
    };

    const limpiarFiltros = () => {
        setQuery("");
        setPrecioMinimo("");
        setPrecioMaximo("");
        setQueryFiltro("");
        setPrecioMinimoFiltro("");
        setPrecioMaximoFiltro("");
    };

    useEffect(() => {
        const datosUsuarioLocal = localStorage.getItem("usuario");
        if (datosUsuarioLocal) {
            try {
                setUsuario(JSON.parse(datosUsuarioLocal));
            } catch (e) {
                console.error("Error al parsear el usuario", e);
            }
        }

        async function cargarTours() {
            try {
                const respuesta = await fetch("/api/tours");
                if (!respuesta.ok) throw new Error("Error al cargar tours");
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
                <div className={style.menuIzquierdo}></div>

                <div className={style.menuDerecho}>
                    {/* Panel Administrativo — solo para administradores */}
                    {usuario && usuario.roll === "Administrador" && (
                        <div className={style.menu}>
                            <div className={style.itemMenu}>
                                <span>⚙️</span>
                                <p>{t("panelAdministrativo")}</p>
                            </div>
                            <div className={style.submenu}>
                                <p><strong>{t("gestion")}</strong></p>
                                <a
                                    style={{ cursor: "pointer", pointerEvents: "auto" }}
                                    onClick={() => router.push("/administrativo")}
                                >
                                    {t("irPanelAdministrativo")}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Perfil */}
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>👤</span>
                            <p>{t("perfil")}</p>
                        </div>
                        <div className={style.submenu}>
                            <a
                                style={{ cursor: "pointer", pointerEvents: "auto" }}
                                onClick={() => router.push("/historialReservas")}
                            >
                                {t("historialReservas")}
                            </a>
                            <a
                                style={{ cursor: "pointer", pointerEvents: "auto" }}
                                onClick={() => router.push("/historialFacturas")}
                            >
                                {t("historialPagosTitulo")}
                            </a>
                            <button
                                className={style.botonCerrar}
                                onClick={() => {
                                    localStorage.removeItem("usuario");
                                    window.location.href = "/";
                                }}
                            >
                                {t("cerrarSesion")}
                            </button>
                        </div>
                    </div>

                    {/* Idioma y Moneda */}
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>🌐</span>
                            <p>{idioma.toUpperCase()}/{currency === "USD" ? "USD$" : "CRC₡"}</p>
                        </div>
                        <div className={style.submenu}>
                            <p><strong>{t("idioma")}</strong></p>
                            <a
                                style={{ cursor: "pointer", fontWeight: idioma === "es" ? "bold" : "normal" }}
                                onClick={() => setIdioma("es")}
                            >
                                {t("espanol")}
                            </a>
                            <a
                                style={{ cursor: "pointer", fontWeight: idioma === "en" ? "bold" : "normal" }}
                                onClick={() => setIdioma("en")}
                            >
                                {t("ingles")}
                            </a>
                            <p><strong>{t("moneda")}</strong></p>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as "USD" | "CRC")}
                                className={style.selectMoneda}
                            >
                                <option value="USD">{t("usd")}</option>
                                <option value="CRC">{t("crc")}</option>
                            </select>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className={style.menu}>
                        <div className={style.itemMenu}>
                            <span>📞</span>
                            <p>{t("contacto")}</p>
                        </div>
                        <div className={style.submenu}>
                            <p><strong>{t("contacto")}:</strong></p>
                            <p>{t("contactoEmail")}</p>
                            <p>{t("contactoTel")}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={style.banner}></div>

            {/* Buscador */}
            <div className={style.buscador}>
                <input
                    type="text"
                    placeholder={t("encuentraLugaresActividades")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={style.input}
                />
                <input
                    type="number"
                    placeholder={t("precioMinimo")}
                    value={precioMinimo}
                    min="0"
                    onChange={(e) => setPrecioMinimo(e.target.value)}
                    className={style.input}
                />
                <input
                    type="number"
                    placeholder={t("precioMaximo")}
                    value={precioMaximo}
                    min="0"
                    onChange={(e) => setPrecioMaximo(e.target.value)}
                    className={style.input}
                />
                <button onClick={aplicarFiltros} className={style.botonBuscar}>
                    {t("buscar")}
                </button>
                <button onClick={limpiarFiltros} className={style.botonLimpiar}>
                    {t("limpiar")}
                </button>
            </div>

            <div className={style.contenido}>
                <h2>{t("exploraElMundoConNosotros")}</h2>
                <p>{t("descubreDestinos")}</p>
            </div>

            <button
                className={style.botonExplorar}
                onClick={() => router.push("/paginaDestinos")}
            >
                {t("verDestinos")}
            </button>

            {/* Tours Destacados */}
            <div className={style.tours}>
                <h2 className={style.tituloSeccion}>{t("toursDestacados")}</h2>
                {toursFiltrados.map((tour) => (
                    <TarjetaTour key={tour.id} tour={tour} />
                ))}
            </div>
        </div>
    );
}

// SUBCOMPONENTE: TarjetaTour
function TarjetaTour({ tour }: { tour: Tour }) {
    const router = useRouter();
    const [indiceImagen, setIndiceImagen] = useState(0);
    const [mouseEncima, setMouseEncima] = useState(false);
    const { formatCurrency } = useCurrency();
    const { t } = useLanguage(); // <-- también usa el hook aquí

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

    const precioNumero = Number(tour.precio);
    const precioFormateado = Number.isFinite(precioNumero)
        ? formatCurrency(precioNumero)
        : tour.precio;

    return (
        <div
            className={style.tour}
            onMouseEnter={() => setMouseEncima(true)}
            onMouseLeave={() => setMouseEncima(false)}
        >
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
                        <p>{t("imagenNoDisponible")}</p>
                    </div>
                )}
            </div>

            <div className={style.info}>
                <h3>{tour.nombreTour}</h3>
                <p className={style.descripcion}>{tour.descripcionBreve}</p>
            </div>

            <div className={style.precio}>
                <p>{precioFormateado} <small>{t("porPersona")}</small></p>
                <button
                    className={style.botonDetalle}
                    onClick={() => {
                        if (tour.id !== undefined) {
                            sessionStorage.setItem("tourSeleccionado", JSON.stringify(tour));
                            router.push(`/detalleTours?id=${tour.id}`);
                        } else {
                            console.error("ID del tour no definido", tour);
                        }
                    }}
                >
                    {t("verDetalles")}
                </button>
            </div>
        </div>
    );
}