"use client";

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect } from "react";

/**
 * Hook to apply global interface zoom based on user configuration
 * Uses Tauri's native Webview Zoom for better layout stability
 */
export function useZoom() {
  useEffect(() => {
    const applyZoom = async () => {
      try {
        const config = await invoke<{ appZoom: number }>("get_app_config");
        const zoom = config.appZoom || 100;

        // Converte para fator decimal (ex: 1.25)
        const factor = zoom / 100;

        // Em Tauri 2, o zoom é controlado pelo Webview
        const webview = getCurrentWebview();

        // Remove zoom CSS antigo se existir
        document.documentElement.style.zoom = "";

        // Aplica o zoom nativo do Webview
        if (webview && typeof webview.setZoom === "function") {
          await webview.setZoom(factor);
          // Fallback para CSS se a API nativa falhar
          (document.documentElement.style as unknown as { zoom: string }).zoom =
            `${zoom}%`;
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
