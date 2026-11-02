import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

export const NOTIFICATION_CHANNELS = {
  default: "default",
  critical: "critical",
  silent: "silent",
} as const;

let channelsReady: Promise<void> | null = null;

export function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return Promise.resolve();
  }

  if (!channelsReady) {
    channelsReady = (async () => {
      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CHANNELS.default,
        {
          name: "Notificaciones",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#208AEF",
          showBadge: true,
        },
      );

      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CHANNELS.critical,
        {
          name: "Notificaciones críticas",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: "#208AEF",
          showBadge: true,
        },
      );

      await Notifications.setNotificationChannelAsync(
        NOTIFICATION_CHANNELS.silent,
        {
          name: "Notificaciones silenciosas",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: null,
          enableVibrate: false,
          showBadge: true,
        },
      );

      if (__DEV__) {
        const channels = await Notifications.getNotificationChannelsAsync();
        console.log(
          "Canales de notificación:",
          channels?.map((channel) => channel.id),
        );
      }
    })().catch((error) => {
      channelsReady = null;
      throw error;
    });
  }

  return channelsReady;
}

export type NotificationPermissionState = "granted" | "denied" | "undetermined";

export interface NotificationPermissionInfo {
  state: NotificationPermissionState;
  canAskAgain: boolean;
}

function mapPermission(
  status: Notifications.NotificationPermissionsStatus,
): NotificationPermissionInfo {
  if (status.granted) {
    return { state: "granted", canAskAgain: status.canAskAgain };
  }

  if (Platform.OS === "ios") {
    const iosStatus = status.ios?.status;
    if (
      iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
    ) {
      return { state: "granted", canAskAgain: status.canAskAgain };
    }
    if (iosStatus === Notifications.IosAuthorizationStatus.DENIED) {
      return { state: "denied", canAskAgain: status.canAskAgain };
    }
    return { state: "undetermined", canAskAgain: status.canAskAgain };
  }

  if (status.status === "denied") {
    return { state: "denied", canAskAgain: status.canAskAgain };
  }

  if (status.status === "undetermined") {
    return { state: "undetermined", canAskAgain: status.canAskAgain };
  }

  return { state: "granted", canAskAgain: status.canAskAgain };
}

export async function getNotificationPermissionInfo(): Promise<NotificationPermissionInfo> {
  const status = await Notifications.getPermissionsAsync();
  return mapPermission(status);
}

export async function requestNotificationPermissions(): Promise<NotificationPermissionInfo> {
  await setupNotificationChannels();

  const current = await getNotificationPermissionInfo();
  if (current.state === "granted" || !current.canAskAgain) {
    return current;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return mapPermission(requested);
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
