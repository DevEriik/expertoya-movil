import Constants from "expo-constants";
import * as Notifications from "@/utils/safeNotifications";
import { Platform } from "react-native";
import { apiClient } from "./api";
import {
  getNotificationPermissionInfo,
  setupNotificationChannels,
} from "./notifications";

const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId as
  | string
  | undefined;

let lastRegisteredToken: string | null = null;
let registrationInFlight: Promise<string | null> | null = null;

function getPlataforma(): string {
  if (Platform.OS === "ios") return "IOS";
  if (Platform.OS === "android") return "ANDROID";
  return "WEB";
}

async function doRegister(force: boolean): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // En Expo Go, las notificaciones remotas no están disponibles por diseño de Expo SDK 52+
  if (Constants.appOwnership === "expo") {
    return null;
  }

  await setupNotificationChannels();

  const permission = await getNotificationPermissionInfo();
  if (permission.state !== "granted") {
    return null;
  }

  let expoToken: string | null = null;
  try {
    const res = await Notifications.getExpoPushTokenAsync(
      PROJECT_ID ? { projectId: PROJECT_ID } : undefined,
    );
    expoToken = res?.data || null;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "Aviso: Push notifications no disponibles en el entorno actual (Expo Go). Usa una build de desarrollo para probar notificaciones remotas.",
        error,
      );
    }
    return null;
  }

  if (!expoToken) {
    return null;
  }

  if (!force && expoToken === lastRegisteredToken) {
    return expoToken;
  }

  const response = await apiClient("/api/notificaciones/token", {
    method: "POST",
    body: JSON.stringify({
      token: expoToken,
      plataforma: getPlataforma(),
    }),
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(
      `No se pudo registrar el token push (${response.status}): ${detalle}`,
    );
  }

  lastRegisteredToken = expoToken;

  if (__DEV__) {
    console.log("Token push registrado:", expoToken);
  }

  return expoToken;
}

export function registerPushToken(
  options: { force?: boolean } = {},
): Promise<string | null> {
  if (!registrationInFlight) {
    registrationInFlight = doRegister(options.force ?? false).finally(() => {
      registrationInFlight = null;
    });
  }
  return registrationInFlight;
}

export function resetPushTokenCache(): void {
  lastRegisteredToken = null;
  registrationInFlight = null;
}

export function describirErrorPush(error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error);

  const estado = mensaje.match(/\((\d{3})\)/)?.[1];

  if (estado === "401" || estado === "403") {
    return "Tu sesión expiró. Volvé a iniciar sesión.";
  }
  if (estado === "400") {
    return "El servidor rechazó el token de este dispositivo.";
  }
  if (estado?.startsWith("5")) {
    return "El servidor no pudo registrar el dispositivo. Intentá más tarde.";
  }
  if (/projectId/i.test(mensaje)) {
    return "Falta el projectId de EAS en la configuración.";
  }
  if (/google-services|FirebaseApp|FCM|firebase/i.test(mensaje)) {
    return "Este build no tiene Firebase configurado.";
  }
  if (/network|fetch|timeout|connect/i.test(mensaje)) {
    return "No hay conexión con el servidor. Revisá tu red.";
  }
  if (/permission|permiso|denied/i.test(mensaje)) {
    return "El permiso de notificaciones no está concedido.";
  }

  return "No se pudo registrar este dispositivo para notificaciones.";
}
