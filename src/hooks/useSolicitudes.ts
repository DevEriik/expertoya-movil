import { useState } from "react";
// 1. Importamos apiClient usando llaves porque es una exportación nombrada
import { apiClient } from "../utils/api";

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
      // 2. Usamos apiClient con la estructura que definiste en tu api.ts
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

  const aceptarSolicitud = async (id: string) => {
    try {
      const response = await apiClient(`/api/solicitudes/${id}/aceptar`, {
        method: "PATCH",
      });
      return response;
    } catch (error) {
      console.error("Error al aceptar solicitud:", error);
      throw error;
    }
  };

  const rechazarSolicitud = async (id: string) => {
    try {
      const response = await apiClient(`/api/solicitudes/${id}/rechazar`, {
        method: "PATCH",
      });
      return response;
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      throw error;
    }
  };

  return {
    crearSolicitud,
    aceptarSolicitud,
    rechazarSolicitud,
    loading,
  };
};
