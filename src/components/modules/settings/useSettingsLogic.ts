import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type Tab =
  | "profile"
  | "system"
  | "security"
  | "notifications"
  | "danger";

export interface AppConfig {
  minimizeOnClose: boolean;
  startAtLogin: boolean;
  highPriorityNotifications: boolean;
  startMinimized: boolean;
  weekStartDay: number;
  showHolidays: boolean;
  autoReadNotifications: boolean;
  notifSleepBedtime: boolean;
  notifSleepBedtimeTime: string;
  notifSleepMorning: boolean;
  notifSleepMorningTime: string;
  notifHabitUncompleted: boolean;
  notifHabitTime: string;
  notifEventUpcoming: boolean;
  notifEventUpcomingTime: string;
  notifSleepTargetHours: number;
  notificationSound: string;
  tmdbApiKey: string;
  weatherLocation: string;
  showWeatherWidget: boolean;
  appZoom?: number;
}

export function useSettingsLogic() {
  const { user, logout } = useAuth();
  const [minimizeOnClose, setMinimizeOnClose] = useState(true);
  const [startAtLogin, setStartAtLogin] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState(1);
  const [highPriorityNotifications, setHighPriorityNotifications] =
    useState(false);
  const [autoReadNotifications, setAutoReadNotifications] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  const [notifSleepBedtime, setNotifSleepBedtime] = useState(true);
  const [notifSleepBedtimeTime, setNotifSleepBedtimeTime] = useState("23:00");
  const [notifSleepMorning, setNotifSleepMorning] = useState(true);
  const [notifSleepMorningTime, setNotifSleepMorningTime] = useState("09:00");
  const [notifHabitUncompleted, setNotifHabitUncompleted] = useState(true);
  const [notifHabitTime, setNotifHabitTime] = useState("22:00");
  const [notifEventUpcoming, setNotifEventUpcoming] = useState(true);
  const [notifEventUpcomingTime, setNotifEventUpcomingTime] = useState("08:00");
  const [notifSleepTargetHours, setNotifSleepTargetHours] = useState(8.0);
  const [notificationSound, setNotificationSound] = useState("Plin.mp3");
  const [tmdbApiKey, setTmdbApiKey] = useState("");
  const [weatherLocation, setWeatherLocation] = useState("");
  const [showWeatherWidget, setShowWeatherWidget] = useState(true);
  const [appZoom, setAppZoom] = useState(100);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const username = user?.username || "Usuário";
  const email = user?.email || "sem-email@aegis.local";

  const loadConfig = useCallback(async () => {
    try {
      const config = await invoke<AppConfig>("get_app_config");
      setMinimizeOnClose(config.minimizeOnClose);

      try {
        const autostartActive = await isEnabled();
        if (autostartActive !== config.startAtLogin) {
          setStartAtLogin(autostartActive);
        } else {
          setStartAtLogin(config.startAtLogin);
        }
      } catch (e) {
        console.error("Failed to check autostart status:", e);
        setStartAtLogin(config.startAtLogin);
      }
      setHighPriorityNotifications(config.highPriorityNotifications);
      setStartMinimized(config.startMinimized);
      setWeekStartDay(config.weekStartDay);
      setShowHolidays(config.showHolidays);
      setAutoReadNotifications(config.autoReadNotifications);
      setNotifSleepBedtime(config.notifSleepBedtime);
      setNotifSleepBedtimeTime(config.notifSleepBedtimeTime);
      setNotifSleepMorning(config.notifSleepMorning);
      setNotifSleepMorningTime(config.notifSleepMorningTime);
      setNotifHabitUncompleted(config.notifHabitUncompleted);
      setNotifHabitTime(config.notifHabitTime);
      setNotifEventUpcoming(config.notifEventUpcoming);
      setNotifEventUpcomingTime(config.notifEventUpcomingTime);
      setNotifSleepTargetHours(config.notifSleepTargetHours);
      setNotificationSound(config.notificationSound);
      if (config.tmdbApiKey !== undefined) setTmdbApiKey(config.tmdbApiKey);
      if (config.weatherLocation !== undefined)
        setWeatherLocation(config.weatherLocation);
      if (config.showWeatherWidget !== undefined)
        setShowWeatherWidget(config.showWeatherWidget);
      if (config.appZoom !== undefined) setAppZoom(config.appZoom);
      setIsConfigLoading(false);
    } catch (err) {
      console.error("Failed to load config:", err);
      setIsConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    const handleConfigChange = () => loadConfig();
    window.addEventListener("aegis-config-changed", handleConfigChange);
    return () =>
      window.removeEventListener("aegis-config-changed", handleConfigChange);
  }, [loadConfig]);

  const updateConfigField = async (
    key: string,
    value: string | number | boolean,
  ) => {
    const newConfig: AppConfig = {
      minimizeOnClose,
      startAtLogin,
      highPriorityNotifications,
      startMinimized,
      weekStartDay,
      showHolidays,
      autoReadNotifications,
      notifSleepBedtime,
      notifSleepBedtimeTime,
      notifSleepMorning,
      notifSleepMorningTime,
      notifHabitUncompleted,
      notifHabitTime,
      notifEventUpcoming,
      notifEventUpcomingTime,
      notifSleepTargetHours,
      notificationSound,
      tmdbApiKey,
      weatherLocation,
      showWeatherWidget,
      appZoom,
      [key]: value,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      window.dispatchEvent(new Event("aegis-config-changed"));
      if (key === "notifSleepBedtime") setNotifSleepBedtime(value as boolean);
      if (key === "notifSleepBedtimeTime")
        setNotifSleepBedtimeTime(value as string);
      if (key === "notifSleepMorning") setNotifSleepMorning(value as boolean);
      if (key === "notifSleepMorningTime")
        setNotifSleepMorningTime(value as string);
      if (key === "notifHabitUncompleted")
        setNotifHabitUncompleted(value as boolean);
      if (key === "notifHabitTime") setNotifHabitTime(value as string);
      if (key === "notifEventUpcoming") setNotifEventUpcoming(value as boolean);
      if (key === "notifEventUpcomingTime")
        setNotifEventUpcomingTime(value as string);
      if (key === "highPriorityNotifications")
        setHighPriorityNotifications(value as boolean);
      if (key === "autoReadNotifications")
        setAutoReadNotifications(value as boolean);
      if (key === "notifSleepTargetHours")
        setNotifSleepTargetHours(value as number);
      if (key === "notificationSound") setNotificationSound(value as string);
      if (key === "weatherLocation") setWeatherLocation(value as string);
      if (key === "showWeatherWidget") setShowWeatherWidget(value as boolean);
      if (key === "appZoom") setAppZoom(value as number);
      toast.success("Configuração atualizada");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateSystemConfig = async (
    key: "minimize" | "autostart" | "minimized",
    value: boolean,
  ) => {
    const newConfig: AppConfig = {
      minimizeOnClose: key === "minimize" ? value : minimizeOnClose,
      startAtLogin: key === "autostart" ? value : startAtLogin,
      highPriorityNotifications,
      startMinimized: key === "minimized" ? value : startMinimized,
      weekStartDay,
      showHolidays,
      autoReadNotifications,
      notifSleepBedtime,
      notifSleepBedtimeTime,
      notifSleepMorning,
      notifSleepMorningTime,
      notifHabitUncompleted,
      notifHabitTime,
      notifEventUpcoming,
      notifEventUpcomingTime,
      notifSleepTargetHours,
      notificationSound,
      tmdbApiKey,
      weatherLocation,
      showWeatherWidget,
      appZoom,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      window.dispatchEvent(new Event("aegis-config-changed"));

      if (key === "autostart") {
        if (value) {
          await enable();
        } else {
          await disable();
        }
        setStartAtLogin(value);
      }

      if (key === "minimize") setMinimizeOnClose(value);
      if (key === "minimized") setStartMinimized(value);
      toast.success("Configuração salva");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateWeekStart = async (value: number) => {
    const newConfig: AppConfig = {
      minimizeOnClose,
      startAtLogin,
      highPriorityNotifications,
      startMinimized,
      weekStartDay: value,
      showHolidays,
      autoReadNotifications,
      notifSleepBedtime,
      notifSleepBedtimeTime,
      notifSleepMorning,
      notifSleepMorningTime,
      notifHabitUncompleted,
      notifHabitTime,
      notifEventUpcoming,
      notifEventUpcomingTime,
      notifSleepTargetHours,
      notificationSound,
      tmdbApiKey,
      weatherLocation,
      showWeatherWidget,
      appZoom,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      window.dispatchEvent(new Event("aegis-config-changed"));
      setWeekStartDay(value);
      toast.success("Início da semana atualizado");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateShowHolidays = async (value: boolean) => {
    const newConfig: AppConfig = {
      minimizeOnClose,
      startAtLogin,
      highPriorityNotifications,
      startMinimized,
      weekStartDay,
      showHolidays: value,
      autoReadNotifications,
      notifSleepBedtime,
      notifSleepBedtimeTime,
      notifSleepMorning,
      notifSleepMorningTime,
      notifHabitUncompleted,
      notifHabitTime,
      notifEventUpcoming,
      notifEventUpcomingTime,
      notifSleepTargetHours,
      notificationSound,
      tmdbApiKey,
      weatherLocation,
      showWeatherWidget,
      appZoom,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      setShowHolidays(value);
      toast.success(
        value
          ? "Feriados brasileiros exibidos"
          : "Feriados brasileiros ocultos",
      );
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateAutoReadNotifications = async (value: boolean) => {
    const newConfig: AppConfig = {
      minimizeOnClose,
      startAtLogin,
      highPriorityNotifications,
      startMinimized,
      weekStartDay,
      showHolidays,
      autoReadNotifications: value,
      notifSleepBedtime,
      notifSleepBedtimeTime,
      notifSleepMorning,
      notifSleepMorningTime,
      notifHabitUncompleted,
      notifHabitTime,
      notifEventUpcoming,
      notifEventUpcomingTime,
      notifSleepTargetHours,
      notificationSound,
      tmdbApiKey,
      weatherLocation,
      showWeatherWidget,
      appZoom,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      setAutoReadNotifications(value);
      toast.success(
        value
          ? "Notificações serão marcadas como lidas automaticamente"
          : "Notificações não serão mais marcadas como lidas automaticamente",
      );
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

  const handleInternalCommand = async (command: string) => {
    try {
      const response = await invoke<string>("apply_internal_command", {
        command,
      });
      toast.success(response);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return {
    minimizeOnClose,
    startAtLogin,
    startMinimized,
    weekStartDay,
    highPriorityNotifications,
    autoReadNotifications,
    notifSleepBedtime,
    notifSleepBedtimeTime,
    notifSleepMorning,
    notifSleepMorningTime,
    notifHabitUncompleted,
    notifHabitTime,
    notifEventUpcoming,
    notifEventUpcomingTime,
    notificationSound,
    weatherLocation,
    showWeatherWidget,
    appZoom,
    updateConfigField,
    showHolidays,
    username,
    email,
    updateSystemConfig,
    updateWeekStart,
    updateShowHolidays,
    updateAutoReadNotifications,
    handleTestNotification,
    handleInternalCommand,
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
    isConfigLoading,
  };
}
