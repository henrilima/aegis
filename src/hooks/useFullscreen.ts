"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

/**
 * Hook para gerenciar o atalho global de tela cheia (F11) e saída (F11/Esc).
 */
export function useFullscreen() {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const appWindow = getCurrentWindow();

      if (e.key === "F11") {
        e.preventDefault();
        const isFullscreen = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFullscreen);
      } else if (e.key === "Escape") {
        const isFullscreen = await appWindow.isFullscreen();
        if (isFullscreen) {
          await appWindow.setFullscreen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
