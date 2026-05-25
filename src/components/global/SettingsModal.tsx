"use client";

import {
  Bell,
  Code2,
  Database,
  HeartPulse,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  Palette,
  Puzzle,
  ShieldCheck,
  Terminal,
  Trash2,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { AboutTab } from "../modules/settings/aboutTab";
import { DangerTab } from "../modules/settings/dangerTab";
import { DataTab } from "../modules/settings/dataTab";
import { DeveloperTab } from "../modules/settings/developerTab";
import { IntegrationsTab } from "../modules/settings/integrationsTab";
import { ModulesTab } from "../modules/settings/modulesTab";
import { NotificationsTab } from "../modules/settings/notificationsTab";
import { ProfileTab } from "../modules/settings/profileTab";
import { SecurityTab } from "../modules/settings/securityTab";
import { SystemHealthTab } from "../modules/settings/systemHealthTab";
import { SystemTab } from "../modules/settings/systemTab";
import { ThemesTab } from "../modules/settings/themesTab";
import { useSettingsLogic } from "../modules/settings/useSettingsLogic";

interface SettingsItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const GROUPS: { label: string; items: SettingsItem[] }[] = [
  {
    label: "Conta",
    items: [
      { id: "profile", label: "Perfil", icon: User },
      { id: "notifications", label: "Notificações", icon: Bell },
      { id: "security", label: "Segurança", icon: ShieldCheck },
      { id: "data", label: "Dados e Backup", icon: Database },
    ],
  },
  {
    label: "Personalização",
    items: [{ id: "themes", label: "Aparência", icon: Palette }],
  },
  {
    label: "Sistema",
    items: [
      { id: "system", label: "Geral", icon: Monitor },
      { id: "modules", label: "Módulos", icon: LayoutGrid },
      { id: "integrations", label: "Integrações", icon: Puzzle },
    ],
  },
  {
    label: "Desenvolvedor",
    items: [
      { id: "developer", label: "Área Restrita", icon: Code2 },
      { id: "system-health", label: "Saúde do Sistema", icon: HeartPulse },
    ],
  },
  {
    label: "Outros",
    items: [
      { id: "about", label: "Sobre", icon: Info },
      { id: "danger", label: "Zona de Perigo", icon: Trash2 },
    ],
  },
];

type SettingsTabId = string | "telemetry";

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useNavigation();
  const { themeStyles } = useTheme();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
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
    updateAutoReadNotifications,
    handleTestNotification,
    handleInternalCommand,
    handleDeleteAccount,
    highPriorityNotifications,
    notificationSound,
    user,
  } = useSettingsLogic();

  useEffect(() => {
    const handleOpenTelemetry = () => setActiveTab("developer");
    window.addEventListener("open-telemetry", handleOpenTelemetry);
    return () =>
      window.removeEventListener("open-telemetry", handleOpenTelemetry);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab username={username} email={email} />;
      case "notifications":
        return (
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
        );
      case "security":
        return <SecurityTab />;
      case "data":
        return <DataTab />;
      case "themes":
        return <ThemesTab />;
      case "system":
        return <SystemTab />;
      case "modules":
        return <ModulesTab />;
      case "integrations":
        return <IntegrationsTab />;
      case "developer":
        return <DeveloperTab handleInternalCommand={handleInternalCommand} />;
      case "system-health":
        return <SystemHealthTab />;
      case "about":
        return <AboutTab />;
      case "danger":
        return (
          <DangerTab
            username={username}
            masterCodeIndex={user?.masterCodeIndex ?? 0}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return null;
    }
  };

  const activeItem =
    GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab) ||
    (activeTab === "telemetry"
      ? { label: "Telemetria", icon: Terminal }
      : null);

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        className={cn(
          "max-w-7xl w-[98vw] h-[92vh] p-0 overflow-hidden border-2 border-border gap-0 sm:max-w-none backdrop-blur-md bg-background/95 flex flex-col",
        )}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Configurações</DialogTitle>
        <DialogDescription className="sr-only">
          Gerencie as configurações do sistema Aegis.
        </DialogDescription>

        <div className="flex h-full w-full relative">
          {/* Sidebar - Desktop */}
          <aside
            className={cn(
              "w-72 bg-accent/30 border-r border-border/40 flex-col p-6 gap-8 hidden md:flex",
            )}
          >
            <div className="px-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center",
                    themeStyles.bg,
                  )}
                >
                  <Monitor className={cn("w-3.5 h-3.5", themeStyles.text)} />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  Configurações
                </h2>
              </div>
            </div>

            <nav className="flex flex-col gap-8 overflow-y-auto no-scrollbar pr-2">
              {GROUPS.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <span className="px-2.5 text-[10px] font-bold text-muted-foreground/50 uppercase mb-1">
                    {group.label}
                  </span>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent",
                        activeTab === item.id
                          ? `${themeStyles.bg} ${themeStyles.text} font-semibold border-border/10`
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-border/20">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Trocar de conta
              </button>
            </div>
          </aside>

          {/* Sidebar - Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="absolute inset-0 z-50 md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-background/80 backdrop-blur-sm w-full h-full border-none"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Fechar menu"
              />

              <div className="relative w-72 h-full bg-background border-r border-border p-6 flex flex-col gap-8 animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    type="button"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                  {GROUPS.map((group) => (
                    <div key={group.label} className="flex flex-col gap-1.5">
                      <span className="px-2.5 text-[10px] font-bold text-muted-foreground/50 uppercase mb-1">
                        {group.label}
                      </span>
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium",
                            activeTab === item.id
                              ? `${themeStyles.bg} ${themeStyles.text} font-semibold`
                              : "text-muted-foreground",
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>

                <div className="mt-auto pt-4 border-t border-border/20">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Trocar de conta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Área de Conteúdo */}
          <main className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0">
            <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-border/20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-accent"
                  type="button"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  {activeItem && (
                    <div
                      className={cn(
                        "hidden sm:flex w-8 h-8 rounded-xl items-center justify-center",
                        themeStyles.bg,
                      )}
                    >
                      <activeItem.icon
                        className={cn("w-4 h-4", themeStyles.text)}
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h3 className="text-lg md:text-xl font-bold text-foreground">
                      {activeItem?.label}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                  aria-label="Fechar configurações"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
              <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
