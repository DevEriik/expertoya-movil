import { useState } from "react";
import { apiClient } from "../utils/api";

export type Solicitud = {
  id: string;
  estado:
    | "PENDIENTE"
    | "ACEPTADO"
    | "RECHAZADO"
    | "CANCELADO"
    | "CANCELADO_AUTO";
  expira_at: string;
  fecha_tentativa: string;
  franja_horaria: string;
  descripcion: string;
  chat_id?: string | null;
  cliente: {
    nombre: string;
    apellido: string;
    foto_perfil?: string;
  };
  servicio: {
    titulo_servicio: string;
    oficio: {
      nombre_oficio: string;
    };
  };
};

export const useSolicitudes = () => {
  const [loading, setLoading] = useState(false);

  const crearSolicitud = async (data: {
    profesional_id: string;
    descripcion: string;
    fecha_tentativa: string;
    franja_horaria: string;
  }) => {
    setLoading(true);
    try {
      const response = await apiClient("/api/solicitudes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Error al crear solicitud:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const obtenerRecibidas = async (): Promise<Solicitud[]> => {
    try {
      const response = await apiClient("/api/solicitudes/recibidas");
      if (!response.ok)
        throw new Error("No se pudieron cargar las solicitudes");
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error("Error al obtener solicitudes recibidas:", error);
      throw error;
    }
  };

  const aceptarSolicitud = async (id: string): Promise<Solicitud> => {
    try {
      const response = await apiClient(`/api/solicitudes/${id}/responder`, {
        method: "PATCH",
        body: JSON.stringify({ accion: "ACEPTADO" }),
      });
      if (!response.ok) throw new Error("Error al aceptar la solicitud");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("Error al aceptar solicitud:", error);
      throw error;
    }
  };

  const rechazarSolicitud = async (id: string): Promise<Solicitud> => {
    try {
      const response = await apiClient(`/api/solicitudes/${id}/responder`, {
        method: "PATCH",
        body: JSON.stringify({ accion: "RECHAZADO" }),
      });
      if (!response.ok) throw new Error("Error al rechazar la solicitud");
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      throw error;
    }
  };

  const abrirChat = async (id: string): Promise<string> => {
    try {
      const response = await apiClient(`/api/chat/iniciar`, {
        method: "POST",
        body: JSON.stringify({ solicitud_id: id }),
      });
      if (!response.ok) return "chat_" + id;
      const json = await response.json();
      return json.data?.id || json.chatId || "chat_" + id;
    } catch (error) {
      console.error("Error al abrir chat:", error);
      return "chat_" + id;
    }
  };

  const obtenerMisSolicitudes = async (): Promise<Solicitud[]> => {
    try {
      const response = await apiClient("/api/solicitudes/mias");
      if (!response.ok)
        throw new Error("No se pudieron cargar tus solicitudes");
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error("Error al obtener mis solicitudes:", error);
      throw error;
    }
  };

  const contarPendientes = async (): Promise<number> => {
    try {
      const response = await apiClient("/api/solicitudes/recibidas");
      if (!response.ok) return 0;
      const json = await response.json();
      const recibidas: Solicitud[] = json.data || [];
      return recibidas.filter((s) => s.estado === "PENDIENTE").length;
    } catch (error) {
      console.error("Error al contar pendientes:", error);
      return 0;
    }
  };

  return {
    crearSolicitud,
    obtenerRecibidas,
    aceptarSolicitud,
    rechazarSolicitud,
    abrirChat,
    loading,
    obtenerMisSolicitudes,
    contarPendientes,
  };
};
