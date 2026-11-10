import type { Solicitud } from "@/hooks/useSolicitudes";
import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

//  - Naranja marca #FF8C00 · Teal #00BFA5 · Índigo (texto) #283593 · Crema #FDFCF4
//  - Dark: fondo #121826, superficies #1F2937, naranja suave #FFB74D, teal #33EFA5
//  - Semánticos: Success #10B981/#34D399 · Warning #F59E0B/#FBBF24 · Danger #EF4444/#F87171
export const paleta = (isDark: boolean) => ({
  fondo: isDark ? "#121826" : "#FDFCF4",
  superficie: isDark ? "#1F2937" : "#FFFFFF",
  borde: isDark ? "#2A3649" : "#E2E8F0",
  titulo: isDark ? "#FDFCF4" : "#283593",
  texto: isDark ? "#E2E8F0" : "#283593",
  suave: isDark ? "#94A3B8" : "#475569",
  naranja: isDark ? "#FFB74D" : "#FF8C00",
  teal: isDark ? "#33EFA5" : "#00BFA5",
  exito: isDark ? "#34D399" : "#10B981",
  aviso: isDark ? "#FBBF24" : "#F59E0B",
  peligro: isDark ? "#F87171" : "#EF4444",
  sobreColor: isDark ? "#121826" : "#FFFFFF",
  fondoInput: isDark ? "#121826" : "#F8FAFC", // Un gris muy sutil para destacar sobre el blanco
});

export const formatearFecha = (iso: string) => {
  const texto = new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const formatearFechaEnvio = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatearFranja = (franja: string) =>
  `${franja.replace("-", " a ")} hs`;

export const horasRestantes = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 3600000);

export const estaPendiente = (s: Solicitud) =>
  s.estado === "PENDIENTE" && horasRestantes(s.expira_at) > 0;

export const iniciales = (nombre: string, apellido: string) =>
  `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();
