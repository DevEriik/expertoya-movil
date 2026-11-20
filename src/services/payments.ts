import Config from "react-native-config";
import { apiClient } from "@/utils/api";

export type EstadoPago =
  | "PENDIENTE"
  | "RETENIDO"
  | "LIBERADO"
  | "FALLIDO"
  | "CANCELADO"
  | "REEMBOLSADO"
  | "CONTRACARGO"
  | "EN_DISPUTA"
  | "REVISION_MANUAL";

export type Moneda = "ARS";

export interface PreferenciaPago {
  pago_id: string;
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
  monto_total: string;
  comision_plataforma: string;
  neto_estimado_profesional: string;
  moneda: Moneda;
  expira_en: string;
}

export interface Pago {
  id: string;
  estado: EstadoPago;
  monto_total: string;
  comision_plataforma: string;
  fee_mp: string;
  neto_profesional: string;
  mp_payment_id: string | null;
  mp_status: string | null;
  fecha_pago: string | null;
  fecha_aprobacion: string | null;
  fecha_liberacion: string | null;
}

export interface Confirmaciones {
  cliente: boolean;
  profesional: boolean;
  cliente_en: string | null;
  profesional_en: string | null;
}

export interface Payout {
  id: string;
  estado: string;
  monto: string;
  metodo: string;
  pagado_en: string | null;
}

export interface PaymentDetails {
  ok: boolean;
  solicitud_id: string;
  estado_solicitud: string;
  monto_acordado: string;
  pago: Pago | null;
  confirmaciones: Confirmaciones;
  payout: Payout | null;
  comprobante_disponible: boolean;
  comprobante_url: string | null;
}

export interface CreatePreferenceResponse {
  ok: boolean;
  preferencia: PreferenciaPago;
}

export interface ConfirmCompletionResponse {
  ok: boolean;
  confirmado_cliente: boolean;
  confirmado_profesional: boolean;
  puede_liberar: boolean;
  liberado: boolean;
  estado_pago: EstadoPago;
}

export interface ComprobanteResponse {
  ok: boolean;
  comprobante_url: string;
  pago_id: string;
  estado_pago: EstadoPago;
}

export interface PagoRetenidoEvent {
  solicitudId: string;
  pagoId: string;
  estado: "RETENIDO";
  montoTotal: string;
  moneda: Moneda;
  comprobanteUrl: string | null;
}

export class PaymentsApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PaymentsApiError";
    this.status = status;
  }
}

async function leerError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error || data?.message || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await apiClient(endpoint, options);

  if (!response.ok) {
    throw new PaymentsApiError(await leerError(response), response.status);
  }

  return (await response.json()) as T;
}

export const paymentsApi = {
  createPreference(solicitudId: string): Promise<CreatePreferenceResponse> {
    return request<CreatePreferenceResponse>("/api/payments/preferences", {
      method: "POST",
      body: JSON.stringify({ solicitud_id: solicitudId }),
    });
  },

  getDetails(solicitudId: string): Promise<PaymentDetails> {
    return request<PaymentDetails>(`/api/payments/solicitud/${solicitudId}`);
  },

  confirmCompletion(
    solicitudId: string,
  ): Promise<ConfirmCompletionResponse> {
    return request<ConfirmCompletionResponse>(
      `/api/payments/solicitud/${solicitudId}/confirm`,
      { method: "POST" },
    );
  },

  getComprobante(solicitudId: string): Promise<ComprobanteResponse> {
    return request<ComprobanteResponse>(
      `/api/payments/${solicitudId}/comprobante`,
    );
  },
};

export function getCheckoutUrl(preferencia: PreferenciaPago): string {
  if (preferencia.moneda !== "ARS") {
    throw new Error("Solo se aceptan pagos en ARS.");
  }

  const usarProduccion = Config.MP_ENV === "production";

  return usarProduccion
    ? preferencia.init_point
    : preferencia.sandbox_init_point || preferencia.init_point;
}
