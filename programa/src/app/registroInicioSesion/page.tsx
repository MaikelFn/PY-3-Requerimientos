"use client"
import { useState } from "react"
import style from "./page.module.css"

type Pantalla = "registro" | "inicioSesion" | "recuperarContrasena"

export default function RegistroInicioSesion() {
    const [pantalla, setPantalla] = useState<Pantalla>("inicioSesion")

    // Estado para inicio de sesión
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Estado para registro
    const [nombre, setNombre] = useState("")
    const [apellido, setApellido] = useState("")
    const [emailRegistro, setEmailRegistro] = useState("")
    const [passwordRegistro, setPasswordRegistro] = useState("")

    async function handleLogin() {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, contrasena: password })
            })

            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Error al iniciar sesión')
                return
            }

            const usuario = await res.json()
            alert(`Bienvenido, ${usuario.nombre} ${usuario.apellido}`)
        } catch (err) {
            alert('Error de conexión')
        }
    }

    async function handleRegister() {
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, correo: emailRegistro, contrasena: passwordRegistro })
            })

            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Error al crear la cuenta')
                return
            }

            const usuario = await res.json()
            alert(`Cuenta creada. Bienvenido, ${usuario.nombre}`)
            setPantalla('inicioSesion')
            setEmail(usuario.correo)
        } catch (err) {
            alert('Error de conexión')
        }
    }

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
                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="juanperez@correo.com" className={style.input} />
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Contraseña</label>
                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="********" className={style.input} />
                        </div>
                        
                        <div className={style.olvidar}>
                            <button onClick={() => setPantalla("recuperarContrasena")} className={style.enlace}>¿Olvidaste tu contraseña?</button>
                        </div>

                        <button onClick={handleLogin} className={style.boton}>Iniciar sesión</button>
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
                                <input value={nombre} onChange={(e) => setNombre(e.target.value)} type="text" placeholder="Juan" className={style.input} />
                            </div>

                            <div className={style.campos}>
                                <label className={style.etiqueta}>Apellido</label>
                                <input value={apellido} onChange={(e) => setApellido(e.target.value)} type="text" placeholder="Pérez" className={style.input} />
                            </div>
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Correo electrónico</label>
                            <input value={emailRegistro} onChange={(e) => setEmailRegistro(e.target.value)} type="email" placeholder="juanperez@correo.com" className={style.input} />
                        </div>

                        <div className={style.campos}>
                            <label className={style.etiqueta}>Contraseña</label>
                            <input value={passwordRegistro} onChange={(e) => setPasswordRegistro(e.target.value)} type="password" placeholder="********" className={style.input} />
                        </div>

                        <button onClick={handleRegister} className={style.boton}>Crear cuenta</button>
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