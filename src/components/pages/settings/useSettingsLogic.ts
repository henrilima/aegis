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

export interface AppConfig {
  minimize_on_close: boolean;
  start_at_login: boolean;
  high_priority_notifications: boolean;
  start_minimized: boolean;
  week_start_day: number;
  show_holidays: boolean;
  auto_read_notifications: boolean;
  notif_sleep_bedtime: boolean;
  notif_sleep_bedtime_time: string;
  notif_sleep_morning: boolean;
  notif_sleep_morning_time: string;
  notif_habit_uncompleted: boolean;
  notif_habit_time: string;
  notif_event_upcoming: boolean;
  notif_event_upcoming_time: string;
  notif_sleep_target_hours: number;
  notification_sound: string;
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
  const username = user?.username || "Usuário";
  const email = user?.email || "sem-email@aegis.local";

  const loadConfig = useCallback(async () => {
    try {
      const config = await invoke<AppConfig>("get_app_config");
      setMinimizeOnClose(config.minimize_on_close);
      setStartAtLogin(config.start_at_login);
      setHighPriorityNotifications(config.high_priority_notifications);
      setStartMinimized(config.start_minimized);
      setWeekStartDay(config.week_start_day);
      setShowHolidays(config.show_holidays);
      setAutoReadNotifications(config.auto_read_notifications);
      setNotifSleepBedtime(config.notif_sleep_bedtime);
      setNotifSleepBedtimeTime(config.notif_sleep_bedtime_time);
      setNotifSleepMorning(config.notif_sleep_morning);
      setNotifSleepMorningTime(config.notif_sleep_morning_time);
      setNotifHabitUncompleted(config.notif_habit_uncompleted);
      setNotifHabitTime(config.notif_habit_time);
      setNotifEventUpcoming(config.notif_event_upcoming);
      setNotifEventUpcomingTime(config.notif_event_upcoming_time);
      setNotifSleepTargetHours(config.notif_sleep_target_hours);
      setNotificationSound(config.notification_sound);
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfigField = async (
    key: string,
    value: string | number | boolean,
  ) => {
    const newConfig: AppConfig = {
      minimize_on_close: minimizeOnClose,
      start_at_login: startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: startMinimized,
      week_start_day: weekStartDay,
      show_holidays: showHolidays,
      auto_read_notifications: autoReadNotifications,
      notif_sleep_bedtime: notifSleepBedtime,
      notif_sleep_bedtime_time: notifSleepBedtimeTime,
      notif_sleep_morning: notifSleepMorning,
      notif_sleep_morning_time: notifSleepMorningTime,
      notif_habit_uncompleted: notifHabitUncompleted,
      notif_habit_time: notifHabitTime,
      notif_event_upcoming: notifEventUpcoming,
      notif_event_upcoming_time: notifEventUpcomingTime,
      notif_sleep_target_hours: notifSleepTargetHours,
      notification_sound: notificationSound,
      [key]: value,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      if (key === "notif_sleep_bedtime") setNotifSleepBedtime(value as boolean);
      if (key === "notif_sleep_bedtime_time")
        setNotifSleepBedtimeTime(value as string);
      if (key === "notif_sleep_morning") setNotifSleepMorning(value as boolean);
      if (key === "notif_sleep_morning_time")
        setNotifSleepMorningTime(value as string);
      if (key === "notif_habit_uncompleted")
        setNotifHabitUncompleted(value as boolean);
      if (key === "notif_habit_time") setNotifHabitTime(value as string);
      if (key === "notif_event_upcoming")
        setNotifEventUpcoming(value as boolean);
      if (key === "notif_event_upcoming_time")
        setNotifEventUpcomingTime(value as string);
      if (key === "high_priority_notifications")
        setHighPriorityNotifications(value as boolean);
      if (key === "auto_read_notifications")
        setAutoReadNotifications(value as boolean);
      if (key === "notif_sleep_target_hours")
        setNotifSleepTargetHours(value as number);
      if (key === "notification_sound") setNotificationSound(value as string);
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
    const newConfig = {
      minimize_on_close: key === "minimize" ? value : minimizeOnClose,
      start_at_login: key === "autostart" ? value : startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: key === "minimized" ? value : startMinimized,
      week_start_day: weekStartDay,
      show_holidays: showHolidays,
      auto_read_notifications: autoReadNotifications,
      notif_sleep_bedtime: notifSleepBedtime,
      notif_sleep_bedtime_time: notifSleepBedtimeTime,
      notif_sleep_morning: notifSleepMorning,
      notif_sleep_morning_time: notifSleepMorningTime,
      notif_habit_uncompleted: notifHabitUncompleted,
      notif_habit_time: notifHabitTime,
      notif_event_upcoming: notifEventUpcoming,
      notif_event_upcoming_time: notifEventUpcomingTime,
      notif_sleep_target_hours: notifSleepTargetHours,
      notification_sound: notificationSound,
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

  const updateWeekStart = async (value: number) => {
    const newConfig: AppConfig = {
      minimize_on_close: minimizeOnClose,
      start_at_login: startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: startMinimized,
      week_start_day: value,
      show_holidays: showHolidays,
      auto_read_notifications: autoReadNotifications,
      notif_sleep_bedtime: notifSleepBedtime,
      notif_sleep_bedtime_time: notifSleepBedtimeTime,
      notif_sleep_morning: notifSleepMorning,
      notif_sleep_morning_time: notifSleepMorningTime,
      notif_habit_uncompleted: notifHabitUncompleted,
      notif_habit_time: notifHabitTime,
      notif_event_upcoming: notifEventUpcoming,
      notif_event_upcoming_time: notifEventUpcomingTime,
      notif_sleep_target_hours: notifSleepTargetHours,
      notification_sound: notificationSound,
    };

    try {
      await invoke("set_app_config", { config: newConfig });
      setWeekStartDay(value);
      toast.success("Início da semana atualizado");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateShowHolidays = async (value: boolean) => {
    const newConfig: AppConfig = {
      minimize_on_close: minimizeOnClose,
      start_at_login: startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: startMinimized,
      week_start_day: weekStartDay,
      show_holidays: value,
      auto_read_notifications: autoReadNotifications,
      notif_sleep_bedtime: notifSleepBedtime,
      notif_sleep_bedtime_time: notifSleepBedtimeTime,
      notif_sleep_morning: notifSleepMorning,
      notif_sleep_morning_time: notifSleepMorningTime,
      notif_habit_uncompleted: notifHabitUncompleted,
      notif_habit_time: notifHabitTime,
      notif_event_upcoming: notifEventUpcoming,
      notif_event_upcoming_time: notifEventUpcomingTime,
      notif_sleep_target_hours: notifSleepTargetHours,
      notification_sound: notificationSound,
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
      minimize_on_close: minimizeOnClose,
      start_at_login: startAtLogin,
      high_priority_notifications: highPriorityNotifications,
      start_minimized: startMinimized,
      week_start_day: weekStartDay,
      show_holidays: showHolidays,
      auto_read_notifications: value,
      notif_sleep_bedtime: notifSleepBedtime,
      notif_sleep_bedtime_time: notifSleepBedtimeTime,
      notif_sleep_morning: notifSleepMorning,
      notif_sleep_morning_time: notifSleepMorningTime,
      notif_habit_uncompleted: notifHabitUncompleted,
      notif_habit_time: notifHabitTime,
      notif_event_upcoming: notifEventUpcoming,
      notif_event_upcoming_time: notifEventUpcomingTime,
      notif_sleep_target_hours: notifSleepTargetHours,
      notification_sound: notificationSound,
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
  };
}
