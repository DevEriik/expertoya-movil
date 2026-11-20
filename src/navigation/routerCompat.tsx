import React, { useEffect } from 'react';
import {
  Pressable,
  type PressableProps,
} from 'react-native';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
  useNavigationState,
  useRoute,
} from '@react-navigation/native';

export { useFocusEffect };

export type Href =
  | string
  | {
      pathname: string;
      params?: Record<string, any>;
    };

export function resolveRouteTarget(href: Href): { name: string; params?: Record<string, any> } {
  let rawPath = typeof href === 'string' ? href : href.pathname;
  const extraParams = typeof href === 'string' ? {} : href.params || {};

  // Separar query string si viene en string (ej: /login?foo=bar)
  const [pathOnly, queryString] = rawPath.split('?');
  const queryParams: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }

  const clean = pathOnly.replace(/^\/+|\/+$/g, '');
  const mergedParams = { ...queryParams, ...extraParams };

  if (!clean || clean === '(tabs)' || clean === '(tabs)/index') {
    return { name: '(tabs)', params: mergedParams };
  }

  // Rutas dinámicas conocidas
  const chatMatch = clean.match(/^chat\/([^/]+)$/);
  if (chatMatch && chatMatch[1] !== '[solicitudId]') {
    return {
      name: 'chat/[solicitudId]',
      params: { solicitudId: chatMatch[1], ...mergedParams },
    };
  }

  const llamadaMatch = clean.match(/^llamada\/([^/]+)$/);
  if (llamadaMatch && llamadaMatch[1] !== '[solicitudId]') {
    return {
      name: 'llamada/[solicitudId]',
      params: { solicitudId: llamadaMatch[1], ...mergedParams },
    };
  }

  const callMatch = clean.match(/^call\/([^/]+)$/);
  if (callMatch && callMatch[1] !== '[id]') {
    return {
      name: 'call/[id]',
      params: { id: callMatch[1], ...mergedParams },
    };
  }

  const pagosMatch = clean.match(/^pagos\/([^/]+)$/);
  if (pagosMatch && pagosMatch[1] !== '[solicitudId]') {
    return {
      name: 'pagos/[solicitudId]',
      params: { solicitudId: pagosMatch[1], ...mergedParams },
    };
  }

  const pagoMatch = clean.match(/^pago\/([^/]+)$/);
  if (pagoMatch && pagoMatch[1] !== '[status]') {
    return {
      name: 'pago/[status]',
      params: { status: pagoMatch[1], ...mergedParams },
    };
  }

  // Tabs directos
  if (clean === '(tabs)/search' || clean === 'search') {
    return { name: '(tabs)', params: { screen: 'search', params: mergedParams } };
  }
  if (clean === '(tabs)/chat' || clean === 'chat') {
    return { name: '(tabs)', params: { screen: 'chat', params: mergedParams } };
  }
  if (clean === '(tabs)/profile' || clean === 'profile') {
    return { name: '(tabs)', params: { screen: 'profile', params: mergedParams } };
  }

  return { name: clean, params: mergedParams };
}

export function useRouter() {
  const navigation = useNavigation<any>();

  return {
    push: (href: Href) => {
      const { name, params } = resolveRouteTarget(href);
      navigation.navigate(name, params);
    },
    navigate: (href: Href) => {
      const { name, params } = resolveRouteTarget(href);
      navigation.navigate(name, params);
    },
    replace: (href: Href) => {
      const { name, params } = resolveRouteTarget(href);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name, params }],
        }),
      );
    },
    back: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    canGoBack: () => navigation.canGoBack(),
    dismiss: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    canDismiss: () => navigation.canGoBack(),
    setParams: (params: Record<string, any>) => {
      navigation.setParams(params);
    },
  };
}

export function useLocalSearchParams<
  T extends Record<string, string | string[] | undefined> = Record<string, any>,
>(): T {
  const route = useRoute<any>();
  return (route?.params || {}) as T;
}

export function useSegments(): string[] {
  const state = useNavigationState((s) => s);
  if (!state || !state.routes || state.routes.length === 0) {
    return [];
  }
  const current = state.routes[state.index ?? 0];
  return current?.name ? [current.name] : [];
}

export function Redirect({ href }: { href: Href }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href]);
  return null;
}

type LinkProps = Omit<PressableProps, 'onPress'> & {
  href: Href;
  asChild?: boolean;
  target?: string;
  onPress?: (event?: any) => void | Promise<void>;
  children?: React.ReactNode;
};

export function Link({ href, children, asChild, onPress, ...rest }: LinkProps) {
  const router = useRouter();
  const handlePress = async (e?: any) => {
    if (onPress) {
      await onPress(e);
    }
    if (!e?.defaultPrevented) {
      router.push(href);
    }
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onPress: handlePress,
    });
  }
  return (
    <Pressable onPress={handlePress} {...rest}>
      {children}
    </Pressable>
  );
}
