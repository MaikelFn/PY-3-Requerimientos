"use client";
import style from "./page.module.css";
import { useRouter } from "next/navigation";

export default function PanelAdministrativo() {
    const router = useRouter();

    return (
    <div className={style.contenedor}>
        <div className={style.menuSuperior}>
            <div className={style.menuIzquierdo}>
                <button className={style.botonVolver} onClick={() => router.push("/paginaPrincipalAdmin")}>
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
                    <button className={style.botonGestion}>📍 GESTIONAR DESTINO ▾</button>
                    <div className={style.submenuAdmin}>
                        <div className={style.indicadorSubmenu}>Opciones</div>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarDestinos")}>Crear destino</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarDestinos")}>Modificar destino</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarDestinos")}>Eliminar destino</a>
                    </div>
                </div>

                {/* GESTIONAR TOURS */}
                <div className={style.menuAdmin}>
                    <button className={style.botonGestion}>🎒 GESTIONAR TOURS ▾</button>
                    <div className={style.submenuAdmin}>
                        <div className={style.indicadorSubmenu}>Opciones</div>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarTours")}>Crear tour</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarTours")}>Modificar tour</a>
                        <a className={style.opcionSubmenu} onClick={() => router.push("/formularioAgregarTours")}>Eliminar tour</a>
                    </div>
                </div>

                {/* GESTIONAR DISPONIBILIDAD */}
                <div className={style.menuAdmin}>
                    <button className={style.botonDisponibilidad} onClick={() => router.push("/admin/disponibilidad")}>
                        📅 GESTIONAR DISPONIBILIDAD DE TOUR
                    </button>
                </div>

            </div>
        </div>
    </div>
);
}