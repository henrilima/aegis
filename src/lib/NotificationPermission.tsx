"use client";

import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

/**
 * NotificationPermission
 * Solicita permissão de notificação do sistema via comando Rust,
 * sem chamar o plugin JS (que dispara registerListener internamente).
 */
export function NotificationPermission() {
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          if (getCurrentWindow().label !== "main") return;
        }
        await invoke("plugin:notification|request_permission");
      } catch (e) {
        console.error("Erro ao solicitar permissão de notificação:", e);
      }
    };
    checkPermission();
  }, []);

  return null;
}
