import { getToken, saveToken } from "@/utils/secureStore";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/context/AccessibilityContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

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

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthProvider>
        <AuthGate />
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
