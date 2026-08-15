"use client";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect } from "react";

/**
 * Hook para aplicar o zoom global da interface com base na configuração do usuário.
 * Usa o zoom nativo do Webview do Tauri para melhor estabilidade de layout.
 */
export function useZoom() {
  useEffect(() => {
    const applyZoom = async () => {
      try {
        if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) {
          return;
        }

        const userId =
          typeof window !== "undefined"
            ? localStorage.getItem("aegis_session_user_id") || undefined
            : undefined;

        const config = await invoke<{ appZoom: number }>(
          "global_get_app_config",
          { userId },
        );
        const zoom = config.appZoom || 100;
        const factor = zoom / 100;

        // Garante que a propriedade CSS zoom seja desfeita para evitar distorções de layout
        if (typeof document !== "undefined") {
          (document.documentElement.style as unknown as { zoom: string }).zoom =
            "";
        }

        // Aplica o zoom nativo do Webview do Tauri
        const webview = getCurrentWebview();
        if (webview && typeof webview.setZoom === "function") {
          await webview.setZoom(factor);
        }
      } catch (e) {
        console.error("Failed to apply native zoom:", e);
      }
    };

    applyZoom();

    // Re-aplica quando a configuração muda
    window.addEventListener("aegis-config-changed", applyZoom);
    return () => window.removeEventListener("aegis-config-changed", applyZoom);
  }, []);
}
