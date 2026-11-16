import { apiClient } from "./api";

export type EstadoDisputa =
  | "ABIERTA"
  | "RESUELTA_CLIENTE"
  | "RESUELTA_REEMBOLSO_PARCIAL"
  | "RESUELTA_PROFESIONAL";

export interface DisputaData {
  id: string;
  solicitud_id: string;
  cliente_id?: string | null;
  profesional_id?: string | null;
  pago_id?: string | null;
  motivo: string;
  descripcion?: string | null;
  evidencia_urls?: string[] | null;
  estado: EstadoDisputa;
  monto_retenido?: string | number | null;
  monto_reembolsado?: string | number | null;
  resolucion_admin?: string | null;
  resuelto_por?: string | null;
  abierta_en: string;
  resuelta_en?: string | null;
}

export const abrirDisputaApi = async (payload: {
  solicitud_id: string;
  motivo: string;
  descripcion?: string;
  evidencia_urls?: string[];
}): Promise<{ ok: boolean; mensaje: string; disputa: DisputaData }> => {
  const response = await apiClient("/api/disputas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "No se pudo iniciar el reclamo.");
  }
  return data;
};

export const obtenerDisputaSolicitudApi = async (
  solicitudId: string,
): Promise<DisputaData | null> => {
  const response = await apiClient(`/api/disputas/solicitud/${solicitudId}`, {
    method: "GET",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Error al consultar el estado del reclamo.");
  }
  return data?.disputa || null;
};
