import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createNavigationContainerRef,
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { resolveRouteTarget, type Href } from '@/navigation/routerCompat';
import TabNavigator from '@/navigation/TabNavigator';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAccessibility } from '@/context/AccessibilityContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { requestLocationPermission } from '@/hooks/useLocation';
import { syncBadgeCount } from '@/utils/badge';
import { getSonidoActivo } from '@/utils/notificationPreferences';
import { resolverRutaNotificacion } from '@/utils/notificationRouting';
import { setupNotificationChannels } from '@/utils/notifications';
import * as Notifications from '@/utils/safeNotifications';
import { getToken, saveToken } from '@/utils/secureStore';

import LoginScreen from '@/app/login';
import RegisterScreen from '@/app/register';
import ForgotPasswordScreen from '@/app/forgot-password';
import ResetPasswordScreen from '@/app/reset-password';
import OnboardingRoute from '@/app/onboarding';
import CreateServiceModal from '@/app/create-service';
import AccountDetailsScreen from '@/app/account-details';
import EditProfileScreen from '@/app/edit-profile';
import AccessibilityScreen from '@/app/accessibility';
import SecurityScreen from '@/app/security';
import NotificationsScreen from '@/app/notifications';
import NotificacionesScreen from '@/app/notificaciones';
import PaymentsScreen from '@/app/payments';
import SolicitudesProfesionalScreen from '@/app/solicitudes';
import MisSolicitudesScreen from '@/app/mis-solicitudes';
import SolicitudesTrabajoScreen from '@/app/solicitudes-trabajo';
import ChatDeepLinkScreen from '@/app/chat/[solicitudId]';
import LlamadaDeepLinkScreen from '@/app/llamada/[solicitudId]';
import CallScreen from '@/app/call/[id]';
import PagoSolicitudScreen from '@/app/pagos/[solicitudId]';
import PagoRetornoScreen from '@/app/pago/[status]';

const Stack = createNativeStackNavigator();

try {
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
    handleError: (notificationId: string, error: any) => {
      console.warn(`No se pudo mostrar la notificación ${notificationId}:`, error);
    },
  });
} catch (err) {
  console.warn('Notifications handler no disponible en este entorno:', err);
}

const linking: LinkingOptions<any> = {
  prefixes: ['expertoyamovil://'],
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          search: 'search',
          chat: 'chat',
          profile: 'profile',
        },
      },
      login: 'login',
      register: 'register',
      'forgot-password': 'forgot-password',
      'reset-password': 'reset-password',
      onboarding: 'onboarding',
      'create-service': 'create-service',
      'account-details': 'account-details',
      'edit-profile': 'edit-profile',
      accessibility: 'accessibility',
      security: 'security',
      notifications: 'notifications',
      notificaciones: 'notificaciones',
      payments: 'payments',
      solicitudes: 'solicitudes',
      'mis-solicitudes': 'mis-solicitudes',
      'solicitudes-trabajo': 'solicitudes-trabajo',
      'chat/[solicitudId]': 'chat/:solicitudId',
      'llamada/[solicitudId]': 'llamada/:solicitudId',
      'call/[id]': 'call/:id',
      'pagos/[solicitudId]': 'pagos/:solicitudId',
      'pago/[status]': 'pago/:status',
    },
  },
};

export const navigationRef = createNavigationContainerRef<any>();

function AuthGate({ currentRouteName }: { currentRouteName?: string }) {
  const { usuario, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !navigationRef.isReady()) return;

    const primero = currentRouteName;
    const pantallasPublicas = [
      'login',
      'register',
      'forgot-password',
      'reset-password',
    ];
    const enPantallaPublica = !!primero && pantallasPublicas.includes(primero);

    if (!usuario && !enPantallaPublica) {
      navigationRef.reset({ index: 0, routes: [{ name: 'login' }] });
    } else if (usuario && primero === 'login') {
      navigationRef.reset({ index: 0, routes: [{ name: '(tabs)' }] });
    }
  }, [usuario, isLoading, currentRouteName]);

  return null;
}

