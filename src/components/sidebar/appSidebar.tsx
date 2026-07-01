"use client";

import { motion } from "framer-motion";
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
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProgressState } from "@/components/modules/achievements/types";
import type { AppConfig } from "@/components/modules/settings/useSettingsLogic";
import { AvatarRankWrapper } from "@/components/ui/AvatarRankWrapper";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useUpdate } from "@/hooks/useUpdate";
import { cn, formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

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
        title: "Flashcards",
        route: "flashcards" as AppRoute,
        icon: BookOpen,
      },
      {
        title: "Filmes",
        route: "movies" as AppRoute,
        icon: Film,
      },
    ],
  },
  {
    label: "Rotina & Bem-estar",
    compact: false,
    items: [
      {
        title: "Hábitos",
        route: "habits" as AppRoute,
        icon: Activity,
      },
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
        title: "Conquistas",
        route: "achievements" as AppRoute,
        icon: Trophy,
      },
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

  const [level, setLevel] = useState<number>(1);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [showSidebarRankBorder, setShowSidebarRankBorder] = useState(true);

  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadRankAndConfig = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const now = new Date();
        const todayStr = formatDateLocal(now);
        const threeDaysAgo = new Date(now);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = formatDateLocal(threeDaysAgo);

        const progressState = await invoke<UserProgressState>(
          "achievements_get_user_state",
          {
            userId: user.id,
            today: todayStr,
            threeDaysAgo: threeDaysAgoStr,
          },
        );
        if (progressState && typeof progressState.level === "number") {
          if (
            prevLevelRef.current !== null &&
            progressState.level > prevLevelRef.current
          ) {
            window.dispatchEvent(
              new CustomEvent("aegis-level-up", {
                detail: { level: progressState.level },
              }),
            );
            const win = window as unknown as {
              aegisTriggerLevelUp?: (lvl: number) => void;
            };
            if (typeof window !== "undefined" && win.aegisTriggerLevelUp) {
              win.aegisTriggerLevelUp(progressState.level);
            }
          }
          prevLevelRef.current = progressState.level;
          setLevel(progressState.level);
        }

        const config = await invoke<AppConfig>("global_get_app_config");
        if (config && typeof config.selectedRankTitle === "string") {
          setSelectedTitle(config.selectedRankTitle);
        }
        if (config && typeof config.showSidebarRankBorder === "boolean") {
          setShowSidebarRankBorder(config.showSidebarRankBorder);
        }
      } catch (err) {
        console.error("Erro ao carregar nível/título da sidebar:", err);
      }
    };

    loadRankAndConfig();

    window.addEventListener("aegis-achievements-refresh", loadRankAndConfig);
    window.addEventListener("aegis-config-changed", loadRankAndConfig);

    return () => {
      window.removeEventListener(
        "aegis-achievements-refresh",
        loadRankAndConfig,
      );
      window.removeEventListener("aegis-config-changed", loadRankAndConfig);
    };
  }, [user?.id]);

  const handleToggle = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  const isActive = (r: AppRoute) => route === r;

  const [mounted, setMounted] = useState(false);
  const [_clickCount, setClickCount] = useState(0);

  const handleVersionClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next === 5) {
        import("@tauri-apps/api/core").then(({ invoke }) => {
          invoke<[boolean, number, number, number]>("achievements_unlock", {
            userId: user?.id || "",
            achievementId: "easter_egg_version",
            xpAward: 150,
            unlockedAt: new Date().toISOString(),
          })
            .then((res) => {
              const unlocked = res[0];
              if (unlocked) {
                toast.success(
                  "Conquista Desbloqueada: Curioso das Versões! (+150 XP)",
                  {
                    description:
                      "Você clicou 5 vezes seguidas na versão do app!",
                    icon: "🏆",
                    duration: 5000,
                  },
                );
                window.dispatchEvent(new Event("aegis-achievements-refresh"));
              }
            })
            .catch(console.error);
        });
        return 0;
      }
      return next;
    });
  };

  const { avatarSrc } = useAvatar(user?.id);

  const { unreadCount } = useNotifications(user?.id);

  const { updateAvailable } = useUpdate();

  useEffect(() => {
    setMounted(true);
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
    <aside
      inert={!isOpen || undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full w-72 flex-col bg-sidebar border-r border-sidebar-border backdrop-blur-md transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <SidebarTrigger isOpen={isOpen} onToggle={handleToggle} />
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <AvatarRankWrapper
          level={level}
          rounded="xl"
          size="sm"
          badgePosition="bottom-right"
          showBorder={showSidebarRankBorder}
          className="shrink-0"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold overflow-hidden ${themeStyles.bg} ${themeStyles.text}`}
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
        </AvatarRankWrapper>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-none">
            {user?.username ?? "Usuário"}
          </p>
          {selectedTitle &&
          selectedTitle !== "Sem Título" &&
          selectedTitle !== "Sem título" ? (
            <p className="text-[11px] font-semibold text-primary truncate mt-0.5">
              {selectedTitle}
            </p>
          ) : user?.email ? (
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
              onClick={() =>
                window.dispatchEvent(new Event("open-notifications"))
              }
              className={cn(
                "relative p-1.5 rounded-lg transition-all cursor-pointer",
                "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
                      onClick={() => {
                        navigate(item.route);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("sidebar-navigate", {
                              detail: item.route,
                            }),
                          );
                        }
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-medium transition-colors duration-200 group cursor-pointer border select-none focus:outline-none z-10",
                        active
                          ? cn(itemTheme.text, "border-transparent")
                          : cn(
                              "text-muted-foreground border-transparent hover:text-foreground",
                              itemTheme.bgHover,
                            ),
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeSidebarItemCompact"
                          className={cn(
                            "absolute inset-0 rounded-xl -z-10 border",
                            itemTheme.active,
                            itemTheme.border.replace("/20", "/30"),
                          )}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 28,
                          }}
                        />
                      )}
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
                    onClick={() => {
                      navigate(item.route);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("sidebar-navigate", {
                            detail: item.route,
                          }),
                        );
                      }
                    }}
                    className={cn(
                      "relative flex items-center w-full text-left gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors duration-200 group cursor-pointer border select-none focus:outline-none z-10",
                      active
                        ? cn(itemTheme.text, "border-transparent")
                        : cn(
                            "text-muted-foreground border-transparent hover:text-foreground",
                            itemTheme.bgHover,
                          ),
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeSidebarItem"
                        className={cn(
                          "absolute inset-0 rounded-xl -z-10 border",
                          itemTheme.active,
                          itemTheme.border.replace("/20", "/30"),
                        )}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 28,
                        }}
                      />
                    )}
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

      <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${themeStyles.bg} border ${themeStyles.border}`}
          >
            <Shield
              className={`w-3.5 h-3.5 ${themeStyles.text}`}
              strokeWidth={2.5}
            />
          </div>
          <button
            type="button"
            onClick={handleVersionClick}
            className="text-[11px] text-neutral-600 font-medium cursor-pointer select-none hover:text-foreground transition-colors bg-transparent border-none p-0 m-0"
          >
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
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ToolTip content="Feedback / Reportar Bug">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-feedback"))}
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
  );
}
