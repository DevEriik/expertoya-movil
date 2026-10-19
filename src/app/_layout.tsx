import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import {
  AccessibilityProvider,
  useAccessibility,
} from "@/context/AccessibilityContext";
import { AuthProvider } from "@/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isDarkMode } = useAccessibility();

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password" options={{ headerShown: false }} />
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
