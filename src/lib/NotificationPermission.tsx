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
        // Verifica e solicita permissão diretamente via backend Rust,
        // evitando o registerListener interno do plugin JS
        await invoke("plugin:notification|request_permission");
      } catch (e) {
        console.error("Erro ao solicitar permissão de notificação:", e);
      }
    };
    checkPermission();
  }, []);

  return null;
}
