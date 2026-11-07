import * as Notifications from "expo-notifications";
import { apiClient } from "./api";

export async function syncBadgeCount(): Promise<void> {
  try {
    const res = await apiClient("/api/notificaciones?limit=1");
    if (!res.ok) return;

    const data = await res.json();
    const noLeidas = Number(data?.noLeidas) || 0;

    await Notifications.setBadgeCountAsync(noLeidas);
  } catch (error) {
    console.warn("No se pudo actualizar el badge:", error);
  }
}

export async function clearBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.warn("No se pudo limpiar el badge:", error);
  }
}
