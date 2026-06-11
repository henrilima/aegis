"use client";

import {
  Bell,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Layout,
  type LucideIcon,
  MessageSquare,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useSettingsLogic } from "../settings/useSettingsLogic";
import { DashboardClock } from "./components/DashboardClock";

const WEATHER_ICONS: Record<string, LucideIcon> = {
  "Céu limpo": Sun,
  Ensolarado: Sun,
  "Parcialmente nublado": CloudSun,
  Nublado: Cloud,
  Encoberto: Cloud,
  Névoa: CloudFog,
  Neblina: CloudFog,
  Mist: CloudFog,
  "Chuva moderada": CloudRain,
  "Chuva leve": CloudDrizzle,
  "Possibilidade de chuva leve": CloudDrizzle,
  Trovoada: CloudLightning,
  Neve: CloudSnow,
  Pancadas: CloudRain,
};

const CONDITION_TRANSLATIONS: Record<string, string> = {
  clear: "céu limpo",
  sunny: "ensolarado",
  "partly cloudy": "parcialmente nublado",
  cloudy: "nublado",
  overcast: "encoberto",
  mist: "névoa",
  "patchy rain possible": "possibilidade de chuva",
  "patchy snow possible": "possibilidade de neve",
  "patchy sleet possible": "possibilidade de granizo",
  "patchy freezing drizzle possible": "possibilidade de garoa gélida",
  "thundery outbreaks possible": "possibilidade de trovoadas",
  "blowing snow": "neve soprada",
  blizzard: "ventania de neve",
  fog: "neblina",
  "freezing fog": "neblina gélida",
  "patchy light drizzle": "garoa leve pontual",
  "light drizzle": "garoa leve",
  "freezing drizzle": "garoa gélida",
  "heavy freezing drizzle": "garoa gélida forte",
  "patchy light rain": "chuva leve pontual",
  "light rain": "chuva leve",
  "moderate rain at times": "chuva moderada",
  "moderate rain": "chuva moderada",
  "heavy rain at times": "chuva forte",
  "heavy rain": "chuva forte",
  "light freezing rain": "chuva gélida leve",
  "moderate or heavy freezing rain": "chuva gélida forte",
  "light sleet": "granizo leve",
  "moderate or heavy sleet": "granizo forte",
  "patchy light snow": "neve leve pontual",
  "light snow": "neve leve",
  "patchy moderate snow": "neve moderada",
  "moderate snow": "neve moderada",
  "patchy heavy snow": "neve forte pontual",
  "heavy snow": "neve forte",
  "ice pellets": "bolas de gelo",
  "light rain shower": "pancadas de chuva leve",
  "moderate or heavy rain shower": "pancadas de chuva",
  "torrential rain shower": "chuva torrencial",
  "light sleet showers": "pancadas de granizo leve",
  "moderate or heavy sleet showers": "pancadas de granizo",
  "light snow showers": "pancadas de neve leve",
  "moderate or heavy snow showers": "pancadas de neve",
  "light showers of ice pellets": "pancadas de gelo leve",
  "moderate or heavy showers of ice pellets": "pancadas de gelo",
  "patchy light rain with thunder": "chuva leve com trovões",
  "moderate or heavy rain with thunder": "chuva com trovões",
  "patchy light snow with thunder": "neve leve com trovões",
  "moderate or heavy snow with thunder": "neve com trovões",
  "shower in vicinity": "pancadas nas proximidades",
  showers: "pancadas de chuva",
  "irregular chuva nearby": "chuva esparsa nas proximidades",
  "irregular chuva": "chuva esparsa",
  "chuva nearby": "chuva nas proximidades",
};

const KEYWORD_MAP: Record<string, string> = {
  shower: "pancadas",
  rain: "chuva",
  snow: "neve",
  sun: "sol",
  cloud: "nuvens",
  mist: "névoa",
  fog: "neblina",
  vicinity: "proximidades",
  nearby: "nas proximidades",
  light: "leve",
  moderate: "moderada",
  heavy: "forte",
  patchy: "esparsa",
  irregular: "esparsa",
  thund: "trovoada",
  clear: "limpo",
};

