"use client";

import {
  Activity,
  Banknote,
  BarChart3,
  BookOpen,
  CalendarDays,
  Droplet,
  FileText,
  Home,
  Lock,
  LogOut,
  Moon,
  Settings,
  Shield,
  Timer,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      {
        title: "Dashboard",
        route: "dashboard" as AppRoute,
        icon: Home,
        color: "amber",
      },
    ],
  },
  {
    label: "Segurança",
    items: [
      {
        title: "Senhas",
        route: "passwords" as AppRoute,
        icon: Lock,
        color: "amber",
      },
    ],
  },
  {
    label: "Produtividade",
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
        title: "Notas",
        route: "notes" as AppRoute,
        icon: FileText,
        color: "orange",
      },
    ],
  },
  {
    label: "Saúde & Estudos",
    items: [
      {
        title: "Estudos",
        route: "studies" as AppRoute,
        icon: BookOpen,
        color: "violet",
      },
      {
        title: "Sono",
        route: "sleep" as AppRoute,
        icon: Moon,
        color: "blue",
      },
    ],
  },
  {
    label: "Planejamento",
    items: [
      {
        title: "Calendário",
        route: "calendar" as AppRoute,
        icon: CalendarDays,
        color: "green",
      },
      {
        title: "Estatísticas",
        route: "statistics" as AppRoute,
        icon: BarChart3,
        color: "red",
      },
    ],
  },
  {
    label: "Utilidades",
    items: [
      {
        title: "Câmbio",
        route: "currency" as AppRoute,
        icon: Banknote,
        color: "green",
      },
      {
        title: "Internet",
        route: "speedtest" as AppRoute,
        icon: Wifi,
        color: "red",
      },
      {
        title: "Hidratação",
        route: "hydration" as AppRoute,
        icon: Droplet,
        color: "blue",
      },
    ],
  },
];
import { APP_CONFIG } from "@/app.config";

interface AppSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AppSidebar({ isOpen, setIsOpen }: AppSidebarProps) {
  const { route, navigate } = useNavigation();
  const { user, logout } = useAuth();

  const isActive = (r: AppRoute) => route === r;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col bg-neutral-950 border-r border-neutral-800/70 transition-all duration-300 ease-in-out",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-2.5 px-4 py-5 border-b border-neutral-800/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/20">
            <Shield className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black">{APP_CONFIG.name}</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          type="button"
          className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-200 hover:bg-neutral-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-auto px-3 py-4 text-nowrap">
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "top"} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-2 mb-1 text-[9px] font-black uppercase  text-neutral-600">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = mounted && isActive(item.route);
              const colorClass = item.color;

              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className={cn(
                    "flex items-center w-full text-left gap-2.5 px-2.5 py-2 rounded-xl  font-medium transition-all group cursor-pointer",
                    active
                      ? {
                          "bg-amber-500/12 text-amber-500 font-semibold":
                            colorClass === "amber",
                          "bg-teal-500/12 text-teal-400 font-semibold":
                            colorClass === "teal",
                          "bg-red-500/12 text-red-400 font-semibold":
                            colorClass === "red",
                          "bg-orange-500/12 text-orange-400 font-semibold":
                            colorClass === "orange",
                          "bg-green-500/12 text-green-400 font-semibold":
                            colorClass === "green",
                          "bg-blue-500/12 text-blue-400 font-semibold":
                            colorClass === "blue",
                          "bg-violet-500/12 text-violet-400 font-semibold":
                            colorClass === "violet",
                        }
                      : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/70",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active
                        ? {
                            "text-amber-500": colorClass === "amber",
                            "text-teal-400": colorClass === "teal",
                            "text-red-400": colorClass === "red",
                            "text-orange-400": colorClass === "orange",
                            "text-green-400": colorClass === "green",
                            "text-blue-400": colorClass === "blue",
                            "text-violet-400": colorClass === "violet",
                          }
                        : "text-neutral-600 group-hover:text-neutral-400",
                    )}
                  />
                  {item.title}
                  {active && (
                    <span
                      className={cn(
                        "ml-auto w-1.5 h-1.5 rounded-full shrink-0",
                        {
                          "bg-amber-500": colorClass === "amber",
                          "bg-teal-400": colorClass === "teal",
                          "bg-red-400": colorClass === "red",
                          "bg-orange-400": colorClass === "orange",
                          "bg-green-400": colorClass === "green",
                          "bg-blue-400": colorClass === "blue",
                          "bg-violet-400": colorClass === "violet",
                        },
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-neutral-800/70 px-3 py-3 space-y-1">
        <button
          type="button"
          onClick={() => navigate("settings")}
          className={cn(
            "flex items-center w-full text-left gap-2.5 px-2.5 py-2 rounded-xl  font-medium transition-all cursor-pointer",
            mounted && isActive("settings")
              ? "bg-amber-500/12 text-amber-500 font-semibold"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/70",
          )}
        >
          <Settings className="w-4 h-4 shrink-0 text-neutral-600" />
          Configurações
        </button>

        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 mt-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase">
            {user?.username?.[0] ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-none">
              {user?.username ?? "Usuário"}
            </p>
            <p className="text-[10px] text-neutral-600 truncate mt-0.5">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
