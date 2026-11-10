import { Platform } from 'react-native';

let ExpoNotifications: any = {};
try {
  ExpoNotifications = require('expo-notifications');
} catch (error) {
  console.warn('[safeNotifications] expo-notifications no está disponible nativamente en este cliente (Expo Go):', error);
}

export const setNotificationHandler =
  ExpoNotifications.setNotificationHandler ||
  (() => {});

export const addNotificationResponseReceivedListener =
  ExpoNotifications.addNotificationResponseReceivedListener ||
  (() => ({ remove: () => {} }));

export const getLastNotificationResponseAsync =
  ExpoNotifications.getLastNotificationResponseAsync ||
  (async () => null);

export const clearLastNotificationResponseAsync =
  ExpoNotifications.clearLastNotificationResponseAsync ||
  (async () => {});

export const addNotificationReceivedListener =
  ExpoNotifications.addNotificationReceivedListener ||
  (() => ({ remove: () => {} }));

export const addPushTokenListener =
  ExpoNotifications.addPushTokenListener ||
  (() => ({ remove: () => {} }));

export const getExpoPushTokenAsync =
  ExpoNotifications.getExpoPushTokenAsync ||
  (async () => null);

export const setBadgeCountAsync =
  ExpoNotifications.setBadgeCountAsync ||
  (async () => false);

export const getBadgeCountAsync =
  ExpoNotifications.getBadgeCountAsync ||
  (async () => 0);

export const dismissAllNotificationsAsync =
  ExpoNotifications.dismissAllNotificationsAsync ||
  (async () => {});

export const dismissNotificationAsync =
  ExpoNotifications.dismissNotificationAsync ||
  (async () => {});

export const setNotificationChannelAsync =
  ExpoNotifications.setNotificationChannelAsync ||
  (async () => null);

export const getNotificationChannelsAsync =
  ExpoNotifications.getNotificationChannelsAsync ||
  (async () => []);

export const getPermissionsAsync =
  ExpoNotifications.getPermissionsAsync ||
  (async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  }));

export const requestPermissionsAsync =
  ExpoNotifications.requestPermissionsAsync ||
  (async () => ({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
  }));

export const AndroidImportance = ExpoNotifications.AndroidImportance || {
  UNKNOWN: 0,
  UNSPECIFIED: -1000,
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export const IosAuthorizationStatus = ExpoNotifications.IosAuthorizationStatus || {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
};

export type NotificationPermissionsStatus = any;
export type Subscription = { remove: () => void };
export type NotificationResponse = any;
export type Notification = any;
export type NotificationChannel = any;

export default ExpoNotifications;
