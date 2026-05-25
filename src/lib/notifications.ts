import { invoke } from "@tauri-apps/api/core";

export async function sendCriticalNotification(title: string, body: string) {
  try {
    // Dispara a notificação via backend diretamente (já verifica permissão no Rust)
    await invoke("global_send_critical_notification", { title, body });
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
    // Solicita permissão via backend para evitar o registerListener do plugin JS
    await invoke("plugin:notification|request_permission");
  } catch (error) {
    console.error(
      "[Aegis Notifications] Initial permission request failed:",
      error,
    );
  }
}