interface WeatherData {
  temp: string;
  condition: string;
  location: string;
  icon: LucideIcon;
}

interface DashboardHeaderProps {
  time: Date;
  greeting: string;
  user: User | null;
  doneTodayCount: number;
  positiveHabitsCount: number;
  pendingTasksCount: number;
  onOpenConfig: () => void;
  onStartVisualEdit?: () => void;
  isSimulated?: boolean;
}

export function DashboardHeader({
  time,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingTasksCount,
  onOpenConfig,
  isSimulated = false,
}: DashboardHeaderProps) {
  const { themeStyles: theme, accentColor, appMode } = useTheme();
  const { setSettingsOpen } = useNavigation();
  const { unreadCount } = useNotifications(user?.id);
  const showCustomizeButton = appMode !== "portal";

  const renderGlobalActions = () => {
    if (appMode === "default") return null;

    return (
      <div className="flex items-center justify-end gap-1.5 w-full">
        <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border/40">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-feedback"))}
            className="p-2 rounded-xl hover:bg-accent/50 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            title="Feedback / Reportar bug"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("toggle-notifications-panel"))
            }
            className="relative p-2 rounded-xl hover:bg-accent/50 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            title={
              unreadCount > 0 ? `${unreadCount} notificações` : "Notificações"
            }
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background",
                  theme.solid,
                )}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl hover:bg-accent/50 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  const {
    weatherLocation,
    showWeatherWidget,
    isConfigLoading,
    dashboardClockStyle,
    dashboardClockAnimated,
    dashboardHeaderStyle = "default",
  } = useSettingsLogic();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (isConfigLoading || !showWeatherWidget) return;

    const fetchWeather = async () => {
      try {
        const query = weatherLocation
          ? encodeURIComponent(weatherLocation)
          : "";
        const response = await fetch(
          `https://wttr.in/${query}?format=j1&lang=pt-br`,
        );
        if (!response.ok) return;
        const json = await response.json();

        if (!json.current_condition?.[0] || !json.nearest_area?.[0]) return;

        const current = json.current_condition[0];
        const area = json.nearest_area[0];
        const rawCondition =
          current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "";

        let condition = rawCondition.toLowerCase();

        const translationKey = Object.keys(CONDITION_TRANSLATIONS).find(
          (key: string) => condition.includes(key) || key.includes(condition),
        );

        if (translationKey) {
          condition = CONDITION_TRANSLATIONS[translationKey];
        } else {
          const words = condition.split(" ");
          const translatedWords = words.map((w: string) => {
            const lowerW = w.toLowerCase();
            const key = Object.keys(KEYWORD_MAP).find((k: string) =>
              lowerW.includes(k),
            );
            return KEYWORD_MAP[lowerW] || (key ? KEYWORD_MAP[key] : w);
          });
          if (
            translatedWords.some((w: string, idx: number) => w !== words[idx])
          ) {
            condition = translatedWords.join(" ");
          }
        }

        const Icon =
          WEATHER_ICONS[condition] ||
          WEATHER_ICONS[rawCondition] ||
          WEATHER_ICONS[
            Object.keys(WEATHER_ICONS).find((k: string) =>
              condition.includes(k.toLowerCase()),
            ) as string
          ] ||
          Cloud;

        setWeather({
          temp: `${current.temp_C}°c`,
          condition: condition.toLowerCase(),
          location: area.areaName?.[0]?.value || "Local desconhecido",
          icon: Icon,
        });
      } catch (error) {
        console.error("Weather fetch error:", error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherLocation, showWeatherWidget, isConfigLoading]);

  const hour = time.getHours();
  let greetingText = "Bom dia";

  if (hour >= 12 && hour < 18) {
    greetingText = "Boa tarde";
  } else if (hour >= 18 || hour < 6) {
    greetingText = "Boa noite";
  }

  const rawDate = time.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateStr =
    rawDate.charAt(0).toUpperCase() + rawDate.slice(1).toLowerCase();

  const weatherCond = weather
    ? weather.condition.charAt(0).toUpperCase() +
      weather.condition.slice(1).toLowerCase()
    : "";

  const weatherLocationStr = weather ? weather.location.split(",")[0] : "";

  const showHeaderDate =
    dashboardClockStyle !== "datetime" && dashboardClockStyle !== "semanal";

  const habitsLabel = `${doneTodayCount}/${positiveHabitsCount} Hábitos`;
  const tasksLabel = `${pendingTasksCount} ${
    pendingTasksCount === 1 ? "Tarefa" : "Tarefas"
  }`;

  const simulatedBanner = isSimulated && (
    <div className="flex items-center gap-3 py-2 border-b-2 border-amber-500/20">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span className="text-xs font-bold text-amber-600 dark:text-amber-500">
        Tempo simulado:{" "}
        {time.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })}{" "}
        |{" "}
        {time.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );

  // LAYOUT 1: DEFAULT (Padrão)
  if (dashboardHeaderStyle === "default") {
    return (
      <div className="flex flex-col gap-10 mb-12 w-full animate-in fade-in slide-in-from-top-2 duration-500">
        {renderGlobalActions()}
        {simulatedBanner}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Esquerda: Identidade e Clima */}
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {showHeaderDate && (
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {dateStr}
                  </p>
                )}

                {showWeatherWidget && weather && (
                  <div className="flex items-center gap-3 animate-in fade-in duration-500">
                    {showHeaderDate && (
                      <span className="text-muted-foreground/30 text-[10px]">
                        |
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                      <weather.icon
                        className={cn("w-3.5 h-3.5", theme.text)}
                        strokeWidth={2.5}
                      />
                      <span className="text-xs font-bold text-muted-foreground">
                        {weather.temp.replace("°c", "")}° • {weatherCond} em{" "}
                        {weatherLocationStr}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <h1 className="text-5xl font-black text-foreground leading-tight tracking-tight">
                {greetingText},{" "}
                <span className={cn(theme.text, "font-black")}>
                  {user?.username ?? "Viajante"}
                </span>
                !
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {showCustomizeButton && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all cursor-pointer text-xs font-black",
                    theme.solid,
                    theme.solidHover,
                  )}
                >
                  <Layout className="w-3.5 h-3.5" />
                  Personalizar
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("open-command-palette"))
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border-2 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs font-black"
                title="Buscar módulos (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Módulos</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-accent border border-border text-[9px] font-bold text-muted-foreground select-none ml-1 uppercase">
                  Ctrl K
                </kbd>
              </button>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border-2 border-border">
                <span
                  className={cn(
                    "text-xs font-black",
                    doneTodayCount === positiveHabitsCount &&
                      positiveHabitsCount > 0
                      ? "text-emerald-500"
                      : "text-foreground",
                  )}
                >
                  {habitsLabel}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span
                  className={cn(
                    "text-xs font-black",
                    pendingTasksCount > 0
                      ? "text-orange-500"
                      : "text-foreground",
                  )}
                >
                  {tasksLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Direita: Horário Personalizável */}
          <div className="flex flex-col items-end justify-center lg:self-center animate-in fade-in duration-700">
            <DashboardClock
              time={time}
              style={dashboardClockStyle}
              animated={dashboardClockAnimated}
            />
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT 2: COMPACT (Compacto)
  if (dashboardHeaderStyle === "compact") {
    return (
      <div className="flex flex-col gap-4 mb-8 w-full animate-in fade-in duration-500">
        {renderGlobalActions()}
        {simulatedBanner}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 rounded-3xl bg-card/45 border border-border/40 backdrop-blur-sm">
          {/* Esquerda: Identidade & Clima Compactados */}
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <h1 className="text-2xl font-black text-foreground tracking-tight whitespace-nowrap">
              {greetingText},{" "}
              <span className={cn(theme.text, "font-black")}>
                {user?.username ?? "Viajante"}
              </span>
              !
            </h1>

            {showWeatherWidget && weather && (
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-foreground/5 py-1 px-2.5 rounded-xl border border-border/10">
                <weather.icon
                  className={cn("w-3.5 h-3.5", theme.text)}
                  strokeWidth={2.5}
                />
                <span>
                  {weather.temp.replace("°c", "")}° • {weatherCond}
                </span>
              </div>
            )}

            {showHeaderDate && (
              <span className="hidden md:inline text-xs font-bold text-muted-foreground/60">
                {dateStr}
              </span>
            )}
          </div>

          {/* Direita: Controles e Relógio Compacto */}
          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
            <div className="flex items-center gap-2">
              {showCustomizeButton && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className={cn(
                    "p-2 rounded-xl text-white transition-all cursor-pointer",
                    theme.solid,
                    theme.solidHover,
                  )}
                  title="Personalizar"
                >
                  <Layout className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("open-command-palette"))
                }
                className="flex items-center gap-2 p-2 px-3 rounded-xl border-2 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-card/45 backdrop-blur-sm text-xs font-bold"
                title="Buscar módulos (Ctrl + K)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Módulos</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-accent border border-border text-[9px] font-bold text-muted-foreground select-none ml-1 uppercase">
                  Ctrl K
                </kbd>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border-2 border-border text-[11px] font-black">
                <span
                  className={
                    pendingTasksCount > 0
                      ? "text-orange-500"
                      : "text-foreground"
                  }
                >
                  {tasksLabel}
                </span>
              </div>
            </div>

            <div className="shrink-0 scale-90 sm:scale-95 animate-in fade-in duration-700">
              <DashboardClock
                time={time}
                style={dashboardClockStyle}
                animated={dashboardClockAnimated}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT 3: CENTERED (Focado / Centralizado)
  if (dashboardHeaderStyle === "centered") {
    return (
      <div className="flex flex-col gap-6 mb-12 w-full text-center items-center animate-in fade-in duration-500">
        {renderGlobalActions()}
        {simulatedBanner}

        {/* Relógio Centralizado no Topo - Reduzido elegantemente para scale-75 sm:scale-80 */}
        <div className="mb-4 scale-75 sm:scale-80 origin-center animate-in fade-in duration-700 select-none">
          <DashboardClock
            time={time}
            style={dashboardClockStyle}
            animated={dashboardClockAnimated}
          />
        </div>

        <div className="space-y-2 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight tracking-tight">
            {greetingText},{" "}
            <span className={cn(theme.text, "font-black")}>
              {user?.username ?? "Viajante"}
            </span>
            !
          </h1>

          <div className="flex flex-wrap justify-center items-center gap-2 text-xs font-bold text-muted-foreground">
            {showHeaderDate && <span>{dateStr}</span>}
            {showHeaderDate && showWeatherWidget && weather && (
              <span className="opacity-40">•</span>
            )}
            {showWeatherWidget && weather && (
              <span className="flex items-center gap-1.5">
                <weather.icon
                  className={cn("w-3.5 h-3.5 inline", theme.text)}
                  strokeWidth={2.5}
                />
                {weather.temp.replace("°c", "")}° • {weatherCond} em{" "}
                {weatherLocationStr}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          {showCustomizeButton && (
            <button
              type="button"
              onClick={onOpenConfig}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all cursor-pointer text-xs font-black",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              Personalizar
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("open-command-palette"))
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border-2 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs font-black"
            title="Buscar módulos (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Módulos</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-accent border border-border text-[9px] font-bold text-muted-foreground select-none ml-1 uppercase">
              Ctrl K
            </kbd>
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border-2 border-border text-xs font-black">
            <span>{habitsLabel}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>{tasksLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT 4: MINIMAL (Minimalista)
  if (dashboardHeaderStyle === "minimal") {
    return (
      <div className="flex flex-col gap-6 mb-10 w-full animate-in fade-in duration-500">
        {renderGlobalActions()}
        {simulatedBanner}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            {showHeaderDate && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-75">
                {dateStr}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none">
              {greetingText},{" "}
              <span className={cn(theme.text, "font-black")}>
                {user?.username ?? "Viajante"}
              </span>
              !
            </h1>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {showCustomizeButton && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="p-2.5 rounded-xl border-2 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-card/45 backdrop-blur-sm"
                title="Personalizar Interface"
              >
                <Layout className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-palette"))
              }
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all cursor-pointer bg-card/45 backdrop-blur-sm text-xs font-black"
              title="Buscar módulos (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
              <span>Módulos</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-accent border border-border text-[9px] font-bold text-muted-foreground select-none ml-1 uppercase">
                Ctrl K
              </kbd>
            </button>

            <div className="shrink-0 animate-in fade-in duration-700">
              <DashboardClock
                time={time}
                style={dashboardClockStyle}
                animated={dashboardClockAnimated}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT 5: ACOLHEDOR (Welcoming) - Redesenhado para ser incrivelmente bonito e glassmórfico
  if (dashboardHeaderStyle === "welcoming") {
    return (
      <div className="flex flex-col gap-6 mb-12 w-full animate-in fade-in duration-500">
        {renderGlobalActions()}
        {simulatedBanner}

        {/* Card Hero Glassmórfico Unificado e Elegante */}
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-linear-to-br from-card/75 via-card/45 to-card/10 p-6 sm:p-8 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8 group">
          {/* Aura de Ambiente Dinâmica e Sutil */}
          <div
            className={cn(
              "absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] opacity-10 dark:opacity-15 transition-all duration-700 pointer-events-none",
              accentColor === "blue"
                ? "bg-blue-500"
                : accentColor === "emerald"
                  ? "bg-emerald-500"
                  : accentColor === "teal"
                    ? "bg-teal-500"
                    : accentColor === "violet"
                      ? "bg-violet-500"
                      : accentColor === "orange"
                        ? "bg-orange-500"
                        : "bg-primary",
            )}
          />

          {/* Bloco Esquerdo: Micro-título Moderno, Título e Indicadores Clean de Status Inline */}
          <div className="space-y-5 flex-1 w-full relative z-10 text-left">
            <div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-3 py-1 rounded-full bg-foreground/5 border border-border/10 inline-block mb-3",
                  theme.text,
                )}
              >
                Workspace Aegis
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-none tracking-tight">
                {greetingText},{" "}
                <span className={cn(theme.text, "font-black")}>
                  {user?.username ?? "Viajante"}
                </span>
                !
              </h1>
            </div>

            {/* Barra de Clima e Status Horizontal Contínua */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-muted-foreground/90 border-t border-border/20 pt-4">
              {showHeaderDate && <span>{dateStr}</span>}

              {showHeaderDate && showWeatherWidget && weather && (
                <span className="text-muted-foreground/20 text-[10px] select-none mx-2">
                  |
                </span>
              )}

              {showWeatherWidget && weather && (
                <div className="flex items-center gap-2">
                  <weather.icon
                    className={cn("w-3.5 h-3.5", theme.text)}
                    strokeWidth={2.5}
                  />
                  <span>
                    {weather.temp.replace("°c", "")}° • {weatherCond} em{" "}
                    {weatherLocationStr}
                  </span>
                </div>
              )}

              {(showHeaderDate || (showWeatherWidget && weather)) && (
                <span className="text-muted-foreground/20 text-[10px] select-none mx-2">
                  |
                </span>
              )}

              <div className="flex items-center gap-2">
                <Layout className={cn("w-3.5 h-3.5", theme.text)} />
                <span>
                  {habitsLabel.toLowerCase()} e {tasksLabel.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {showCustomizeButton && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs font-bold",
                    theme.solid,
                    theme.solidHover,
                  )}
                >
                  <Layout className="w-3.5 h-3.5" />
                  Personalizar Dashboard
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("open-command-palette"))
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 border border-border/40 hover:border-foreground/20 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs font-bold"
                title="Buscar módulos (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Módulos</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-accent/40 border border-border/20 text-[9px] font-bold text-muted-foreground select-none ml-1 uppercase">
                  Ctrl K
                </kbd>
              </button>
            </div>
          </div>

          {/* Bloco Direito: Relógio de Vidro Flutuante com Micro-brilho */}
          <div className="shrink-0 relative z-10 scale-90 sm:scale-95">
            <div className="p-5 rounded-2xl bg-card/25 border border-border/20 backdrop-blur-md">
              <DashboardClock
                time={time}
                style={dashboardClockStyle}
                animated={dashboardClockAnimated}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RETORNO DE SEGURANÇA (Caso o estilo do cabeçalho do dashboard não esteja definido, o padrão é retornado)
  return null;
}
