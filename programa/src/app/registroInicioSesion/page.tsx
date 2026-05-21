"use client"
import { useState } from "react"
import style from "./page.module.css"

type Pantalla = "registro" | "inicioSesion" | "recuperarContrasena"

export default function RegistroInicioSesion() {
    const [pantalla, setPantalla] = useState<Pantalla>("inicioSesion")
    return(
        <main className={style.fondo}>
            <div className={style.tarjeta}>

                {/* Inicio de sesión*/} 
                {pantalla === "inicioSesion" && (
                    <div>
                        <div className={style.encabezado}>
                            <img src="/logo.png" alt="CR Tours" className={style.logo} />
                            <p className={style.subtitulo}>¡Bienvenido a bordo!</p>
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Correo electrónico</label>
                            <input type="email" placeholder="juanperez@correo.com" className={style.input} />
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Contraseña</label>
                            <input type="password" placeholder="********" className={style.input} />
                        </div>
                        
                        <div className={style.olvidar}>
                            <button onClick={() => setPantalla("recuperarContrasena")} className={style.enlace}>¿Olvidaste tu contraseña?</button>
                        </div>

                        <button className={style.boton}>Iniciar sesión</button>
                        <p className={style.piepagina}>
                            ¿No tienes una cuenta?{" "}
                            <button onClick={() => setPantalla("registro")} className={style.enlace}>
                                Regístrate aquí
                            </button>
                        </p>
                    </div>
                )}

                {/* Registro */}
                {pantalla === "registro" && (
                    <div>
                        <button onClick={() => setPantalla("inicioSesion")} className={style.volver}>← Volver</button>
                        <h2 className={style.titulo}>Crea tu cuenta</h2>
                        <p className={style.subtitulo}>¡Únete a CR Tours y comienza tu aventura!</p>

                        <div className={style.dosColumnas}>
                            <div className={style.campos}>
                                <label className={style.etiqueta}>Nombre</label>
                                <input type="text" placeholder="Juan" className={style.input} />
                            </div>

                            <div className={style.campos}>
                                <label className={style.etiqueta}>Apellido</label>
                                <input type="text" placeholder="Pérez" className={style.input} />
                            </div>
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Correo electrónico</label>
                            <input type="email" placeholder="juanperez@correo.com" className={style.input} />
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Contraseña</label>
                            <input type="password" placeholder="********" className={style.input} />
                        </div>

                        <button className={style.boton}>Crear cuenta</button>
                        <p className={style.piepagina}>
                            ¿Ya tienes una cuenta?{" "}
                            <button onClick={() => setPantalla("inicioSesion")} className={style.enlace}>
                                Inicia sesión aquí
                            </button>
                        </p>
                    </div>
                )}

                {/* Recuperar contraseña */}
                {pantalla === "recuperarContrasena" && (
                    <div>
                        <button onClick={() => setPantalla("inicioSesion")} className={style.volver}>← Volver</button>
                        <h2 className={style.titulo}>Recuperar contraseña</h2>
                        <p className={style.subtitulo}>Ingresa tu correo electrónico para recibir instrucciones de recuperación.</p>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Correo electrónico</label>
                            <input type="email" placeholder="juanperez@correo.com" className={style.input} />
                        </div>

                        <button className={style.boton}>Enviar instrucciones</button>

                        <p className={style.piepagina}>
                            <button onClick={() => setPantalla("inicioSesion")} className={style.enlace}>
                                Volver al inicio de sesión
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}