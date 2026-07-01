import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import {
  listNotificationSounds,
  playNotificationSound,
  resolveNotificationSound,
} from "@/lib/sounds";

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
  showSidebarTrigger: boolean;
  showFloatingTrigger: boolean;
  dashboardClockStyle: string;
  dashboardClockAnimated: boolean;
  dashboardHeaderStyle?: string;
  customDataDir: string;
  dashboardCoverImage?: string;
  dashboardWelcomingGlass?: boolean;
  dashboardCoverPositionX?: number;
  dashboardCoverPositionY?: number;
  dashboardShowDate?: boolean;
  dashboardCoverBlur?: number;
  dashboardCoverGrayscale?: number;
  dashboardCoverSaturation?: number;
  dashboardCoverZoom?: number;
  dashboardCoverHeight?: number;
  selectedRankTitle?: string;
  showProfileRankBorder?: boolean;
  showSidebarRankBorder?: boolean;
  achievementsEnabled?: boolean;
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
  const [showSidebarTrigger, setShowSidebarTrigger] = useState(true);
  const [showFloatingTrigger, setShowFloatingTrigger] = useState(true);
  const [dashboardClockStyle, setDashboardClockStyle] = useState("default");
  const [dashboardClockAnimated, setDashboardClockAnimated] = useState(true);
  const [dashboardHeaderStyle, setDashboardHeaderStyle] = useState("default");
  const [customDataDir, setCustomDataDir] = useState("");
  const [dashboardCoverImage, setDashboardCoverImage] = useState("");
  const [dashboardWelcomingGlass, setDashboardWelcomingGlass] = useState(true);
  const [dashboardCoverPositionX, setDashboardCoverPositionX] = useState(50);
  const [dashboardCoverPositionY, setDashboardCoverPositionY] = useState(50);
  const [dashboardShowDate, setDashboardShowDate] = useState(true);
  const [dashboardCoverBlur, setDashboardCoverBlur] = useState(0);
  const [dashboardCoverGrayscale, setDashboardCoverGrayscale] = useState(0);
  const [dashboardCoverSaturation, setDashboardCoverSaturation] = useState(100);
  const [dashboardCoverZoom, setDashboardCoverZoom] = useState(100);
  const [dashboardCoverHeight, setDashboardCoverHeight] = useState(300);
  const [selectedRankTitle, setSelectedRankTitle] = useState("");
  const [showProfileRankBorder, setShowProfileRankBorder] = useState(true);
  const [showSidebarRankBorder, setShowSidebarRankBorder] = useState(true);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const { navigate, setSettingsOpen } = useNavigation();
  const username = user?.username || "Usuário";
  const email = user?.email || "sem-email@aegis.local";

  const loadConfig = useCallback(async () => {
    try {
      const [config, sounds] = await Promise.all([
        invoke<AppConfig>("global_get_app_config"),
        listNotificationSounds().catch(() => [] as string[]),
      ]);
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
      let activeSound = config.notificationSound;
      if (activeSound && sounds.length > 0 && !sounds.includes(activeSound)) {
        activeSound = resolveNotificationSound(activeSound, sounds);
        const updatedConfig = { ...config, notificationSound: activeSound };
        invoke("global_set_app_config", { config: updatedConfig }).catch(
          console.error,
        );
      }
      setNotificationSound(activeSound);
      if (config.tmdbApiKey !== undefined) setTmdbApiKey(config.tmdbApiKey);
      if (config.selectedRankTitle !== undefined)
        setSelectedRankTitle(config.selectedRankTitle);
      if (config.weatherLocation !== undefined)
        setWeatherLocation(config.weatherLocation);
      if (config.showWeatherWidget !== undefined)
        setShowWeatherWidget(config.showWeatherWidget);
      if (config.appZoom !== undefined) setAppZoom(config.appZoom);
      if (config.showSidebarTrigger !== undefined)
        setShowSidebarTrigger(config.showSidebarTrigger);
      if (config.showFloatingTrigger !== undefined)
        setShowFloatingTrigger(config.showFloatingTrigger);
      if (config.dashboardClockStyle !== undefined)
        setDashboardClockStyle(config.dashboardClockStyle);
      if (config.dashboardClockAnimated !== undefined)
        setDashboardClockAnimated(config.dashboardClockAnimated);
      if (config.dashboardHeaderStyle !== undefined)
        setDashboardHeaderStyle(config.dashboardHeaderStyle);
      if (config.customDataDir !== undefined)
        setCustomDataDir(config.customDataDir);
      if (config.dashboardCoverImage !== undefined)
        setDashboardCoverImage(config.dashboardCoverImage);
      if (config.dashboardWelcomingGlass !== undefined)
        setDashboardWelcomingGlass(config.dashboardWelcomingGlass);
      if (config.dashboardCoverPositionX !== undefined)
        setDashboardCoverPositionX(config.dashboardCoverPositionX);
      if (config.dashboardCoverPositionY !== undefined)
        setDashboardCoverPositionY(config.dashboardCoverPositionY);
      if (config.dashboardShowDate !== undefined)
        setDashboardShowDate(config.dashboardShowDate);
      if (config.dashboardCoverBlur !== undefined)
        setDashboardCoverBlur(config.dashboardCoverBlur);
      if (config.dashboardCoverGrayscale !== undefined)
        setDashboardCoverGrayscale(config.dashboardCoverGrayscale);
      if (config.dashboardCoverSaturation !== undefined)
        setDashboardCoverSaturation(config.dashboardCoverSaturation);
      if (config.dashboardCoverZoom !== undefined)
        setDashboardCoverZoom(config.dashboardCoverZoom);
      if (config.dashboardCoverHeight !== undefined)
        setDashboardCoverHeight(config.dashboardCoverHeight);
      if (config.showProfileRankBorder !== undefined)
        setShowProfileRankBorder(config.showProfileRankBorder);
      if (config.showSidebarRankBorder !== undefined)
        setShowSidebarRankBorder(config.showSidebarRankBorder);
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
      [key]: value,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
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
      if (key === "showSidebarTrigger") setShowSidebarTrigger(value as boolean);
      if (key === "showFloatingTrigger")
        setShowFloatingTrigger(value as boolean);
      if (key === "dashboardClockStyle")
        setDashboardClockStyle(value as string);
      if (key === "dashboardClockAnimated")
        setDashboardClockAnimated(value as boolean);
      if (key === "dashboardHeaderStyle")
        setDashboardHeaderStyle(value as string);
      if (key === "dashboardCoverImage")
        setDashboardCoverImage(value as string);
      if (key === "dashboardShowDate") setDashboardShowDate(value as boolean);
      if (key === "dashboardWelcomingGlass")
        setDashboardWelcomingGlass(value as boolean);
      if (key === "dashboardCoverPositionX")
        setDashboardCoverPositionX(value as number);
      if (key === "dashboardCoverPositionY")
        setDashboardCoverPositionY(value as number);
      if (key === "dashboardCoverBlur") setDashboardCoverBlur(value as number);
      if (key === "dashboardCoverGrayscale")
        setDashboardCoverGrayscale(value as number);
      if (key === "dashboardCoverSaturation")
        setDashboardCoverSaturation(value as number);
      if (key === "dashboardCoverZoom") setDashboardCoverZoom(value as number);
      if (key === "dashboardCoverHeight")
        setDashboardCoverHeight(value as number);
      if (key === "selectedRankTitle") setSelectedRankTitle(value as string);
      if (key === "showProfileRankBorder")
        setShowProfileRankBorder(value as boolean);
      if (key === "showSidebarRankBorder")
        setShowSidebarRankBorder(value as boolean);
      toast.success("Configuração atualizada");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configuração");
    }
  };

  const updateConfigFields = async (fields: Partial<AppConfig>) => {
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
      ...fields,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
      window.dispatchEvent(new Event("aegis-config-changed"));

      Object.entries(fields).forEach(([key, value]) => {
        if (key === "notifSleepBedtime") setNotifSleepBedtime(value as boolean);
        if (key === "notifSleepBedtimeTime")
          setNotifSleepBedtimeTime(value as string);
        if (key === "notifSleepMorning") setNotifSleepMorning(value as boolean);
        if (key === "notifSleepMorningTime")
          setNotifSleepMorningTime(value as string);
        if (key === "notifHabitUncompleted")
          setNotifHabitUncompleted(value as boolean);
        if (key === "notifHabitTime") setNotifHabitTime(value as string);
        if (key === "notifEventUpcoming")
          setNotifEventUpcoming(value as boolean);
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
        if (key === "showSidebarTrigger")
          setShowSidebarTrigger(value as boolean);
        if (key === "showFloatingTrigger")
          setShowFloatingTrigger(value as boolean);
        if (key === "dashboardClockStyle")
          setDashboardClockStyle(value as string);
        if (key === "dashboardClockAnimated")
          setDashboardClockAnimated(value as boolean);
        if (key === "dashboardHeaderStyle")
          setDashboardHeaderStyle(value as string);
        if (key === "dashboardCoverImage")
          setDashboardCoverImage(value as string);
        if (key === "dashboardShowDate") setDashboardShowDate(value as boolean);
        if (key === "dashboardWelcomingGlass")
          setDashboardWelcomingGlass(value as boolean);
        if (key === "dashboardCoverPositionX")
          setDashboardCoverPositionX(value as number);
        if (key === "dashboardCoverPositionY")
          setDashboardCoverPositionY(value as number);
        if (key === "dashboardCoverBlur")
          setDashboardCoverBlur(value as number);
        if (key === "dashboardCoverGrayscale")
          setDashboardCoverGrayscale(value as number);
        if (key === "dashboardCoverSaturation")
          setDashboardCoverSaturation(value as number);
        if (key === "dashboardCoverZoom")
          setDashboardCoverZoom(value as number);
        if (key === "dashboardCoverHeight")
          setDashboardCoverHeight(value as number);
        if (key === "selectedRankTitle") setSelectedRankTitle(value as string);
        if (key === "showProfileRankBorder")
          setShowProfileRankBorder(value as boolean);
        if (key === "showSidebarRankBorder")
          setShowSidebarRankBorder(value as boolean);
      });

      toast.success("Configurações atualizadas");
    } catch (err) {
      console.error("Failed to save config:", err);
      toast.error("Erro ao salvar configurações");
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
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
      showSidebarTrigger,
      showFloatingTrigger,
      dashboardClockStyle,
      dashboardClockAnimated,
      dashboardHeaderStyle,
      customDataDir,
      dashboardCoverImage,
      dashboardWelcomingGlass,
      dashboardCoverPositionX,
      dashboardCoverPositionY,
      dashboardShowDate,
      dashboardCoverBlur,
      dashboardCoverGrayscale,
      dashboardCoverSaturation,
      dashboardCoverZoom,
      dashboardCoverHeight,
      selectedRankTitle,
      showProfileRankBorder,
      showSidebarRankBorder,
    };

    try {
      await invoke("global_set_app_config", { config: newConfig });
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
      await invoke("global_test_notification");
      toast.info("Comando de teste enviado ao sistema");
    } catch (e) {
      toast.error(`Erro ao testar: ${e}`);
    }
  };

  const handleInternalCommand = async (command: string) => {
    try {
      const cmd = command.trim();
      const normalizedCmd = cmd.startsWith("/")
        ? cmd.slice(1).trim()
        : cmd.startsWith("--dev ")
          ? cmd.slice(6).trim()
          : cmd;

      // 1. Forçar navegação para um módulo
      if (normalizedCmd.startsWith("module open ")) {
        const moduleName = normalizedCmd.replace("module open ", "").trim();
        navigate(moduleName as AppRoute);
        setSettingsOpen(false);
        toast.success(`Forçando abertura do módulo: ${moduleName}`);
        return;
      }

      // 2. Disparar uma notificação do sistema
      if (normalizedCmd.startsWith("notify force ")) {
        const msg = normalizedCmd.replace("notify force ", "").trim();
        toast("Notificação de Sistema", { description: msg, icon: "🔔" });
        return;
      }

      // 3. Limpar Cache
      if (normalizedCmd === "cache clear") {
        localStorage.clear();
        toast.success(
          "Memória de Cache (Local Storage) foi completamente zerada. Por favor, reinicie o app.",
        );
        return;
      }

      // 4. Teste de som global
      if (normalizedCmd === "sound test") {
        playNotificationSound(notificationSound).catch(console.error);
        toast.success("Reproduzindo som de notificação atual.");
        return;
      }

      // Se não for um comando do Frontend, envia pro Backend (time skipto, db, sys info, etc)
      const response = await invoke<string>("global_apply_internal_command", {
        command: normalizedCmd,
        userId: user?.id,
      });
      toast.success(response);
      window.dispatchEvent(new Event("aegis-achievements-refresh"));
      window.dispatchEvent(new Event("aegis-config-changed"));
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
    showSidebarTrigger,
    showFloatingTrigger,
    dashboardClockStyle,
    dashboardClockAnimated,
    dashboardHeaderStyle,
    customDataDir,
    dashboardCoverImage,
    dashboardWelcomingGlass,
    dashboardCoverPositionX,
    dashboardCoverPositionY,
    dashboardShowDate,
    dashboardCoverBlur,
    dashboardCoverGrayscale,
    dashboardCoverSaturation,
    dashboardCoverZoom,
    dashboardCoverHeight,
    selectedRankTitle,
    showProfileRankBorder,
    showSidebarRankBorder,
    updateConfigField,
    updateConfigFields,
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
        await invoke("global_delete_account", { userId: user.id, password });
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
