import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Cloud,
  Fullscreen,
  HardDrive,
  Loader2,
  Maximize,
  Minimize2,
  Power,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useSettingsLogic } from "./useSettingsLogic";

interface CitySuggestion {
  id: number;
  name: string;
  admin1?: string;
  country: string;
}

export function SystemTab() {
  const { themeStyles: theme } = useTheme();
  const {
    startAtLogin,
    minimizeOnClose,
    startMinimized,
    updateSystemConfig,
    updateConfigField,
    weatherLocation,
    showWeatherWidget,
    appZoom,
    isConfigLoading,
  } = useSettingsLogic();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const checkFullscreen = async () => {
      const win = getCurrentWindow();
      setIsFullscreen(await win.isFullscreen());
    };
    checkFullscreen();
  }, []);

  const toggleFullscreen = async () => {
    const win = getCurrentWindow();
    const current = await win.isFullscreen();
    await win.setFullscreen(!current);
    setIsFullscreen(!current);
  };

  const [localLocation, setLocalLocation] = useState(weatherLocation);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalLocation(weatherLocation);
  }, [weatherLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`,
      );
      const data = await res.json();
      if (data.results) {
        setSuggestions(data.results);
      } else {
        setSuggestions([]);
      }
    } catch (e) {
      console.error("Failed to fetch cities", e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          Comportamento do Sistema
        </h3>
        <div className="space-y-2">
          <ToggleRow
            icon={Power}
            title="Iniciar com o Windows"
            description="Abre o Aegis automaticamente ao ligar o computador"
            active={startAtLogin}
            onClick={() => updateSystemConfig("autostart", !startAtLogin)}
            theme={theme}
          />
          <ToggleRow
            icon={Minimize2}
            title="Iniciar minimizado"
            description="Inicia o Aegis em segundo plano, direto na bandeja do sistema"
            active={startMinimized}
            onClick={() => updateSystemConfig("minimized", !startMinimized)}
            theme={theme}
            disabled={!startAtLogin}
          />
          <ToggleRow
            icon={Minimize2}
            title="Minimizar ao fechar"
            description="Mantém o aplicativo rodando em segundo plano ao fechar a janela"
            active={minimizeOnClose}
            onClick={() => updateSystemConfig("minimize", !minimizeOnClose)}
            theme={theme}
          />
          <ToggleRow
            icon={Fullscreen}
            title="Modo Tela Cheia"
            description="Alterna o aplicativo para preencher toda a tela (F11)"
            active={isFullscreen}
            onClick={toggleFullscreen}
            theme={theme}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
          <Maximize className="w-4 h-4" />
          Interface e Zoom
        </h3>
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground lowercase">
                Zoom da Interface
              </p>
              <p className="text-xs text-muted-foreground lowercase">
                Ajuste o tamanho dos elementos da interface ({appZoom}%)
              </p>
            </div>
            <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border">
              <button
                type="button"
                disabled={appZoom <= 75}
                onClick={() =>
                  updateConfigField("appZoom", Math.max(75, appZoom - 5))
                }
                className="p-2 rounded-md hover:bg-accent disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-12 text-center text-xs font-bold font-mono">
                {appZoom}%
              </div>
              <button
                type="button"
                disabled={appZoom >= 125}
                onClick={() =>
                  updateConfigField("appZoom", Math.min(125, appZoom + 5))
                }
                className="p-2 rounded-md hover:bg-accent disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                theme.text.replace("text-", "bg-"),
              )}
              style={{ width: `${((appZoom - 75) / (125 - 75)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Clima na Dashboard
        </h3>
        <div className="space-y-2">
          <ToggleRow
            icon={Cloud}
            title="Exibir Widget de Clima"
            description="Mostra o clima e a temperatura atual ao lado da data"
            active={showWeatherWidget}
            onClick={() =>
              updateConfigField("showWeatherWidget", !showWeatherWidget)
            }
            theme={theme}
            disabled={isConfigLoading}
          />

          <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-muted/30 border border-border">
            <label
              htmlFor="weatherLocationInput"
              className="text-sm font-bold text-foreground lowercase flex justify-between items-center"
            >
              Localização (Cidade, País)
              <span className="text-[10px] text-muted-foreground uppercase">
                OPCIONAL
              </span>
            </label>
            <p className="text-xs text-muted-foreground lowercase mb-2">
              deixe em branco para usar sua localização aproximada automática
              baseada no IP.
            </p>
            <div className="relative flex gap-2" ref={wrapperRef}>
              <input
                id="weatherLocationInput"
                type="text"
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-bold lowercase"
                placeholder="Ex: São Paulo, Brazil"
                value={localLocation}
                onChange={(e) => {
                  setLocalLocation(e.target.value);
                  setShowSuggestions(true);
                  searchCities(e.target.value);
                }}
                onFocus={() => {
                  if (localLocation.length >= 3) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowSuggestions(false);
                    updateConfigField("weatherLocation", localLocation);
                  }
                }}
                disabled={isConfigLoading}
              />
              <button
                type="button"
                className={cn(
                  "px-4 py-2 rounded-lg text-white font-bold text-xs lowercase transition-all cursor-pointer",
                  theme.text.replace("text-", "bg-"),
                )}
                onClick={() => {
                  setShowSuggestions(false);
                  updateConfigField("weatherLocation", localLocation);
                }}
                disabled={isConfigLoading || localLocation === weatherLocation}
              >
                Confirmar
              </button>
              {showSuggestions && localLocation.length >= 3 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-3 flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold lowercase">
                        buscando...
                      </span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((city) => (
                        <li key={city.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 text-foreground transition-colors cursor-pointer lowercase"
                            onClick={() => {
                              const finalLoc = `${city.name}, ${city.country}`;
                              setLocalLocation(finalLoc);
                              setShowSuggestions(false);
                              updateConfigField("weatherLocation", finalLoc);
                            }}
                          >
                            <span className="font-bold">{city.name}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              {city.admin1 ? `- ${city.admin1}, ` : "- "}
                              {city.country}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground lowercase">
                      nenhuma cidade encontrada
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ToggleRow({
  icon: Icon,
  title,
  description,
  active,
  onClick,
  theme,
  disabled = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
  theme: { text: string; [key: string]: string };
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left flex items-center justify-between p-4 rounded-xl border border-border transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
        disabled
          ? "opacity-50 cursor-not-allowed bg-muted/10"
          : "cursor-pointer hover:bg-muted/50 bg-muted/30",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-2 rounded-lg",
            active ? theme.text.replace("text-", "bg-") : "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              active ? "text-white" : "text-muted-foreground",
            )}
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground lowercase">{title}</p>
          <p className="text-xs text-muted-foreground lowercase">
            {description}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "w-10 h-6 rounded-full p-1 transition-colors relative",
          active ? theme.text.replace("text-", "bg-") : "bg-muted",
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full bg-white transition-transform",
            active ? "translate-x-4" : "translate-x-0",
          )}
        />
      </div>
    </button>
  );
}
