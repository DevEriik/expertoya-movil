import {
  paymentsApi,
  type EstadoPago,
  type PagoRetenidoEvent,
  type PaymentDetails,
} from "@/services/payments";
import { API_URL } from "@/utils/api";
import { getToken } from "@/utils/secureStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";

const ESTADOS_FINALES: EstadoPago[] = [
  "RETENIDO",
  "LIBERADO",
  "FALLIDO",
  "CANCELADO",
  "REEMBOLSADO",
  "CONTRACARGO",
  "EN_DISPUTA",
  "REVISION_MANUAL",
];

const INTERVALO_POLLING_MS = 3000;
const MAX_POLLING_MS = 30000;

const esEstadoFinal = (estado?: EstadoPago | null) =>
  Boolean(estado && ESTADOS_FINALES.includes(estado));

export function usePaymentDetails(solicitudId?: string) {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    setPolling(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const cargar = useCallback(
    async (silent = false) => {
      if (!solicitudId) {
        setLoading(false);
        return null;
      }

      if (!silent) setLoading(true);

      try {
        const data = await paymentsApi.getDetails(solicitudId);
        if (!mountedRef.current) return data;
        setDetails(data);
        setError(null);
        return data;
      } catch (e) {
        if (mountedRef.current) {
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo obtener el estado del pago.",
          );
        }
        return null;
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    [solicitudId],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await cargar(true);
    if (mountedRef.current) setRefreshing(false);
  }, [cargar]);

  const startPolling = useCallback(() => {
    if (!solicitudId) return;

    stopPolling();
    setPollingTimedOut(false);
    setPolling(true);

    const inicio = Date.now();

    const tick = async () => {
      const data = await cargar(true);
      if (data?.pago?.estado && esEstadoFinal(data.pago.estado)) {
        stopPolling();
        return;
      }

      if (Date.now() - inicio >= MAX_POLLING_MS) {
        stopPolling();
        if (mountedRef.current) setPollingTimedOut(true);
      }
    };

    void tick();
    intervalRef.current = setInterval(() => {
      void tick();
    }, INTERVALO_POLLING_MS);
  }, [cargar, solicitudId, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;
    void cargar();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [cargar, stopPolling]);

  useEffect(() => {
    if (!solicitudId) return;

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void cargar(true);
    });

    return () => subscription.remove();
  }, [solicitudId, cargar]);

  useEffect(() => {
    if (!solicitudId) return;

    let socket: Socket | null = null;
    let cancelado = false;

    (async () => {
      const token = await getToken("auth_token");
      if (!token || cancelado) return;

      socket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("pago:retenido", (payload: PagoRetenidoEvent) => {
        if (payload?.solicitudId === solicitudId) {
          stopPolling();
          void cargar(true);
        }
      });

      socket.on("connect", () => {
        void cargar(true);
      });
    })();

    return () => {
      cancelado = true;
      socket?.disconnect();
    };
  }, [solicitudId, cargar, stopPolling]);

  return {
    details,
    loading,
    refreshing,
    error,
    polling,
    pollingTimedOut,
    refresh,
    startPolling,
    stopPolling,
  };
}