function NotificationDeepLinkHandler() {
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

      setPendiente(destino);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    },
    [],
  );

  useEffect(() => {
    try {
      const subscription =
        Notifications.addNotificationResponseReceivedListener(encolar);
      return () => subscription.remove();
    } catch {
      return () => {};
    }
  }, [encolar]);

  useEffect(() => {
    try {
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) encolar(response);
        })
        .catch(() => {});
    } catch {}
  }, [encolar]);

  useEffect(() => {
    if (isLoading || !usuario) return;
    syncBadgeCount().catch(() => {});
  }, [isLoading, usuario]);

  useEffect(() => {
    try {
      const subscription = Notifications.addNotificationReceivedListener(() => {
        setTimeout(() => {
          syncBadgeCount().catch(() => {});
        }, 1000);
      });
      return () => subscription.remove();
    } catch {
      return () => {};
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && usuario) {
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
      if (navigationRef.isReady()) {
        const { name, params } = resolveRouteTarget(destino);
        navigationRef.navigate(name, params);
      }
    }, 300);
  }, [isLoading, usuario, pendiente]);

  return null;
}

export default function RootNavigator() {
  const { isDarkMode } = useAccessibility();
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const pedirPermisoUbicacionInicial = async () => {
      try {
        const yaSolicitado = await getToken('location_permission_requested');
        if (!yaSolicitado) {
          await requestLocationPermission();
          await saveToken('location_permission_requested', 'true');
        }
      } catch (err) {
        console.warn('No se pudo solicitar permiso de ubicación en inicio:', err);
      }
    };
    pedirPermisoUbicacionInicial();
  }, []);

  useEffect(() => {
    setupNotificationChannels().catch((error) => {
      console.warn('No se pudieron configurar los canales de notificación:', error);
    });
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={isDarkMode ? DarkTheme : DefaultTheme}
      linking={linking}
      onReady={() => setCurrentRouteName(navigationRef.getCurrentRoute()?.name)}
      onStateChange={() =>
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name)
      }
    >
      <AnimatedSplashOverlay />
      <AuthProvider>
        <AuthGate currentRouteName={currentRouteName} />
        <NotificationDeepLinkHandler />
        <Stack.Navigator
          initialRouteName="login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="login" component={LoginScreen} />
          <Stack.Screen name="register" component={RegisterScreen} />
          <Stack.Screen name="forgot-password" component={ForgotPasswordScreen} />
          <Stack.Screen name="reset-password" component={ResetPasswordScreen} />
          <Stack.Screen name="(tabs)" component={TabNavigator} />

          <Stack.Screen
            name="create-service"
            component={CreateServiceModal}
            options={{ presentation: 'transparentModal', title: 'Crear Servicio' }}
          />
          <Stack.Screen name="account-details" component={AccountDetailsScreen} />
          <Stack.Screen name="edit-profile" component={EditProfileScreen} />
          <Stack.Screen name="onboarding" component={OnboardingRoute} />
          <Stack.Screen
            name="accessibility"
            component={AccessibilityScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="security" component={SecurityScreen} />
          <Stack.Screen name="notifications" component={NotificationsScreen} />
          <Stack.Screen name="notificaciones" component={NotificacionesScreen} />
          <Stack.Screen name="payments" component={PaymentsScreen} />
          <Stack.Screen name="solicitudes" component={SolicitudesProfesionalScreen} />
          <Stack.Screen name="mis-solicitudes" component={MisSolicitudesScreen} />
          <Stack.Screen name="solicitudes-trabajo" component={SolicitudesTrabajoScreen} />
          <Stack.Screen name="chat/[solicitudId]" component={ChatDeepLinkScreen} />
          <Stack.Screen name="llamada/[solicitudId]" component={LlamadaDeepLinkScreen} />
          <Stack.Screen
            name="call/[id]"
            component={CallScreen}
            options={{ animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen name="pagos/[solicitudId]" component={PagoSolicitudScreen} />
          <Stack.Screen name="pago/[status]" component={PagoRetornoScreen} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
}
