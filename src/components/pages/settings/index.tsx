"use client";

import {
  Bell,
  Database,
  Info,
  Monitor,
  Settings as SettingsIcon,
  ShieldCheck,
  Terminal,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/app.config";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { AboutTab } from "./aboutTab";
import { DangerTab } from "./dangerTab";
import { DataTab } from "./dataTab";
import { NotificationsTab } from "./notificationsTab";
import { ProfileTab } from "./profileTab";
import { SecurityTab } from "./securityTab";
import { SystemTab } from "./systemTab";
import { TelemetryTab } from "./telemetryTab";
import { useSettingsLogic } from "./useSettingsLogic";

const TABS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "data", label: "Dados e Backup", icon: Database },
  { id: "about", label: "Sobre", icon: Info },
  { id: "danger", label: "Zona de Perigo", icon: Trash2 },
] as const;

type TabId = (typeof TABS)[number]["id"] | "telemetry";

export default function Settings() {
  const {
    minimizeOnClose,
    startAtLogin,
    startMinimized,
    weekStartDay,
    username,
    email,
    notifSleepBedtime,
    notifSleepBedtimeTime,
    notifSleepMorning,
    notifSleepMorningTime,
    notifHabitUncompleted,
    notifHabitTime,
    notifEventUpcoming,
    notifEventUpcomingTime,
    autoReadNotifications,
    updateConfigField,
    updateSystemConfig,
    updateWeekStart,
    updateAutoReadNotifications,
    handleTestNotification,
    handleInternalCommand,
    handleDeleteAccount,
    highPriorityNotifications,
    notificationSound,
    user,
  } = useSettingsLogic();
  const { themeStyles } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Escuta o evento global de ativação de telemetria
  useEffect(() => {
    const handleOpenTelemetry = () => {
      setActiveTab("telemetry");
      toast.info("Modo de Telemetria ativado");
    };
    window.addEventListener("open-telemetry", handleOpenTelemetry);
    return () =>
      window.removeEventListener("open-telemetry", handleOpenTelemetry);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 ">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 ${themeStyles.bg} rounded-xl border ${themeStyles.border}`}
        >
          <SettingsIcon className={`w-5 h-5 ${themeStyles.text}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold leading-none">Configurações</h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] py-0 px-1.5 h-4 border-opacity-30",
                themeStyles.text,
                themeStyles.bg,
                themeStyles.border,
              )}
            >
              {APP_CONFIG.versionLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie sua conta e preferências do sistema
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1.5 bg-background border border-border/60 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              activeTab === tab.id
                ? `${themeStyles.bg} ${themeStyles.text.replace("-500", "-600 dark:text-400")} border-primary/20`
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}

        {activeTab === "telemetry" && (
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              `${themeStyles.bg} ${themeStyles.text.replace("-500", "-600 dark:text-400")} border-primary/20`,
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            Telemetria
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Abas */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ProfileTab username={username} email={email} />
          </div>
        )}

        {activeTab === "system" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SystemTab
              startAtLogin={startAtLogin}
              minimizeOnClose={minimizeOnClose}
              startMinimized={startMinimized}
              updateSystemConfig={updateSystemConfig}
              handleInternalCommand={handleInternalCommand}
              weekStartDay={weekStartDay}
              updateWeekStart={updateWeekStart}
            />
          </div>
        )}

        {activeTab === "security" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SecurityTab />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NotificationsTab
              highPriorityNotifications={highPriorityNotifications}
              notifSleepBedtime={notifSleepBedtime}
              notifSleepBedtimeTime={notifSleepBedtimeTime}
              notifSleepMorning={notifSleepMorning}
              notifSleepMorningTime={notifSleepMorningTime}
              notifHabitUncompleted={notifHabitUncompleted}
              notifHabitTime={notifHabitTime}
              notifEventUpcoming={notifEventUpcoming}
              notifEventUpcomingTime={notifEventUpcomingTime}
              autoReadNotifications={autoReadNotifications}
              updateConfig={updateConfigField}
              updateAutoReadNotifications={updateAutoReadNotifications}
              handleTestNotification={handleTestNotification}
              notificationSound={notificationSound}
            />
          </div>
        )}

        {activeTab === "data" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DataTab />
          </div>
        )}

        {activeTab === "about" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AboutTab />
          </div>
        )}

        {activeTab === "danger" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DangerTab
              username={username}
              masterCodeIndex={user?.master_code_index ?? 0}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TelemetryTab />
          </div>
        )}
      </div>
    </div>
  );
}
