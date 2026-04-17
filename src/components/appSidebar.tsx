"use client";

import {
  Activity,
  Banknote,
  BarChart3,
  Bell,
  Book,
  BookOpen,
  CalendarDays,
  Droplet,
  FileText,
  Home,
  ListTodo,
  Lock,
  LogOut,
  Moon,
  PanelLeftClose,
  Settings,
  Shield,
  Timer,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn, getColorTheme } from "@/lib/utils";
import { NotificationsPanel } from "./NotificationsPanel";

const NAV_GROUPS = [
  {
    label: null,
    compact: false,
    items: [
      {
        title: "Início",
        route: "dashboard" as AppRoute,
        icon: Home,
        color: "primary",
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
        color: "amber",
      },
      {
        title: "Tarefas",
        route: "tasks" as AppRoute,
        icon: ListTodo,
        color: "red",
      },
      {
        title: "Calendário",
        route: "calendar" as AppRoute,
        icon: CalendarDays,
        color: "green",
      },
      {
        title: "Anotações",
        route: "notes" as AppRoute,
        icon: FileText,
        color: "orange",
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
        color: "teal",
      },
      {
        title: "Pomodoro",
        route: "pomodoro" as AppRoute,
        icon: Timer,
        color: "red",
      },
      {
        title: "Estudos",
        route: "studies" as AppRoute,
        icon: BookOpen,
        color: "violet",
      },
    ],
  },
  {
    label: "Bem-estar",
    compact: false,
    items: [
      { title: "Sono", route: "sleep" as AppRoute, icon: Moon, color: "blue" },
      {
        title: "Hidratação",
        route: "hydration" as AppRoute,
        icon: Droplet,
        color: "blue",
      },
      {
        title: "Leitura",
        route: "reading" as AppRoute,
        icon: Book,
        color: "orange",
      },
    ],
  },
  {
    label: "Utilitários",
    compact: true,
    items: [
      {
        title: "Estatísticas",
        route: "statistics" as AppRoute,
        icon: BarChart3,
        color: "red",
      },
      {
        title: "Conversor",
        route: "currency" as AppRoute,
        icon: Banknote,
        color: "green",
      },
      {
        title: "Rede",
        route: "speedtest" as AppRoute,
        icon: Wifi,
        color: "blue",
      },
    ],
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AppSidebar({ isOpen, setIsOpen }: AppSidebarProps) {
  const { themeStyles } = useTheme();
  const { route, navigate } = useNavigation();
  const { user, logout } = useAuth();

  const isActive = (r: AppRoute) => route === r;

  const [mounted, setMounted] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    clearRead,
  } = useNotifications(user?.id);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") setIsOpen(!isOpen);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-full w-72 flex-col bg-background border-r border-border/70 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* usuário + ações */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/70">
          {/* Avatar */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${themeStyles.bg} border ${themeStyles.border} ${themeStyles.text}`}
          >
            {(user?.username?.[0] ?? "A").toUpperCase()}
          </div>

          {/* Info do usuário */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-none">
              {user?.username ?? "Usuário"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {user?.email ?? ""}
            </p>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-0.5 shrink-0">
            <ToolTip content="Notificações">
              <button
                type="button"
                onClick={() => setShowNotifPanel(true)}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  mounted && isActive("settings")
                    ? `${themeStyles.text} ${themeStyles.bg}`
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${themeStyles.solid} text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </ToolTip>

            <ToolTip content="Configurações">
              <button
                type="button"
                onClick={() => navigate("settings")}
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  mounted && isActive("settings")
                    ? `${themeStyles.text} ${themeStyles.bg}`
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </ToolTip>

            <ToolTip content="Recolher (Ctrl+B)">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${themeStyles.text} ${themeStyles.bgHover}`}
              >
                <PanelLeftClose className="w-[18px] h-[18px]" />
              </button>
            </ToolTip>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? "top"} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="px-2 mb-1.5 text-[9px] font-semibold text-muted-foreground">
                  {group.label}
                </p>
              )}

              {/* Grade compacta */}
              {group.compact ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {group.items.map((item) => {
                    const active = mounted && isActive(item.route);
                    const itemColor =
                      item.color === "primary"
                        ? (themeStyles.name as string)
                        : item.color;
                    const itemTheme = getColorTheme(itemColor);
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => navigate(item.route)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-medium transition-all duration-200 cursor-pointer border",
                          active
                            ? `${itemTheme.active} ${itemTheme.text} ${itemTheme.border.replace("/20", "/30")}`
                            : "text-muted-foreground border-transparent hover:text-muted-foreground hover:bg-accent/50/50",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors duration-200",
                            active ? itemTheme.text : "text-neutral-600",
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
                /* Lista padrão */
                group.items.map((item) => {
                  const active = mounted && isActive(item.route);
                  const itemColor =
                    item.color === "primary"
                      ? (themeStyles.name as string)
                      : item.color;
                  const itemTheme = getColorTheme(itemColor);

                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className={cn(
                        "relative flex items-center w-full text-left gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group cursor-pointer border",
                        active
                          ? `${itemTheme.active} ${itemTheme.text} ${itemTheme.border.replace("/20", "/30")}`
                          : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50/40",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors duration-200",
                          active
                            ? itemTheme.text
                            : "text-neutral-600 group-hover:text-muted-foreground",
                        )}
                        strokeWidth={active ? 2.5 : 2}
                      />

                      {/* Ghost bold para evitar layout shift */}
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

                      {/* Pill indicador */}
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

        {/* identidade do app */}
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
              Aegis — Proteção Local
            </span>
          </div>

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
      </aside>

      {/* Painel de Notificações */}
      <NotificationsPanel
        notifications={notifications}
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
