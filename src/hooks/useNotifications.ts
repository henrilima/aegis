"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";

export interface AppNotification {
  id: number;
  user_id: string;
  title: string;
  body: string;
  category: string;
  tag?: string;
  color?: string;
  icon?: string;
  persistent: boolean;
  is_read: boolean;
  created_at: string;
}

/** Intervalo de polling para sincronização de notificações (em ms). */
const _NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [list, count] = await Promise.all([
        invoke<AppNotification[]>("notif_list", { userId }),
        invoke<number>("notif_unread_count", { userId }),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("[useNotifications] Erro ao buscar notificações:", err);
    }
  }, [userId]);

  useEffect(() => {
    refresh();

    // Escuta eventos em tempo real do Tauri
    const unlistenPromise = listen("new-notification", async () => {
      refresh();

      // Toca o som de notificação configurado
      try {
        const config = await invoke<{ notification_sound: string }>(
          "get_app_config",
        );
        const playSound = (soundFile: string) => {
          const audio = new Audio(`/sounds/${soundFile}`);
          audio.play().catch(() => {
            new Audio(`/sounds/${soundFile}`).play().catch((err) => {
              console.error(
                "[Aegis Audio] Falha total ao carregar áudio:",
                err,
              );
            });
          });
        };
        playSound(config.notification_sound);
      } catch (err) {
        console.error("[useNotifications] Erro ao processar som:", err);
      }
    });

    // Escuta disparos de alarmes customizados
    const unlistenAlarm = listen(
      "trigger-alarm",
      async (event: { payload: { sound_file: string } }) => {
        refresh();
        try {
          const soundFile = event.payload.sound_file;
          const audio = new Audio(`/sounds/${soundFile}`);
          audio.play().catch((e) => {
            console.warn(
              "[Aegis Alarms] Falha ao tocar som do alarme, tentando fallback:",
              e,
            );
            new Audio(`sounds/${soundFile}`)
              .play()
              .catch((err) => console.error("Alarm sound failed", err));
          });
        } catch (err) {
          console.error("[useNotifications] Erro ao processar alarme:", err);
        }
      },
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      unlistenAlarm.then((unlisten) => unlisten());
    };
  }, [refresh]);

  const markRead = useCallback(
    async (id: number) => {
      if (!userId) return;
      await invoke("notif_mark_read", { id, userId });
      await refresh();
    },
    [userId, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await invoke("notif_mark_all_read", { userId });
    await refresh();
  }, [userId, refresh]);

  const remove = useCallback(
    async (id: number) => {
      if (!userId) return;
      await invoke("notif_delete", { id, userId });
      await refresh();
    },
    [userId, refresh],
  );

  const clearRead = useCallback(async () => {
    if (!userId) return;
    await invoke("notif_clear_read", { userId });
    await refresh();
  }, [userId, refresh]);

  return {
    notifications,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    remove,
    clearRead,
  };
}
