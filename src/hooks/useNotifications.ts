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
  persistent: boolean;
  is_read: boolean;
  created_at: string;
}

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
    // Atualiza a cada 30 segundos para pegar novas notificações do backend
    const interval = setInterval(refresh, 30_000);

    // Escuta eventos em tempo real do Tauri
    const unlistenPromise = listen("new-notification", () => {
      refresh();
    });

    return () => {
      clearInterval(interval);
      unlistenPromise.then((unlisten) => unlisten());
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
