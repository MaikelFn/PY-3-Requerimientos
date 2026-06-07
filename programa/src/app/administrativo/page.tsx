"use client";
import { useEffect, useState } from "react";
import style from "./page.module.css";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext"

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
            `¿Estás seguro de que deseas cambiar el rol de ${correo} a "${nuevoRol}"?`
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
                alert("Rol actualizado correctamente.");
                cargarUsuarios(); 
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar la solicitud.");
        } finally {
            setCargando(false);
        }
    };

    return (
    <div className={style.contenedor}>
        <div className={style.menuSuperior}>
            <div className={style.menuIzquierdo}>
                <button className={style.botonVolver} onClick={() => router.push("/paginaPrincipal")}>
                    ⬅ Volver a la Pagina Principal
                </button>
            </div>
            <div className={style.menuDerecho}>
                <div className={style.perfilAdmin}>
                    <span>👤</span>
                    <span>Administrador</span>
                </div>
            </div>
        </div>

        <div className={style.contenido}>
            <h1 className={style.tituloSeccion}>Panel de Control Administrativo</h1>
            <p className={style.subtitulo}>Selecciona un módulo para gestionar los recursos del sistema:</p>

            <div className={style.panelControles}>
                
                {/* GESTIONAR DESTINOS */}
                <div className={style.menuAdmin}>
                    <button className={style.botonGestion}> GESTIONAR DESTINO ▾</button>
                    <div className={style.submenuAdmin}>
                        <div className={style.indicadorSubmenu}>Opciones</div>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarDestinos")}>Crear destino</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioModificarDestinos")}>Modificar destino</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/eliminarDestinos")}>Eliminar destino</a>
                    </div>
                </div>

                {/* GESTIONAR TOURS */}
                <div className={style.menuAdmin}>
                    <button className={style.botonGestion}> GESTIONAR TOURS ▾</button>
                    <div className={style.submenuAdmin}>
                        <div className={style.indicadorSubmenu}>Opciones</div>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarTours")}>Crear tour</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioModificarTours")}>Modificar tour</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/eliminarTours")}>Eliminar tour</a>
                    </div>
                </div>

                {/* GESTIONAR DISPONIBILIDAD */}
                <div className={style.menuAdmin}>
                    <button className={style.botonDisponibilidad} onClick={() => router.push("/admin/disponibilidad")}>
                        GESTIONAR DISPONIBILIDAD DE TOUR
                    </button>
                </div>

                {/* GESTIONAR RESERVAS */}
                <div className={style.menuAdmin}>
                    <button className={style.botonGestion} onClick={() => router.push("/gestionarReservas")}>
                        📋 GESTIONAR RESERVAS ▾
                    </button>
                </div>
            </div>

            {/* GESTIÓN DE ROLES ADMINISTRATIVOS */}
            <div style={{ marginTop: "60px", textAlign: "left", background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                <h2 style={{ color: "#1b4332", marginBottom: "10px", fontSize: "22px" }}> Gestión de Permisos de Usuarios</h2>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>Asigna o revoca privilegios de administrador a las cuentas registradas en la plataforma.</p>
                
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f0f7f4", color: "#1b4332", textAlign: "left" }}>
                                <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>Usuario</th>
                                <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>Correo</th>
                                <th style={{ padding: "12px", borderBottom: "2px solid #ddd" }}>Rol Actual</th>
                                <th style={{ padding: "12px", borderBottom: "2px solid #ddd", textAlign: "center" }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((usr) => (
                                <tr key={usr.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "12px", color: "#0e0606" }}>{usr.nombre} {usr.apellido}</td>
                                    <td style={{ padding: "12px", color: "#0e0606" }}>{usr.correo}</td>
                                    <td style={{ padding: "12px" }}>
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                            backgroundColor: usr.roll === "Administrador" ? "#d1fae5" : "#f3f4f6",
                                            color: usr.roll === "Administrador" ? "#065f46" : "#374151"
                                        }}>
                                            {usr.roll || "Cliente"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "center" }}>
                                        <button
                                            onClick={() => handleCambiarRol(usr.correo, usr.roll)}
                                            disabled={cargando}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                border: "none",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                transition: "all 0.2s",
                                                backgroundColor: usr.roll === "Administrador" ? "#fee2e2" : "#e0f2fe",
                                                color: usr.roll === "Administrador" ? "#991b1b" : "#0369a1",
                                            }}
                                        >
                                            {usr.roll === "Administrador" ? "❌ Quitar Admin" : "🔑 Hacer Admin"}
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