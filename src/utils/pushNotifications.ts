import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiClient } from './api';
import {
  getNotificationPermissionInfo,
  setupNotificationChannels,
} from './notifications';

let lastRegisteredToken: string | null = null;
let registrationInFlight: Promise<string | null> | null = null;

function getPlataforma(): string {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return 'WEB';
}

async function doRegister(force: boolean): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  await setupNotificationChannels();

  const permission = await getNotificationPermissionInfo();
  if (permission.state !== 'granted') {
    return null;
  }

  let fcmToken: string | null = null;
  try {
    fcmToken = await getToken(getMessaging());
  } catch (error) {
    if (__DEV__) {
      console.warn(
        'Aviso: No se pudo obtener el token FCM (verifica google-services.json en android/app/):',
        error,
      );
    }
    return null;
  }

  if (!fcmToken) {
    return null;
  }

  if (!force && fcmToken === lastRegisteredToken) {
    return fcmToken;
  }

  const response = await apiClient('/api/notificaciones/token', {
    method: 'POST',
    body: JSON.stringify({
      token: fcmToken,
      plataforma: getPlataforma(),
    }),
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => '');
    throw new Error(
      `No se pudo registrar el token push (${response.status}): ${detalle}`,
    );
  }

  lastRegisteredToken = fcmToken;

  if (__DEV__) {
    console.log('Token FCM registrado:', fcmToken);
  }

  return fcmToken;
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

  if (estado === '401' || estado === '403') {
    return 'Tu sesión expiró. Volvé a iniciar sesión.';
  }
  if (estado === '400') {
    return 'El servidor rechazó el token FCM de este dispositivo.';
  }
  if (estado?.startsWith('5')) {
    return 'El servidor no pudo registrar el dispositivo. Intentá más tarde.';
  }
  if (/google-services|FirebaseApp|FCM|firebase/i.test(mensaje)) {
    return 'Este build no tiene Firebase configurado (falta google-services.json).';
  }
  if (/network|fetch|timeout|connect/i.test(mensaje)) {
    return 'No hay conexión con el servidor. Revisá tu red.';
  }
  if (/permission|permiso|denied/i.test(mensaje)) {
    return 'El permiso de notificaciones no está concedido.';
  }

  return 'No se pudo registrar este dispositivo para notificaciones.';
}
