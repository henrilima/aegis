"use client";

import {
  Activity,
  AlarmClock,
  ArrowUpCircle,
  BarChart3,
  Bell,
  Book,
  BookOpen,
  CalendarDays,
  FileText,
  Film,
  Home,
  ListTodo,
  Lock,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useUpdate } from "@/hooks/useUpdate";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { FeedbackDialog } from "../global/FeedbackDialog";
import { NotificationsPanel } from "../NotificationsPanel";

export const NAV_GROUPS = [
  {
    label: null,
    compact: false,
    items: [
      {
        title: "Início",
        route: "dashboard" as AppRoute,
        icon: Home,
      },
    ],
  },
  {
    label: "Organização",
    compact: false,
    items: [
      {
        title: "Senhas & Cofre",
        route: "passwords" as AppRoute,
        icon: Lock,
      },
      {
        title: "Tarefas",
        route: "tasks" as AppRoute,
        icon: ListTodo,
      },
      {
        title: "Calendário",
        route: "calendar" as AppRoute,
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Conhecimento",
    compact: false,
    items: [
      {
        title: "Anotações",
        route: "notes" as AppRoute,
        icon: FileText,
      },
      {
        title: "Estudos",
        route: "studies" as AppRoute,
        icon: BookOpen,
      },
      {
        title: "Leitura",
        route: "reading" as AppRoute,
        icon: Book,
      },
      {
        title: "Dicionário",
        route: "dictionary" as AppRoute,
        icon: Book,
      },
      {
        title: "Filmes",
        route: "movies" as AppRoute,
        icon: Film,
      },
    ],
  },
  {
    label: "Performance",
    compact: false,
    items: [
      {
        title: "Hábitos",
        route: "habits" as AppRoute,
        icon: Activity,
      },
      {
        title: "Pomodoro",
        route: "pomodoro" as AppRoute,
        icon: Timer,
      },
    ],
  },
  {
    label: "Bem-estar",
    compact: false,
    items: [
      { title: "Sono", route: "sleep" as AppRoute, icon: Moon },
      {
        title: "Alarmes",
        route: "alarms" as AppRoute,
        icon: AlarmClock,
      },
    ],
  },
  {
    label: "Utilitários",
    compact: false,
    items: [
      {
        title: "Estatísticas",
        route: "statistics" as AppRoute,
        icon: BarChart3,
      },
    ],
  },
];

const NAV_GROUPS_WITH_THEMES = NAV_GROUPS.map((group) => ({
  ...group,
  items: group.items.map((item) => ({
    ...item,
    precomputedTheme:
      item.route !== "dashboard"
        ? getColorTheme(getModuleColor(item.route))
        : null,
  })),
}));

import { SidebarTrigger } from "./SidebarTrigger";

interface AppSidebarProps {
  isOpen: boolean;
}

export function AppSidebar({ isOpen }: AppSidebarProps) {
  const { themeStyles } = useTheme();
  const { route, navigate, isSettingsOpen, setSettingsOpen } = useNavigation();
  const { user, logout } = useAuth();
  const { isModuleEnabled } = useModules();

  const handleToggle = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  const isActive = (r: AppRoute) => route === r;

  const [mounted, setMounted] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const { avatarSrc } = useAvatar(user?.id);

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    clearRead,
  } = useNotifications(user?.id);

  const { updateAvailable } = useUpdate();

  useEffect(() => {
    setMounted(true);
    const togglePanel = () => setShowNotifPanel((prev) => !prev);
    window.addEventListener("toggle-notifications-panel", togglePanel);
    return () => {
      window.removeEventListener("toggle-notifications-panel", togglePanel);
    };
  }, []);

  const primaryTheme = useMemo(
    () => getColorTheme(themeStyles.name as string),
    [themeStyles.name],
  );

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS_WITH_THEMES.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.route === "dashboard" || isModuleEnabled(item.route as ModuleId),
      ),
    })).filter((group) => group.items.length > 0);
  }, [isModuleEnabled]);

  return (
    <>
      <aside
        inert={!isOpen || undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-full w-72 flex-col bg-background border-r border-border/70 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarTrigger isOpen={isOpen} onToggle={handleToggle} />
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/70">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold overflow-hidden ${themeStyles.bg} border ${themeStyles.border} ${themeStyles.text}`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Foto de perfil"
                width={36}
                height={36}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              (user?.username?.[0] ?? "A").toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-none">
              {user?.username ?? "Usuário"}
            </p>
            {user?.email ? (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5 italic">
                Sem e-mail
              </p>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <ToolTip
              content={
                unreadCount > 0
                  ? `${unreadCount} notificações não lidas`
                  : updateAvailable
                    ? "Atualização Disponível!"
                    : "Notificações"
              }
            >
              <button
                type="button"
                aria-label="Abrir notificações"
                onClick={() => setShowNotifPanel(true)}
                className={cn(
                  "relative p-1.5 rounded-lg transition-all cursor-pointer",
                  showNotifPanel
                    ? `${themeStyles.text} ${themeStyles.bg}`
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 ? (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${themeStyles.solid} text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none border-2 border-background`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : (
                  updateAvailable && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${themeStyles.solid} text-white rounded-full border-2 border-background flex items-center justify-center`}
                    >
                      <ArrowUpCircle className="w-2 h-2" />
                    </span>
                  )
                )}
              </button>
            </ToolTip>

            <ToolTip content="Configurações">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className={cn(
                  "relative p-1.5 rounded-lg transition-all cursor-pointer",
                  isSettingsOpen
                    ? `${themeStyles.text} ${themeStyles.bg}`
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </ToolTip>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 custom-scrollbar">
          {visibleGroups.map((group) => (
            <div key={group.label ?? "top"} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="px-2 mb-1.5 text-[9px] font-semibold text-muted-foreground">
                  {group.label}
                </p>
              )}

              {group.compact ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {group.items.map((item) => {
                    const active = mounted && isActive(item.route);
                    const itemTheme = item.precomputedTheme ?? primaryTheme;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => navigate(item.route)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-medium transition-all duration-200 group cursor-pointer border",
                          active
                            ? `${itemTheme.active} ${itemTheme.text} ${itemTheme.border.replace("/20", "/30")}`
                            : cn(
                                "text-muted-foreground border-transparent hover:text-foreground",
                                itemTheme.bgHover,
                              ),
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors duration-200",
                            active
                              ? itemTheme.text
                              : "text-neutral-600 group-hover:text-foreground",
                          )}
                          strokeWidth={active ? 2.5 : 2}
                        />
                        <span className="truncate w-full text-center leading-tight">
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                group.items.map((item) => {
                  const active = mounted && isActive(item.route);
                  const itemTheme = item.precomputedTheme ?? primaryTheme;

                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className={cn(
                        "relative flex items-center w-full text-left gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group cursor-pointer border",
                        active
                          ? `${itemTheme.active} ${itemTheme.text} ${itemTheme.border.replace("/20", "/30")}`
                          : cn(
                              "text-muted-foreground border-transparent hover:text-foreground",
                              itemTheme.bgHover,
                            ),
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors duration-200",
                          active
                            ? itemTheme.text
                            : "text-neutral-600 group-hover:text-foreground",
                        )}
                        strokeWidth={active ? 2.5 : 2}
                      />

                      <span className="relative flex-1 truncate">
                        <span className="invisible font-semibold text-[13px]">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "absolute inset-0 truncate",
                            active ? "font-semibold" : "font-medium",
                          )}
                        >
                          {item.title}
                        </span>
                      </span>

                      <span
                        className={cn(
                          "ml-auto w-1 rounded-full transition-all duration-300",
                          active
                            ? `h-4 ${itemTheme.solid}`
                            : "h-0 bg-transparent",
                        )}
                      />
                    </button>
                  );
                })
              )}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${themeStyles.bg} border ${themeStyles.border}`}
            >
              <Shield
                className={`w-3.5 h-3.5 ${themeStyles.text}`}
                strokeWidth={2.5}
              />
            </div>
            <span className="text-[11px] text-neutral-600 font-medium">
              {updateAvailable ? (
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${themeStyles.border} ${themeStyles.bg} bg-opacity-50`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${themeStyles.solid} opacity-80`}
                  />
                  <span
                    className={`text-[10px] font-bold ${themeStyles.text} opacity-90`}
                  >
                    Nova versão disponível!
                  </span>
                </div>
              ) : (
                "Aegis - Proteção Local"
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ToolTip content="Feedback / Reportar Bug">
              <button
                type="button"
                onClick={() => setShowFeedbackDialog(true)}
                className={cn(
                  "p-1.5 rounded-lg text-muted-foreground transition-all cursor-pointer",
                  "hover:text-foreground hover:bg-accent/50",
                )}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </ToolTip>

            <ToolTip content="Sair">
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>
      </aside>

      <FeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
      />

      <NotificationsPanel
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={showNotifPanel}
        onClose={() => setShowNotifPanel(false)}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDelete={remove}
        onClearRead={clearRead}
      />
    </>
  );
}
