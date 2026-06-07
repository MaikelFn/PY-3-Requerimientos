"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import style from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";

type Reserva = {
  id: number;
  tourId: number;
  usuarioId: number;
  cantidadCupos: number;
  fecha: string;
  estadoReserva: "pendiente" | "confirmada" | "cancelada";
  fechaRegistro: string;
};

type Tour = {
  id: number;
  nombreTour: string;
  destinoId: number;
};

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
};

type Destino = {
  id: number;
  nombre: string;
  ubicacion: string;
};

export default function GestionarReservas() {
  const router = useRouter();
  const { idioma, t } = useLanguage();
  const locale = idioma === "en" ? "en-US" : "es-CR";

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "pendientes" | "confirmadas">("todas");

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resReservas, resTours, resUsuarios, resDestinos] = await Promise.all([
          fetch("/api/reservas"),
          fetch("/api/tours"),
          fetch("/api/usuarios/rol"),
          fetch("/api/destinos"),
        ]);

        if (resReservas.ok) setReservas(await resReservas.json());
        if (resTours.ok) setTours(await resTours.json());
        if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
        if (resDestinos.ok) setDestinos(await resDestinos.json());
      } catch (error) {
        console.error("Error cargando datos:", error);
        Swal.fire({ icon: "error", title: t("error"), text: t("errorCargarDatos") });
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const obtenerTour = (tourId: number) => tours.find((t) => t.id === tourId);
  const obtenerUsuario = (usuarioId: number) => usuarios.find((u) => u.id === usuarioId);
  const obtenerDestino = (destinoId: number) => destinos.find((d) => d.id === destinoId);

  const traducirEstado = (estado: string) => {
    if (estado === "confirmada") return t("estadoConfirmada");
    if (estado === "cancelada") return t("estadoCancelada");
    return t("estadoPendiente");
  };

  const mostrarDetalles = (reserva: Reserva) => {
    const tour = obtenerTour(reserva.tourId);
    const destino = tour ? obtenerDestino(tour.destinoId) : null;
    const usuario = obtenerUsuario(reserva.usuarioId);

    const htmlContent = `
      <div style="text-align: left; font-size: 14px;">
        <div style="margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">${t("idReserva")}</p>
              <p style="margin: 0; color: #1b4332; font-weight: bold; font-size: 18px;">#${reserva.id}</p>
            </div>
            <div>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">${t("columnaEstado")}</p>
              <p style="margin: 0; color: #1b4332; font-weight: bold; font-size: 18px;">${traducirEstado(reserva.estadoReserva)}</p>
            </div>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #1b4332; font-size: 14px; font-weight: 600;">${t("infoCliente")}</h3>
          <p style="margin: 8px 0;"><strong>${t("nombreLabel")}:</strong> ${usuario?.nombre} ${usuario?.apellido || ""}</p>
          <p style="margin: 8px 0;"><strong>${t("correoLabel")}:</strong> ${usuario?.correo || t("noDisponible")}</p>
          <p style="margin: 8px 0;"><strong>${t("idClienteLabel")}:</strong> ${reserva.usuarioId}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #1b4332; font-size: 14px; font-weight: 600;">${t("infoTour")}</h3>
          <p style="margin: 8px 0;"><strong>${t("columnaTour")}:</strong> ${tour?.nombreTour || t("noDisponible")}</p>
          <p style="margin: 8px 0;"><strong>${t("destinoLabel")}:</strong> ${destino?.nombre || t("noDisponible")}</p>
          <p style="margin: 8px 0;"><strong>${t("ubicacionLabel")}:</strong> ${destino?.ubicacion || t("noDisponible")}</p>
          <p style="margin: 8px 0;"><strong>${t("idTourLabel")}:</strong> ${reserva.tourId}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #1b4332; font-size: 14px; font-weight: 600;">${t("detallesReservaSeccion")}</h3>
          <p style="margin: 8px 0;"><strong>${t("fechaTour")}:</strong> ${new Date(reserva.fecha).toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <p style="margin: 8px 0;"><strong>${t("cuposReservados")}:</strong> <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${reserva.cantidadCupos}</span></p>
          <p style="margin: 8px 0;"><strong>${t("fechaRegistro2")}:</strong> ${new Date(reserva.fechaRegistro).toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    `;

    Swal.fire({
      title: `${t("detallesReserva")} #${reserva.id}`,
      html: htmlContent,
      icon: "info",
      confirmButtonText: t("cerrar"),
      width: "500px",
    });
  };

  const confirmarReserva = async (reservaId: number) => {
    const confirmacion = await Swal.fire({
      title: t("confirmarReservaTitle"),
      text: t("confirmarReservaText"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("btnConfirmar"),
      cancelButtonText: t("cancelar"),
    });

    if (!confirmacion.isConfirmed) return;

    setProcesando(true);
    try {
      const res = await fetch(`/api/reservas/${reservaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoReserva: "confirmada" }),
      });
      
      if (res.ok) {
        setReservas((prev) => prev.map((r) => r.id === reservaId ? { ...r, estadoReserva: "confirmada" } : r));
        Swal.fire({ icon: "success", title: t("exito"), text: t("reservaConfirmadaOk") });
      } else {
        const data = await res.json();
        Swal.fire({ icon: "error", title: t("error"), text: data.error || t("errorConfirmar") });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({ icon: "error", title: t("error"), text: t("errorProcesar") });
    } finally {
      setProcesando(false);
    }
  };

  const cancelarReserva = async (reservaId: number) => {
    const confirmacion = await Swal.fire({
      title: t("cancelarReservaTitle"),
      text: t("cancelarReservaText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("btnCancelar"),
      cancelButtonText: t("mantener"),
      confirmButtonColor: "#ef4444",
    });

    if (!confirmacion.isConfirmed) return;

    setProcesando(true);
    try {
      const res = await fetch(`/api/reservas/${reservaId}/cancel`, { method: "POST" });
      if (res.ok) {
        setReservas((prev) => prev.map((r) => r.id === reservaId ? { ...r, estadoReserva: "cancelada" } : r));
        Swal.fire({ icon: "success", title: t("exito"), text: t("reservaCanceladaOk") });
      } else {
        const data = await res.json();
        Swal.fire({ icon: "error", title: t("error"), text: data.error || t("errorCancelar") });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({ icon: "error", title: t("error"), text: t("errorProcesar") });
    } finally {
      setProcesando(false);
    }
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (filtro === "pendientes") return r.estadoReserva === "pendiente";
    if (filtro === "confirmadas") return r.estadoReserva === "confirmada";
    return true;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente": return "#fbbf24";
      case "confirmada": return "#4ade80";
      case "cancelada": return "#ef4444";
      default: return "#666";
    }
  };

  return (
    <div className={style.contenedor}>
      <div className={style.menuSuperior}>
        <div className={style.menuIzquierdo}>
          <button className={style.botonVolver} onClick={() => router.push("/administrativo")}>
            {t("volverPanelAdmin")}
          </button>
        </div>
        <div className={style.menuDerecho}>
          <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1b4332" }}>
            📋 {t("gestionReservas")}
          </span>
        </div>
      </div>

      <div className={style.contenido}>
        <h1 className={style.tituloSeccion}>{t("gestionReservas")}</h1>
        <p className={style.subtitulo}>{t("confirmaVisualizaReservas")}</p>

        {/* Filtros */}
        <div style={{ marginBottom: "30px", display: "flex", gap: "10px" }}>
          {(["todas", "pendientes", "confirmadas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                backgroundColor: filtro === f ? "#1b4332" : "#e0e7ff",
                color: filtro === f ? "white" : "#1b4332",
                transition: "all 0.3s",
              }}
            >
              {t(f)}
            </button>
          ))}
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p>{t("cargandoReservas2")}</p>
          </div>
        ) : (
          <>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
              {t("totalReservas")}: <strong>{reservasFiltradas.length}</strong>
            </p>

            {reservasFiltradas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f9fafb", borderRadius: "8px", color: "#666" }}>
                <p>{t("noHayReservas")}</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f7f4", color: "#1b4332" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>{t("columnaId")}</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>{t("columnaCliente")}</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>{t("columnaTour")}</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>{t("columnaDestino")}</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>{t("columnaFecha")}</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>{t("columnaCupos")}</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>{t("columnaEstado")}</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>{t("columnaAcciones")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map((reserva) => {
                      const tour = obtenerTour(reserva.tourId);
                      const usuario = obtenerUsuario(reserva.usuarioId);
                      const destino = tour ? obtenerDestino(tour.destinoId) : null;

                      return (
                        <tr
                          key={reserva.id}
                          onClick={() => mostrarDetalles(reserva)}
                          style={{ borderBottom: "1px solid #eee", transition: "background-color 0.2s", cursor: "pointer" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                        >
                          <td style={{ padding: "12px", color: "#0e0606" }}>#{reserva.id}</td>
                          <td style={{ padding: "12px", color: "#0e0606" }}>{usuario?.nombre} {usuario?.apellido || ""}</td>
                          <td style={{ padding: "12px", color: "#0e0606" }}>{tour?.nombreTour || "N/A"}</td>
                          <td style={{ padding: "12px", color: "#0e0606" }}>{destino?.nombre || "N/A"}</td>
                          <td style={{ padding: "12px", color: "#0e0606" }}>{new Date(reserva.fecha).toLocaleDateString(locale)}</td>
                          <td style={{ padding: "12px", textAlign: "center", color: "#0e0606" }}><strong>{reserva.cantidadCupos}</strong></td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", backgroundColor: getEstadoColor(reserva.estadoReserva) + "22", color: getEstadoColor(reserva.estadoReserva) }}>
                              {traducirEstado(reserva.estadoReserva)}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            {reserva.estadoReserva === "pendiente" && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); confirmarReserva(reserva.id); }} disabled={procesando} style={{ padding: "6px 12px", marginRight: "8px", borderRadius: "6px", border: "none", backgroundColor: "#4ade80", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                                  {t("btnConfirmar")}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); cancelarReserva(reserva.id); }} disabled={procesando} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                                  {t("btnCancelar")}
                                </button>
                              </>
                            )}
                            {reserva.estadoReserva === "confirmada" && (
                              <button onClick={(e) => { e.stopPropagation(); cancelarReserva(reserva.id); }} disabled={procesando} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                                {t("btnCancelar")}
                              </button>
                            )}
                            {reserva.estadoReserva === "cancelada" && (
                              <span style={{ color: "#999", fontSize: "12px" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}