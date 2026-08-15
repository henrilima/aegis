import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import {
  getAudioOptions,
  playNotificationSound,
  resolveNotificationSound,
} from "@/lib/sounds";

export type Tab =
  | "profile"
  | "system"
  | "security"
  | "notifications"
  | "media"
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
  showLevelUpModal?: boolean;
}

let globalCachedConfig: AppConfig | null = null;

export function useSettingsLogic() {
  const { user, logout } = useAuth();
  const [minimizeOnClose, setMinimizeOnClose] = useState(
    () => globalCachedConfig?.minimizeOnClose ?? true,
  );
  const [startAtLogin, setStartAtLogin] = useState(
    () => globalCachedConfig?.startAtLogin ?? false,
  );
  const [startMinimized, setStartMinimized] = useState(
    () => globalCachedConfig?.startMinimized ?? false,
  );
  const [weekStartDay, setWeekStartDay] = useState(
    () => globalCachedConfig?.weekStartDay ?? 1,
  );
  const [highPriorityNotifications, setHighPriorityNotifications] = useState(
    () => globalCachedConfig?.highPriorityNotifications ?? false,
  );
  const [autoReadNotifications, setAutoReadNotifications] = useState(
    () => globalCachedConfig?.autoReadNotifications ?? true,
  );
  const [showHolidays, setShowHolidays] = useState(
    () => globalCachedConfig?.showHolidays ?? true,
  );
  const [notifSleepBedtime, setNotifSleepBedtime] = useState(
    () => globalCachedConfig?.notifSleepBedtime ?? true,
  );
  const [notifSleepBedtimeTime, setNotifSleepBedtimeTime] = useState(
    () => globalCachedConfig?.notifSleepBedtimeTime ?? "23:00",
  );
  const [notifSleepMorning, setNotifSleepMorning] = useState(
    () => globalCachedConfig?.notifSleepMorning ?? true,
  );
  const [notifSleepMorningTime, setNotifSleepMorningTime] = useState(
    () => globalCachedConfig?.notifSleepMorningTime ?? "09:00",
  );
  const [notifHabitUncompleted, setNotifHabitUncompleted] = useState(
    () => globalCachedConfig?.notifHabitUncompleted ?? true,
  );
  const [notifHabitTime, setNotifHabitTime] = useState(
    () => globalCachedConfig?.notifHabitTime ?? "22:00",
  );
  const [notifEventUpcoming, setNotifEventUpcoming] = useState(
    () => globalCachedConfig?.notifEventUpcoming ?? true,
  );
  const [notifEventUpcomingTime, setNotifEventUpcomingTime] = useState(
    () => globalCachedConfig?.notifEventUpcomingTime ?? "08:00",
  );
  const [notifSleepTargetHours, setNotifSleepTargetHours] = useState(
    () => globalCachedConfig?.notifSleepTargetHours ?? 8.0,
  );
  const [notificationSound, setNotificationSound] = useState(
    () => globalCachedConfig?.notificationSound ?? "Plin.mp3",
  );
  const [tmdbApiKey, setTmdbApiKey] = useState(
    () => globalCachedConfig?.tmdbApiKey ?? "",
  );
  const [weatherLocation, setWeatherLocation] = useState(
    () => globalCachedConfig?.weatherLocation ?? "",
  );
  const [showWeatherWidget, setShowWeatherWidget] = useState(
    () => globalCachedConfig?.showWeatherWidget ?? true,
  );
  const [appZoom, setAppZoom] = useState(
    () => globalCachedConfig?.appZoom ?? 100,
  );
  const [showSidebarTrigger, setShowSidebarTrigger] = useState(
    () => globalCachedConfig?.showSidebarTrigger ?? true,
  );
  const [showFloatingTrigger, setShowFloatingTrigger] = useState(
    () => globalCachedConfig?.showFloatingTrigger ?? true,
  );
  const [dashboardClockStyle, setDashboardClockStyle] = useState(
    () => globalCachedConfig?.dashboardClockStyle ?? "default",
  );
  const [dashboardClockAnimated, setDashboardClockAnimated] = useState(
    () => globalCachedConfig?.dashboardClockAnimated ?? true,
  );
  const [dashboardHeaderStyle, setDashboardHeaderStyle] = useState(
    () => globalCachedConfig?.dashboardHeaderStyle ?? "default",
  );
  const [customDataDir, setCustomDataDir] = useState(
    () => globalCachedConfig?.customDataDir ?? "",
  );
  const [dashboardCoverImage, setDashboardCoverImage] = useState(
    () => globalCachedConfig?.dashboardCoverImage ?? "",
  );
  const [dashboardWelcomingGlass, setDashboardWelcomingGlass] = useState(
    () => globalCachedConfig?.dashboardWelcomingGlass ?? true,
  );
  const [dashboardCoverPositionX, setDashboardCoverPositionX] = useState(
    () => globalCachedConfig?.dashboardCoverPositionX ?? 50,
  );
  const [dashboardCoverPositionY, setDashboardCoverPositionY] = useState(
    () => globalCachedConfig?.dashboardCoverPositionY ?? 50,
  );
  const [dashboardShowDate, setDashboardShowDate] = useState(
    () => globalCachedConfig?.dashboardShowDate ?? true,
  );
  const [dashboardCoverBlur, setDashboardCoverBlur] = useState(
    () => globalCachedConfig?.dashboardCoverBlur ?? 0,
  );
  const [dashboardCoverGrayscale, setDashboardCoverGrayscale] = useState(
    () => globalCachedConfig?.dashboardCoverGrayscale ?? 0,
  );
  const [dashboardCoverSaturation, setDashboardCoverSaturation] = useState(
    () => globalCachedConfig?.dashboardCoverSaturation ?? 100,
  );
  const [dashboardCoverZoom, setDashboardCoverZoom] = useState(
    () => globalCachedConfig?.dashboardCoverZoom ?? 100,
  );
  const [dashboardCoverHeight, setDashboardCoverHeight] = useState(
    () => globalCachedConfig?.dashboardCoverHeight ?? 300,
  );
  const [selectedRankTitle, setSelectedRankTitle] = useState(
    () => globalCachedConfig?.selectedRankTitle ?? "",
  );
  const [showProfileRankBorder, setShowProfileRankBorder] = useState(
    () => globalCachedConfig?.showProfileRankBorder ?? true,
  );
  const [showSidebarRankBorder, setShowSidebarRankBorder] = useState(
    () => globalCachedConfig?.showSidebarRankBorder ?? true,
  );
  const [showLevelUpModal, setShowLevelUpModal] = useState(
    () => globalCachedConfig?.showLevelUpModal ?? false,
  );
  const [isConfigLoading, setIsConfigLoading] = useState(
    () => !globalCachedConfig,
  );
  const { navigate, setSettingsOpen } = useNavigation();
  const username = user?.username || "Usuário";
  const email = user?.email || "sem-email@aegis.local";

  const loadConfig = useCallback(async () => {
    try {
      const [config, audioOpts] = await Promise.all([
        invoke<AppConfig>("global_get_app_config", { userId: user?.id }),
        getAudioOptions().catch(() => []),
      ]);
      globalCachedConfig = config;

      setMinimizeOnClose(config.minimizeOnClose);

      try {
        const autostartActive = await isEnabled();
        if (autostartActive !== config.startAtLogin) {
          setStartAtLogin(autostartActive);
        } else {
          setStartAtLogin(config.startAtLogin);
        }
      } catch (err) {
        console.warn("[useSettingsLogic] Falha ao ler autostart:", err);
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
      if (activeSound && audioOpts.length > 0) {
        const resolved = resolveNotificationSound(activeSound, audioOpts);
        if (resolved !== activeSound) {
          activeSound = resolved;
          const updatedConfig = { ...config, notificationSound: activeSound };
          invoke("global_set_app_config", {
            config: updatedConfig,
            userId: user?.id,
          }).catch(console.error);
        }
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
      const uid = user?.id ? String(user.id) : "";
      if (uid && typeof window !== "undefined") {
        const coverImg = localStorage.getItem(`aegis_cover_image_${uid}`);
        if (coverImg !== null) setDashboardCoverImage(coverImg);
        else if (config.dashboardCoverImage !== undefined)
          setDashboardCoverImage(config.dashboardCoverImage);

        const glass = localStorage.getItem(`aegis_cover_glass_${uid}`);
        if (glass !== null) setDashboardWelcomingGlass(glass === "true");
        else if (config.dashboardWelcomingGlass !== undefined)
          setDashboardWelcomingGlass(config.dashboardWelcomingGlass);

        const posX = localStorage.getItem(`aegis_cover_pos_x_${uid}`);
        if (posX !== null) setDashboardCoverPositionX(Number(posX));
        else if (config.dashboardCoverPositionX !== undefined)
          setDashboardCoverPositionX(config.dashboardCoverPositionX);

        const posY = localStorage.getItem(`aegis_cover_pos_y_${uid}`);
        if (posY !== null) setDashboardCoverPositionY(Number(posY));
        else if (config.dashboardCoverPositionY !== undefined)
          setDashboardCoverPositionY(config.dashboardCoverPositionY);

        const showDate = localStorage.getItem(`aegis_cover_show_date_${uid}`);
        if (showDate !== null) setDashboardShowDate(showDate === "true");
        else if (config.dashboardShowDate !== undefined)
          setDashboardShowDate(config.dashboardShowDate);

        const blur = localStorage.getItem(`aegis_cover_blur_${uid}`);
        if (blur !== null) setDashboardCoverBlur(Number(blur));
        else if (config.dashboardCoverBlur !== undefined)
          setDashboardCoverBlur(config.dashboardCoverBlur);

        const gray = localStorage.getItem(`aegis_cover_grayscale_${uid}`);
        if (gray !== null) setDashboardCoverGrayscale(Number(gray));
        else if (config.dashboardCoverGrayscale !== undefined)
          setDashboardCoverGrayscale(config.dashboardCoverGrayscale);

        const sat = localStorage.getItem(`aegis_cover_saturation_${uid}`);
        if (sat !== null) setDashboardCoverSaturation(Number(sat));
        else if (config.dashboardCoverSaturation !== undefined)
          setDashboardCoverSaturation(config.dashboardCoverSaturation);

        const zoom = localStorage.getItem(`aegis_cover_zoom_${uid}`);
        if (zoom !== null) setDashboardCoverZoom(Number(zoom));
        else if (config.dashboardCoverZoom !== undefined)
          setDashboardCoverZoom(config.dashboardCoverZoom);

        const height = localStorage.getItem(`aegis_cover_height_${uid}`);
        if (height !== null) setDashboardCoverHeight(Number(height));
        else if (config.dashboardCoverHeight !== undefined)
          setDashboardCoverHeight(config.dashboardCoverHeight);
      } else {
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
      }
      if (config.showProfileRankBorder !== undefined)
        setShowProfileRankBorder(config.showProfileRankBorder);
      if (config.showSidebarRankBorder !== undefined)
        setShowSidebarRankBorder(config.showSidebarRankBorder);
      if (config.showLevelUpModal !== undefined)
        setShowLevelUpModal(config.showLevelUpModal);
      setIsConfigLoading(false);
    } catch (err) {
      console.error("Failed to load config:", err);
      setIsConfigLoading(false);
    }
  }, [user?.id]);

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
    globalCachedConfig = newConfig;

    try {
      await invoke("global_set_app_config", {
        config: newConfig,
        userId: user?.id,
      });
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
      if (key === "appZoom") {
        const z = value as number;
        setAppZoom(z);
        if (typeof document !== "undefined") {
          (document.documentElement.style as unknown as { zoom: string }).zoom =
            "";
        }
        try {
          const webview = getCurrentWebview();
          if (webview && typeof webview.setZoom === "function") {
            webview.setZoom(z / 100);
          }
        } catch (err) {
          console.warn("Failed to set native webview zoom:", err);
        }
      }
      if (key === "showSidebarTrigger") setShowSidebarTrigger(value as boolean);
      if (key === "showFloatingTrigger")
        setShowFloatingTrigger(value as boolean);
      if (key === "dashboardClockStyle")
        setDashboardClockStyle(value as string);
      if (key === "dashboardClockAnimated")
        setDashboardClockAnimated(value as boolean);
      if (key === "dashboardHeaderStyle")
        setDashboardHeaderStyle(value as string);
      const uid = user?.id ? String(user.id) : "";
      if (uid && typeof window !== "undefined") {
        if (key === "dashboardCoverImage")
          localStorage.setItem(`aegis_cover_image_${uid}`, String(value));
        if (key === "dashboardWelcomingGlass")
          localStorage.setItem(`aegis_cover_glass_${uid}`, String(value));
        if (key === "dashboardCoverPositionX")
          localStorage.setItem(`aegis_cover_pos_x_${uid}`, String(value));
        if (key === "dashboardCoverPositionY")
          localStorage.setItem(`aegis_cover_pos_y_${uid}`, String(value));
        if (key === "dashboardShowDate")
          localStorage.setItem(`aegis_cover_show_date_${uid}`, String(value));
        if (key === "dashboardCoverBlur")
          localStorage.setItem(`aegis_cover_blur_${uid}`, String(value));
        if (key === "dashboardCoverGrayscale")
          localStorage.setItem(`aegis_cover_grayscale_${uid}`, String(value));
        if (key === "dashboardCoverSaturation")
          localStorage.setItem(`aegis_cover_saturation_${uid}`, String(value));
        if (key === "dashboardCoverZoom")
          localStorage.setItem(`aegis_cover_zoom_${uid}`, String(value));
        if (key === "dashboardCoverHeight")
          localStorage.setItem(`aegis_cover_height_${uid}`, String(value));
      }

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
      if (key === "showLevelUpModal") setShowLevelUpModal(value as boolean);
      window.dispatchEvent(new Event("aegis-config-changed"));
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
      await invoke("global_set_app_config", {
        config: newConfig,
        userId: user?.id,
      });
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
    showLevelUpModal,
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
