"use client";

import {
  Bell,
  Code2,
  Database,
  FileAudio,
  HardDriveDownload,
  HeartPulse,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  Palette,
  Puzzle,
  ShieldCheck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { AboutTab } from "../modules/settings/aboutTab";
import { AutomationsTab } from "../modules/settings/automationsTab";
import { BackupTab } from "../modules/settings/backupTab";
import { DangerTab } from "../modules/settings/dangerTab";
import { DataTab } from "../modules/settings/dataTab";
import { DeveloperTab } from "../modules/settings/developerTab";
import { IntegrationsTab } from "../modules/settings/integrationsTab";
import { MediaTab } from "../modules/settings/mediaTab";
import { ModulesTab } from "../modules/settings/modulesTab";
import { NotificationsTab } from "../modules/settings/notificationsTab";
import { ProfileTab } from "../modules/settings/profileTab";
import { SecurityTab } from "../modules/settings/securityTab";
import { SystemHealthTab } from "../modules/settings/systemHealthTab";
import { SystemTab } from "../modules/settings/systemTab";
import { ThemesTab } from "../modules/settings/themesTab";
import { useSettingsLogic } from "../modules/settings/useSettingsLogic";

// ─── Estrutura das seções principais ─────────────────────────────────────────

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "account",
    label: "Conta",
    icon: User,
    description: "Perfil, segurança, dados e backups da sua conta.",
  },
  {
    id: "personalization",
    label: "Personalização",
    icon: Palette,
    description: "Aparência, temas, cores e arquivos de mídia.",
  },
  {
    id: "system",
    label: "Sistema",
    icon: Monitor,
    description: "Geral, módulos, notificações e automações.",
  },
  {
    id: "integrations",
    label: "Integrações",
    icon: Puzzle,
    description: "Conecte serviços externos, vocabulário e atalhos de texto.",
  },
  {
    id: "developer",
    label: "Desenvolvedor",
    icon: Code2,
    description: "Ferramentas avançadas de diagnóstico e comandos internos.",
  },
  {
    id: "about",
    label: "Sobre & Mais",
    icon: Info,
    description: "Informações do sistema, feedback e zona de perigo.",
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen } = useNavigation();
  const { themeStyles } = useTheme();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState("account");
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
    showLevelUpModal,
    user,
  } = useSettingsLogic();

  useEffect(() => {
    const handleOpenTelemetry = () => setActiveSection("developer");
    window.addEventListener("open-telemetry", handleOpenTelemetry);
    return () =>
      window.removeEventListener("open-telemetry", handleOpenTelemetry);
  }, []);

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      // ─── Conta ────────────────────────────────────────────────────────────
      case "account":
        return (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="profile" className="text-xs">
                <User className="w-3.5 h-3.5" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs">
                <Database className="w-3.5 h-3.5" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="backup" className="text-xs">
                <HardDriveDownload className="w-3.5 h-3.5" />
                Backup
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <ProfileTab username={username} email={email} />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="data">
              <DataTab />
            </TabsContent>
            <TabsContent value="backup">
              <BackupTab />
            </TabsContent>
          </Tabs>
        );

      // ─── Personalização ───────────────────────────────────────────────────
      case "personalization":
        return (
          <Tabs defaultValue="themes" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="themes" className="text-xs">
                <Palette className="w-3.5 h-3.5" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <FileAudio className="w-3.5 h-3.5" />
                Mídias
              </TabsTrigger>
            </TabsList>
            <TabsContent value="themes">
              <ThemesTab />
            </TabsContent>
            <TabsContent value="media">
              <MediaTab />
            </TabsContent>
          </Tabs>
        );

      // ─── Sistema ──────────────────────────────────────────────────────────
      case "system":
        return (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="general" className="text-xs">
                <Monitor className="w-3.5 h-3.5" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="modules" className="text-xs">
                <LayoutGrid className="w-3.5 h-3.5" />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs">
                <Bell className="w-3.5 h-3.5" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="automations" className="text-xs">
                <Monitor className="w-3.5 h-3.5" />
                Automações
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <SystemTab />
            </TabsContent>
            <TabsContent value="modules">
              <ModulesTab />
            </TabsContent>
            <TabsContent value="notifications">
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
                showLevelUpModal={showLevelUpModal}
              />
            </TabsContent>
            <TabsContent value="automations">
              <AutomationsTab />
            </TabsContent>
          </Tabs>
        );

      // ─── Integrações ──────────────────────────────────────────────────────
      case "integrations":
        return <IntegrationsTab />;

      // ─── Desenvolvedor ────────────────────────────────────────────────────
      case "developer":
        return (
          <Tabs defaultValue="console" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="console" className="text-xs">
                <Code2 className="w-3.5 h-3.5" />
                Área restrita
              </TabsTrigger>
              <TabsTrigger value="health" className="text-xs">
                <HeartPulse className="w-3.5 h-3.5" />
                Saúde do sistema
              </TabsTrigger>
            </TabsList>
            <TabsContent value="console">
              <DeveloperTab handleInternalCommand={handleInternalCommand} />
            </TabsContent>
            <TabsContent value="health">
              <SystemHealthTab />
            </TabsContent>
          </Tabs>
        );

      // ─── Sobre & Mais ─────────────────────────────────────────────────────
      case "about":
        return (
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="about" className="text-xs">
                <Info className="w-3.5 h-3.5" />
                Sobre o Aegis
              </TabsTrigger>
              <TabsTrigger value="danger" className="text-xs">
                <Trash2 className="w-3.5 h-3.5" />
                Zona de perigo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about">
              <AboutTab />
            </TabsContent>
            <TabsContent value="danger">
              <DangerTab
                username={username}
                masterCodeIndex={user?.masterCodeIndex ?? 0}
                onDeleteAccount={handleDeleteAccount}
              />
            </TabsContent>
          </Tabs>
        );

      default:
        return null;
    }
  };

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
              "w-64 bg-accent/30 border-r border-border/40 flex-col p-6 gap-8 hidden md:flex",
            )}
          >
            <div className="px-2 flex items-center gap-2">
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

            <nav className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar pr-1">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent text-left",
                    activeSection === item.id
                      ? `${themeStyles.bg} ${themeStyles.text} font-semibold border-border/10`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
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

              <div className="relative w-64 h-full bg-background border-r border-border p-6 flex flex-col gap-6 animate-in slide-in-from-left duration-300">
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
                <nav className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                  {SIDEBAR_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                        activeSection === item.id
                          ? `${themeStyles.bg} ${themeStyles.text} font-semibold`
                          : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
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
            {/* Cabeçalho da seção ativa */}
            <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border/20 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-accent"
                  type="button"
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {activeItem && (
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                        activeSection === "developer" ||
                          activeSection === "about"
                          ? "bg-red-500/10"
                          : themeStyles.bg,
                      )}
                    >
                      <activeItem.icon
                        className={cn(
                          "w-5 h-5",
                          activeSection === "developer" ||
                            activeSection === "about"
                            ? "text-red-500"
                            : themeStyles.text,
                        )}
                      />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                        {activeItem.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-normal hidden sm:block">
                        {activeItem.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                aria-label="Fechar configurações"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              <div
                key={activeSection}
                className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
