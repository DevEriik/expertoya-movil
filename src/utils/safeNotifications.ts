import { PermissionsAndroid, Platform } from 'react-native';
import notifee, {
  AndroidImportance as NotifeeImportance,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';

export const AndroidImportance = {
  UNKNOWN: 0,
  UNSPECIFIED: -1000,
  NONE: NotifeeImportance.NONE,
  MIN: NotifeeImportance.MIN,
  LOW: NotifeeImportance.LOW,
  DEFAULT: NotifeeImportance.DEFAULT,
  HIGH: NotifeeImportance.HIGH,
  MAX: NotifeeImportance.HIGH,
};

export const IosAuthorizationStatus = {
  NOT_DETERMINED: AuthorizationStatus.NOT_DETERMINED,
  DENIED: AuthorizationStatus.DENIED,
  AUTHORIZED: AuthorizationStatus.AUTHORIZED,
  PROVISIONAL: AuthorizationStatus.PROVISIONAL,
  EPHEMERAL: AuthorizationStatus.AUTHORIZED,
};

export type NotificationPermissionsStatus = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
  ios?: { status: number };
};
export type Subscription = { remove: () => void };
export type NotificationResponse = {
  notification: {
    request: {
      identifier: string;
      content: { data?: Record<string, unknown> };
    };
  };
};
export type Notification = any;
export type NotificationChannel = { id: string; name?: string };

export const setNotificationHandler = (_handler?: any) => {
  // Notifee muestra notificaciones en foreground explícitamente vía displayNotification
};

export const addNotificationResponseReceivedListener = (
  listener: (response: NotificationResponse) => void,
): Subscription => {
  if (Platform.OS === 'web') return { remove: () => {} };
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification) {
      listener({
        notification: {
          request: {
            identifier: detail.notification.id || String(Date.now()),
            content: { data: detail.notification.data || {} },
          },
        },
      });
    }
  });
  return { remove: unsubscribe };
};

export const getLastNotificationResponseAsync = async (): Promise<NotificationResponse | null> => {
  if (Platform.OS === 'web') return null;
  try {
    const initial = await notifee.getInitialNotification();
    if (!initial?.notification) return null;
    return {
      notification: {
        request: {
          identifier: initial.notification.id || String(Date.now()),
          content: { data: initial.notification.data || {} },
        },
      },
    };
  } catch {
    return null;
  }
};

export const clearLastNotificationResponseAsync = async () => {};

export const addNotificationReceivedListener = (
  _listener: (notification: any) => void,
): Subscription => {
  return { remove: () => {} };
};

export const addPushTokenListener = (
  listener: (token: { data: string; type: string }) => void,
): Subscription => {
  if (Platform.OS === 'web') return { remove: () => {} };
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    const unsubscribe = messaging().onTokenRefresh((token: string) => {
      listener({ data: token, type: 'fcm' });
    });
    return { remove: unsubscribe };
  } catch {
    return { remove: () => {} };
  }
};

export const setBadgeCountAsync = async (count: number): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    await notifee.setBadgeCount(count);
    return true;
  } catch {
    return false;
  }
};

export const getBadgeCountAsync = async (): Promise<number> => {
  if (Platform.OS === 'web') return 0;
  try {
    return await notifee.getBadgeCount();
  } catch {
    return 0;
  }
};

export const dismissAllNotificationsAsync = async () => {
  if (Platform.OS === 'web') return;
  await notifee.cancelAllNotifications();
};

export const dismissNotificationAsync = async (id: string) => {
  if (Platform.OS === 'web') return;
  await notifee.cancelNotification(id);
};

export const setNotificationChannelAsync = async (
  id: string,
  channel: {
    name: string;
    importance: number;
    vibrationPattern?: number[];
    lightColor?: string;
    sound?: string | null;
    enableVibrate?: boolean;
    showBadge?: boolean;
  },
) => {
  if (Platform.OS !== 'android') return null;
  return notifee.createChannel({
    id,
    name: channel.name,
    importance: channel.importance as NotifeeImportance,
    vibration: channel.enableVibrate ?? true,
    vibrationPattern: channel.vibrationPattern,
    lights: !!channel.lightColor,
    lightColor: channel.lightColor,
    sound: channel.sound === null ? undefined : channel.sound || 'default',
    badge: channel.showBadge ?? true,
  });
};

export const getNotificationChannelsAsync = async (): Promise<NotificationChannel[]> => {
  if (Platform.OS !== 'android') return [];
  const channels = await notifee.getChannels();
  return channels.map((c) => ({ id: c.id, name: c.name }));
};

export const getPermissionsAsync = async (): Promise<NotificationPermissionsStatus> => {
  if (Platform.OS === 'web') {
    return { status: 'denied', granted: false, canAskAgain: false };
  }
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return {
      status: granted ? 'granted' : 'undetermined',
      granted,
      canAskAgain: true,
    };
  }
  const settings = await notifee.getNotificationSettings();
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
  return {
    status: granted ? 'granted' : 'denied',
    granted,
    canAskAgain: settings.authorizationStatus !== AuthorizationStatus.DENIED,
    ios: { status: settings.authorizationStatus },
  };
};

export const requestPermissionsAsync = async (
  _opts?: any,
): Promise<NotificationPermissionsStatus> => {
  if (Platform.OS === 'web') {
    return { status: 'denied', granted: false, canAskAgain: false };
  }
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    const granted = res === PermissionsAndroid.RESULTS.GRANTED;
    return {
      status: granted ? 'granted' : 'denied',
      granted,
      canAskAgain: res !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    };
  }
  const settings = await notifee.requestPermission();
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
  return {
    status: granted ? 'granted' : 'denied',
    granted,
    canAskAgain: settings.authorizationStatus !== AuthorizationStatus.DENIED,
    ios: { status: settings.authorizationStatus },
  };
};
