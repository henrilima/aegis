"use client";
// Build trigger: Weather integration direct in header

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Layout,
  Loader2,
  type LucideIcon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useSettingsLogic } from "../settings/useSettingsLogic";

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
  isSimulated?: boolean;
}

export function DashboardHeader({
  time,
  greeting,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingTasksCount,
  onOpenConfig,
  isSimulated = false,
}: DashboardHeaderProps) {
  const { themeStyles: theme } = useTheme();
  const { weatherLocation, showWeatherWidget, isConfigLoading } =
    useSettingsLogic();
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

        // Robust translation logic
        let condition = rawCondition.toLowerCase();

        // Try exact match or partial match from the dictionary
        const translationKey = Object.keys(CONDITION_TRANSLATIONS).find(
          (key: string) => condition.includes(key) || key.includes(condition),
        );

        if (translationKey) {
          condition = CONDITION_TRANSLATIONS[translationKey];
        } else {
          // Final word-by-word fallback
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

        // Get Icon using either translated or raw description
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

  return (
    <div className="flex flex-col gap-10 mb-12 w-full animate-in fade-in slide-in-from-top-2 duration-500">
      {isSimulated && (
        <div className="flex items-center gap-3 py-2 border-b-2 border-amber-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500 lowercase">
            tempo simulado:{" "}
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
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        {/* Esquerda: Identidade e Clima */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs font-bold text-muted-foreground lowercase">
                {time.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {showWeatherWidget && (
                <div className="flex items-center gap-3 animate-in fade-in duration-500">
                  <span className="text-muted-foreground/30 text-[10px]">
                    |
                  </span>
                  {!weather ? (
                    <div className="flex items-center gap-1.5 opacity-70">
                      <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                      <span className="text-xs font-bold text-muted-foreground lowercase">
                        buscando...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                      <weather.icon
                        className={cn("w-3.5 h-3.5", theme.text)}
                        strokeWidth={2.5}
                      />
                      <span className="text-xs font-bold text-muted-foreground lowercase">
                        {weather.temp.replace("°c", "")}° • {weather.condition}{" "}
                        em {weather.location.split(",")[0]}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <h1 className="text-5xl font-black text-foreground leading-tight">
              {greeting.toLowerCase()},{" "}
              <span className={theme.text}>{user?.username ?? "viajante"}</span>
              !
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenConfig}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all cursor-pointer text-xs font-black",
                theme.text.replace("text-", "bg-"),
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              personalizar
            </button>

            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border-2 border-border">
              <span
                className={cn(
                  "text-xs font-black lowercase",
                  doneTodayCount === positiveHabitsCount &&
                    positiveHabitsCount > 0
                    ? "text-emerald-500"
                    : "text-foreground",
                )}
              >
                {doneTodayCount}/{positiveHabitsCount} hábitos
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span
                className={cn(
                  "text-xs font-black lowercase",
                  pendingTasksCount > 0 ? "text-orange-500" : "text-foreground",
                )}
              >
                {pendingTasksCount}{" "}
                {pendingTasksCount === 1 ? "tarefa" : "tarefas"}
              </span>
            </div>
          </div>
        </div>

        {/* Direita: Horário */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-foreground tabular-nums leading-none">
              {time.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className={cn("text-lg font-black tabular-nums", theme.text)}>
              {time.getSeconds().toString().padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
