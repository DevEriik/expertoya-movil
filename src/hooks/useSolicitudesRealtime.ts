import { API_URL } from "@/utils/api";
import { getToken } from "@/utils/secureStore";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Handlers {
  onContador?: (pendientes: number) => void;
  onCambio?: () => void;
  onCambioCliente?: () => void;
}

export const useSolicitudesRealtime = ({
  onContador,
  onCambio,
  onCambioCliente,
}: Handlers) => {
  const handlers = useRef({ onContador, onCambio, onCambioCliente });
  handlers.current = { onContador, onCambio, onCambioCliente };

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelado = false;

    (async () => {
      const token = await getToken("auth_token");
      if (!token || cancelado) return;

      socket = io(API_URL, {
        auth: { token, canal: "solicitudes" },
        transports: ["websocket"],
      });

      socket.on("solicitudes:contador", (data: { pendientes: number }) => {
        handlers.current.onContador?.(data.pendientes);
      });
      socket.on("solicitudes:cambio", () => {
        handlers.current.onCambio?.();
      });
      socket.on("solicitudes:mias-cambio", () => {
        handlers.current.onCambioCliente?.();
      });
    })();

    return () => {
      cancelado = true;
      socket?.disconnect();
    };
  }, []);
};
