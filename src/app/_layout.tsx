import { getToken, saveToken } from "@/utils/secureStore";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/context/AccessibilityContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { syncBadgeCount } from "@/utils/badge";
import { getSonidoActivo } from "@/utils/notificationPreferences";
import { resolverRutaNotificacion } from "@/utils/notificationRouting";
import { setupNotificationChannels } from "@/utils/notifications";
import type { Href } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import { AppState } from "react-native";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const sonidoActivo = await getSonidoActivo();

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: sonidoActivo,
      shouldSetBadge: true,
    };
  },
  handleError: (notificationId, error) => {
    console.warn(
      `No se pudo mostrar la notificación ${notificationId}:`,
      error,
    );
  },
});

function AuthGate() {
  const { usuario, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const primero = segments[0] as string | undefined;
    const pantallasPublicas = [
      "login",
      "register",
      "forgot-password",
      "reset-password",
    ];
    const enPantallaPublica = !!primero && pantallasPublicas.includes(primero);

    if (!usuario && !enPantallaPublica) {
      router.replace("/login");
    } else if (usuario && primero === "login") {
      router.replace("/(tabs)");
    }
  }, [usuario, isLoading, segments]);

  return null;
}

function NotificationDeepLinkHandler() {
  const router = useRouter();
  const { usuario, isLoading } = useAuth();

  const [pendiente, setPendiente] = useState<Href | null>(null);
  const procesadasRef = useRef<Set<string>>(new Set());

  const encolar = useCallback(
    (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;

      if (procesadasRef.current.has(id)) return;
      procesadasRef.current.add(id);

      const destino = resolverRutaNotificacion(
        response.notification.request.content.data,
      );

      if (__DEV__) {
        console.log(
          "Notificación tocada:",
          id,
          JSON.stringify(response.notification.request.content.data),
        );
        console.log("Deep link destino:", destino);
      }

      setPendiente(destino);

      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    },
    [],
  );

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(encolar);

    return () => subscription.remove();
  }, [encolar]);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) encolar(response);
      })
      .catch((error) => {
        console.warn(
          "No se pudo leer la notificación que abrió la app:",
          error,
        );
      });
  }, [encolar]);

  useEffect(() => {
    if (isLoading || !usuario) return;

    syncBadgeCount().catch(() => {});
  }, [isLoading, usuario]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      setTimeout(() => {
        syncBadgeCount().catch(() => {});
      }, 1000);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && usuario) {
        syncBadgeCount().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [usuario]);

  useEffect(() => {
    if (isLoading || !usuario || !pendiente) return;

    const destino = pendiente;
    setPendiente(null);

    setTimeout(() => {
      router.push(destino);
    }, 300);
  }, [isLoading, usuario, pendiente, router]);

  return null;
}

function RootNavigation() {
  const { isDarkMode } = useAccessibility();

  useEffect(() => {
    const pedirPermisoUbicacionInicial = async () => {
      try {
        const yaSolicitado = await getToken("location_permission_requested");
        if (!yaSolicitado) {
          await Location.requestForegroundPermissionsAsync();
          await saveToken("location_permission_requested", "true");
        }
      } catch (err) {
        console.warn(
          "No se pudo solicitar permiso de ubicación en inicio:",
          err,
        );
      }
    };
    pedirPermisoUbicacionInicial();
  }, []);

  useEffect(() => {
    setupNotificationChannels().catch((error) => {
      console.warn(
        "No se pudieron configurar los canales de notificación:",
        error,
      );
    });
  }, []);

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthProvider>
        <AuthGate />
        <NotificationDeepLinkHandler />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="forgot-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="reset-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="create-service"
            options={{
              presentation: "transparentModal",
              title: "Crear Servicio",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="account-details"
            options={{
              title: "Account Details",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{
              title: "Editar Perfil",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              title: "Registro Profesional",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="accessibility"
            options={{
              title: "Centro de Accesibilidad",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="call/[id]"
            options={{
              title: "Videollamada de Diagnóstico",
              headerShown: false,
              animation: "fade",
              gestureEnabled: false,
            }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AccessibilityProvider>
      <RootNavigation />
    </AccessibilityProvider>
  );
}
