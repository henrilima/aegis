import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

export async function sendCriticalNotification(title: string, body: string) {
  try {
    let permission = await isPermissionGranted();
    // Solicita permissão se ainda não foi concedida
    if (!permission) {
      const result = await requestPermission();
      permission = result === "granted";
    }

    // Dispara a notificação via backend se tiver permissão
    if (permission) {
      await invoke("send_critical_notification", { title, body });
    } else {
      console.warn(
        "[Aegis Notifications] Permission denied. Could not send critical alert.",
      );
    }
  } catch (error) {
    console.error(
      "[Aegis Notifications] Failed to send critical notification:",
      error,
    );
    throw error;
  }
}

export async function initNotifications() {
  try {
    const permission = await isPermissionGranted();
    if (!permission) {
      await requestPermission();
    }
  } catch (error) {
    console.error(
      "[Aegis Notifications] Initial permission request failed:",
      error,
    );
  }
}
