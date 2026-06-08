"use client";
import { useEffect, useState } from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type Usuario = {
    id: number;
    nombre: string;
    apellido: string;
    correo: string;
    roll: "Cliente" | "Administrador";
    fechaRegistro: string;
}

export default function PanelAdministrativo() {
    const router = useRouter();
    const { t } = useLanguage();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(false);

    const cargarUsuarios = async () => {
        try {
            const res = await fetch("/api/usuarios/rol");
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleCambiarRol = async (correo: string, rolActual: "Cliente" | "Administrador") => {
        const nuevoRol = rolActual === "Administrador" ? "Cliente" : "Administrador";
        const confirmacion = confirm(
            t("confirmarCambioRol").replace("{correo}", correo).replace("{rol}", t(nuevoRol === "Administrador" ? "administrador" : "cliente"))
        );
        if (!confirmacion) return;

        setCargando(true);
        try {
            const res = await fetch("/api/usuarios/rol", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, nuevoRol })
            });
            if (res.ok) {
                alert(t("rolActualizadoOk"));
                cargarUsuarios();
            } else {
                const errData = await res.json();
                alert(`${t("error")}: ${errData.error}`);
            }
        } catch (error) {
            console.error(error);
            alert(t("errorCambioRol"));
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className={style.contenedor}>
            <img src="/logo.png" alt="Logo" className={style.logo} onClick={() => router.push("/paginaPrincipal")} />
            <div className={style.contenido}>
                <h1 className={style.tituloSeccion}>{t("panelControlAdmin")}</h1>
                <p className={style.subtitulo}>{t("subtituloPanel")}</p>

                <div className={style.panelControles}>

                    {/* GESTIONAR DESTINOS */}
                    <div className={style.menuAdmin}>
                        <button className={style.botonGestion}>{t("gestionarDestino2")}</button>
                        <div className={style.submenuAdmin}>
                            <div className={style.indicadorSubmenu}>{t("opciones")}</div>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarDestinos")}>{t("crearDestino2")}</a>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/formularioModificarDestinos")}>{t("modificarDestino2")}</a>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/eliminarDestinos")}>{t("eliminarDestino2")}</a>
                        </div>
                    </div>

                    {/* GESTIONAR TOURS */}
                    <div className={style.menuAdmin}>
                        <button className={style.botonGestion}>{t("gestionarTours2")}</button>
                        <div className={style.submenuAdmin}>
                            <div className={style.indicadorSubmenu}>{t("opciones")}</div>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarTours")}>{t("crearTour2")}</a>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/formularioModificarTours")}>{t("modificarTour2")}</a>
                            <a className={style.opcionSubmenu} onClick={() => router.push("/eliminarTours")}>{t("eliminarTour2")}</a>
                        </div>
                    </div>

                    {/* GESTIONAR RESERVAS */}
                    <div className={style.menuAdmin}>
                        <button className={style.botonGestion} onClick={() => router.push("/gestionarReservas")}>
                            {t("gestionarReservas2")}
                        </button>
                    </div>
                </div>

                {/* GESTIÓN DE ROLES */}
                <div style={{ marginTop: "60px", textAlign: "left", background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                    <h2 style={{ color: "#1b4332", marginBottom: "10px", fontSize: "22px" }}>
                        {t("gestionPermisos")}
                    </h2>
                    <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                        {t("subtituloPermisos")}
                    </p>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f0f7f4", color: "#1b4332", textAlign: "left" }}>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>{t("usuario")}</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>{t("correo")}</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>{t("rolActual")}</th>
                                    <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "center" }}>{t("accion")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usr) => (
                                    <tr key={usr.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "12px", color: "#0e0606" }}>{usr.nombre} {usr.apellido}</td>
                                        <td style={{ padding: "12px", color: "#0e0606" }}>{usr.correo}</td>
                                        <td style={{ padding: "12px" }}>
                                            <span style={{
                                                padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                                                backgroundColor: usr.roll === "Administrador" ? "#d1fae5" : "#f3f4f6",
                                                color: usr.roll === "Administrador" ? "#065f46" : "#374151"
                                            }}>
                                                {usr.roll === "Administrador" ? t("administrador") : t("cliente")}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            <button
                                                onClick={() => handleCambiarRol(usr.correo, usr.roll)}
                                                disabled={cargando}
                                                style={{
                                                    padding: "6px 14px", borderRadius: "6px", border: "none",
                                                    fontWeight: "600", cursor: "pointer", fontSize: "13px", transition: "all 0.2s",
                                                    backgroundColor: usr.roll === "Administrador" ? "#fee2e2" : "#e0f2fe",
                                                    color: usr.roll === "Administrador" ? "#991b1b" : "#0369a1",
                                                }}
                                            >
                                                {usr.roll === "Administrador" ? t("quitarAdmin") : t("hacerAdmin")}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}