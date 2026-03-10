import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type Tab =
  | "profile"
  | "system"
  | "security"
  | "notifications"
  | "danger";

export function useSettingsLogic() {
  const { user, logout } = useAuth();
  const [minimizeOnClose, setMinimizeOnClose] = useState(true);
  const [startAtLogin, setStartAtLogin] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [highPriorityNotifications, setHighPriorityNotifications] =
    useState(false);
  const username = user?.username || "Usuário";
  const email = user?.email || "sem-email@aegis.local";

  const loadConfig = useCallback(async () => {
    try {
      const config = await invoke<{
        minimize_on_close: boolean;
        start_at_login: boolean;
        high_priority_notifications: boolean;
        start_minimized: boolean;
      }>("get_app_config");
      setMinimizeOnClose(config.minimize_on_close);
      setStartAtLogin(config.start_at_login);
      setHighPriorityNotifications(config.high_priority_notifications);
      setStartMinimized(config.start_minimized);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateSystemConfig = async (
    key: "minimize" | "autostart" | "minimized",
    value: boolean,
  ) => {
    const newConfig = {
      minimize_on_close: key === "minimize" ? value : minimizeOnClose,
      start_at_login: key === "autostart" ? value : startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: key === "minimized" ? value : startMinimized,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      if (key === "minimize") setMinimizeOnClose(value);
      if (key === "autostart") setStartAtLogin(value);
      if (key === "minimized") setStartMinimized(value);
      toast.success("Configuração salva");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const handleTestNotification = async () => {
    try {
      await invoke("test_notification");
      toast.info("Comando de teste enviado ao Windows");
    } catch (e) {
      toast.error(`Erro ao testar: ${e}`);
    }
  };

  return {
    minimizeOnClose,
    startAtLogin,
    startMinimized,
    username,
    email,
    updateSystemConfig,
    handleTestNotification,
    handleDeleteAccount: async (password: string) => {
      if (!user?.id) return;
      try {
        await invoke("delete_account", { userId: user.id, password });
        toast.success("Conta deletada permanentemente");
        logout();
      } catch (err) {
        console.error("[SETTINGS] Erro ao deletar conta:", err);
        throw err;
      }
    },
    user,
  };
}
