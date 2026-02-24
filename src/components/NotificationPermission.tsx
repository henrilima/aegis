"use client";

import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { useEffect } from "react";

export function NotificationPermission() {
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await isPermissionGranted();
        if (!permission) {
          await requestPermission();
        }
      } catch (e) {
        console.error("Erro ao solicitar permissão de notificação:", e);
      }
    };
    checkPermission();
  }, []);

  return null;
}
