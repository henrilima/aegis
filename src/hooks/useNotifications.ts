"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  getConfiguredNotificationSound,
  playNotificationSound,
} from "@/lib/sounds";
import type { NotificationButton } from "@/persistentNotifications.config";

export interface AppNotification {
  id: number;
  userId?: string;
  title: string;
  body: string;
  category: string;
  tag?: string;
  color?: string;
  icon?: string | React.ComponentType<{ className?: string }>;
  persistent: boolean;
  isRead: boolean;
  createdAt: string;
  buttons?: NotificationButton[];
}

interface NotificationEventPayload {
  id?: number;
  origin?: string;
  soundFile?: string;
  skipSound?: boolean;
}

/** Intervalo de polling para sincronizacao de notificacoes (em ms). */
const _NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [list, count] = await Promise.all([
        invoke<AppNotification[]>("global_notif_list", { userId }),
        invoke<number>("global_notif_unread_count", { userId }),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("[useNotifications] Erro ao buscar notificacoes:", err);
    }
  }, [userId]);

  useEffect(() => {
    refresh();

    const unlistenPromise = listen(
      "new-notification",
      async (event: { payload?: NotificationEventPayload }) => {
        refresh();

        if (event.payload?.skipSound) return;

        try {
          const soundFile =
            event.payload?.soundFile ??
            (await getConfiguredNotificationSound());
          await playNotificationSound(soundFile);
        } catch (err) {
          console.error("[useNotifications] Erro ao processar som:", err);
        }
      },
    );

    const unlistenAlarm = listen(
      "trigger-alarm",
      async (event: { payload?: NotificationEventPayload }) => {
        refresh();
        if (event.payload?.skipSound !== false) return;
        if (!event.payload?.soundFile) return;

        try {
          await playNotificationSound(event.payload.soundFile);
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
      await invoke("global_notif_mark_read", { id, userId });
      await refresh();
    },
    [userId, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await invoke("global_notif_mark_all_read", { userId });
    await refresh();
  }, [userId, refresh]);

  const remove = useCallback(
    async (id: number) => {
      if (!userId) return;
      await invoke("global_notif_delete", { id, userId });
      await refresh();
    },
    [userId, refresh],
  );

  const clearRead = useCallback(async () => {
    if (!userId) return;
    await invoke("global_notif_clear_read", { userId });
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
