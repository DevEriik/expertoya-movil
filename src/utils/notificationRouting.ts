import type { Href } from "expo-router";

export const RUTA_BANDEJA = "/notificaciones" as const;

const PATRONES_VALIDOS = [
  /^\/chat\/[A-Za-z0-9_-]+$/,
  /^\/llamada\/[A-Za-z0-9_-]+$/,
  /^\/pagos\/[A-Za-z0-9_-]+$/,
];

export function resolverRutaNotificacion(data: unknown): Href {
  if (!data || typeof data !== "object") {
    return RUTA_BANDEJA;
  }

  const ruta = (data as { ruta?: unknown }).ruta;

  if (typeof ruta !== "string") {
    return RUTA_BANDEJA;
  }

  const limpia = ruta.trim();

  if (!PATRONES_VALIDOS.some((patron) => patron.test(limpia))) {
    return RUTA_BANDEJA;
  }

  return limpia as Href;
}
