"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getModuleDiscordAsset } from "@/config/modules.config";
import { useAuth } from "@/context/AuthContext";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { useTaskTimerContext } from "@/context/TaskTimerContext";

export interface DiscordRpcSettings {
  enabled: boolean;
  showPomodoro: boolean;
  showTaskTimer: boolean;
  showModule: boolean;
  showDefault: boolean;
}

const DEFAULT_SETTINGS: DiscordRpcSettings = {
  enabled: true,
  showPomodoro: true,
  showTaskTimer: true,
  showModule: true,
  showDefault: true,
};

interface DiscordRpcContextType {
  settings: DiscordRpcSettings;
  isEnabled: boolean;
  isConnected: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  updateSettings: (newSettings: Partial<DiscordRpcSettings>) => Promise<void>;
  refreshPresence: () => void;
}

interface DiscordPresencePayload {
  details?: string;
  state?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
  };
}

interface PomodoroStateData {
  cycleType: "Work" | "ShortBreak" | "LongBreak";
  workMinutes: number;
  breakMinutes: number;
  cyclesCompleted?: number;
  isRunning: boolean;
  startTime: string | null;
  accumulatedSeconds: number;
}

const DiscordRpcContext = createContext<DiscordRpcContextType | undefined>(
  undefined,
);

const ROUTE_LABELS: Record<AppRoute, { details: string; state: string }> = {
  dashboard: {
    details: "Painel principal",
    state: "Organizando o dia a dia",
  },
  notes: {
    details: "Caderno de notas",
    state: "Organizando anotações e ideias",
  },
  studies: {
    details: "Estudos & desempenho",
    state: "Revisando matérias e cronogramas",
  },
  reading: {
    details: "Biblioteca de leitura",
    state: "Acompanhando leituras e metas",
  },
  habits: {
    details: "Mural de hábitos",
    state: "Mantendo constância diária",
  },
  tasks: {
    details: "Quadro de tarefas",
    state: "Gerenciando prioridades",
  },
  flashcards: {
    details: "Revisão com flashcards",
    state: "Memorização espaçada ativa",
  },
  passwords: {
    details: "Cofre Aegis",
    state: "Gerenciando credenciais seguras",
  },
  sleep: {
    details: "Ritmo & sono",
    state: "Acompanhando janelas de descanso",
  },
  alarms: {
    details: "Central de alarmes",
    state: "Gerenciando alertas programados",
  },
  movies: {
    details: "Catálogo cinefilia",
    state: "Explorando filmes e séries",
  },
  dictionary: {
    details: "Dicionário lexical",
    state: "Expandindo vocabulário",
  },
  achievements: {
    details: "Conquistas & nível",
    state: "Evoluindo maestria pessoal",
  },
  statistics: {
    details: "Métricas & desempenho",
    state: "Analisando relatórios e dados",
  },
  calendar: {
    details: "Agenda & calendário",
    state: "Planejando prazos e eventos",
  },
  pomodoro: {
    details: "Temporizador Pomodoro",
    state: "Preparando sessão de foco",
  },
};

export function DiscordRpcProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { route } = useNavigation();
  const { activeTimerTaskId, baseSeconds, sessionSeconds } =
    useTaskTimerContext();

  const [settings, setSettings] =
    useState<DiscordRpcSettings>(DEFAULT_SETTINGS);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadKeyRef = useRef<string>("");

  // Carrega configurações persistidas por usuário ou padrão
  useEffect(() => {
    const initRpc = async () => {
      try {
        const stored = localStorage.getItem("aegis_discord_rpc_settings");
        let parsedSettings: DiscordRpcSettings = DEFAULT_SETTINGS;
        if (stored) {
          try {
            parsedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
          } catch {}
        } else {
          const oldStored = localStorage.getItem("aegis_discord_rpc_enabled");
          if (oldStored !== null) {
            parsedSettings.enabled = JSON.parse(oldStored);
          }
        }

        setSettings(parsedSettings);
        await invoke("discord_rpc_set_enabled", {
          enabled: parsedSettings.enabled,
        });

        const connected = await invoke<boolean>("discord_rpc_is_connected");
        setIsConnected(connected);
      } catch {
        // Falha silenciosa
      }
    };
    initRpc();
  }, []);

  const dispatchPresence = useCallback(
    async (
      payload: DiscordPresencePayload | null,
      overrideEnabled?: boolean,
    ) => {
      const isRpcEnabled =
        overrideEnabled !== undefined ? overrideEnabled : settings.enabled;

      if (!isRpcEnabled || payload === null) {
        lastPayloadKeyRef.current = "null";
        try {
          await invoke("discord_rpc_clear_presence");
          if (!isRpcEnabled) {
            setIsConnected(false);
          }
        } catch {}
        return;
      }

      const payloadKey = JSON.stringify(payload);
      if (payloadKey === lastPayloadKeyRef.current) return;

      lastPayloadKeyRef.current = payloadKey;
      try {
        await invoke("discord_rpc_update_presence", { payload });
        const connected = await invoke<boolean>("discord_rpc_is_connected");
        setIsConnected(connected);
      } catch {
        // Falha silenciosa
      }
    },
    [settings.enabled],
  );

  // Guarda a última rota usada para detectar mudanças e resetar o cache de payload
  const lastRouteRef = useRef<string>("");

  const calculateAndSendPresence = useCallback(
    async (currentSettings?: DiscordRpcSettings) => {
      const activeSettings = currentSettings || settings;

      // Reseta o cache de payload quando o usuário muda de módulo
      // para garantir que o Discord sempre receba a atualização com o novo asset
      if (lastRouteRef.current !== route) {
        lastRouteRef.current = route;
        lastPayloadKeyRef.current = "";
      }

      if (!activeSettings.enabled) {
        await dispatchPresence(null, false);
        return;
      }

      // 1. Verifica se há Pomodoro em execução e se está habilitado nas opções
      if (activeSettings.showPomodoro && user?.id) {
        let pomodoroState: PomodoroStateData | null = null;
        try {
          pomodoroState = await invoke<PomodoroStateData>(
            "pomodoro_get_pomodoro_state",
            {
              userId: String(user.id),
            },
          );
        } catch {
          // Sem estado de pomodoro
        }

        if (pomodoroState?.isRunning) {
          const isWork = pomodoroState.cycleType === "Work";
          const durationMins = isWork
            ? pomodoroState.workMinutes
            : pomodoroState.breakMinutes;

          const durationSecs = durationMins * 60;
          let elapsed = pomodoroState.accumulatedSeconds || 0;
          if (pomodoroState.startTime) {
            const startMs = new Date(pomodoroState.startTime).getTime();
            elapsed += Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          }
          const remainingSecs = Math.max(0, durationSecs - elapsed);
          const endTimestamp = Math.floor(Date.now() / 1000) + remainingSecs;

          const cycleNum =
            typeof pomodoroState.cyclesCompleted === "number"
              ? pomodoroState.cyclesCompleted + 1
              : 1;

          const detailsText = isWork
            ? "Focado em Pomodoro"
            : "Intervalo Pomodoro";
          const stateText = isWork
            ? `Ciclo de foco #${cycleNum}`
            : pomodoroState.cycleType === "LongBreak"
              ? "Pausa longa"
              : "Pausa curta";

          await dispatchPresence(
            {
              details: detailsText,
              state: stateText,
              timestamps: {
                end: endTimestamp,
              },
              assets: {
                largeImage: getModuleDiscordAsset("pomodoro"),
                largeText: "Aegis - Temporizador Pomodoro",
                smallImage: "aegis_logo",
                smallText: isWork ? "Modo de foco ativo" : "Em pausa",
              },
            },
            true,
          );
          return;
        }
      }

      // 2. Se o usuário estiver com o cronômetro de tarefas ativo
      if (activeSettings.showTaskTimer && activeTimerTaskId !== null) {
        const totalElapsed = (baseSeconds || 0) + (sessionSeconds || 0);
        const startTimestamp = Math.floor(Date.now() / 1000) - totalElapsed;

        await dispatchPresence(
          {
            details: "Executando tarefas",
            state: "Foco em tarefas ativas",
            timestamps: {
              start: startTimestamp,
            },
            assets: {
              largeImage: getModuleDiscordAsset("tasks"),
              largeText: "Aegis - Gerenciador de tarefas",
            },
          },
          true,
        );
        return;
      }

      // 3. Status baseado no módulo ativo atualmente na tela
      if (route !== "dashboard") {
        if (activeSettings.showModule) {
          const routeInfo = ROUTE_LABELS[route] || {
            details: "Sistema Aegis",
            state: "Produtividade e foco pessoal",
          };

          const moduleAsset = getModuleDiscordAsset(route);

          await dispatchPresence(
            {
              details: routeInfo.details,
              state: routeInfo.state,
              assets: {
                largeImage: moduleAsset,
                largeText: `Aegis - ${routeInfo.details}`,
              },
            },
            true,
          );
          return;
        }

        // Se showModule estiver desativado, verifica se o usuário deseja exibir o status padrão genérico do Aegis
        if (activeSettings.showDefault) {
          await dispatchPresence(
            {
              details: "Sistema Aegis",
              state: "Produtividade e foco pessoal",
              assets: {
                largeImage: getModuleDiscordAsset(route),
                largeText: "Aegis",
              },
            },
            true,
          );
          return;
        }

        // Se ambos estiverem desativados, limpa a presença
        await dispatchPresence(null, true);
        return;
      }

      // 4. Se estiver no painel principal (dashboard)
      if (route === "dashboard") {
        if (activeSettings.showDefault) {
          await dispatchPresence(
            {
              details: "Painel principal",
              state: "Organizando o dia a dia",
              assets: {
                largeImage: getModuleDiscordAsset("dashboard"),
                largeText: "Aegis - Painel principal",
              },
            },
            true,
          );
          return;
        }

        // Se showDefault estiver desativado no painel, limpa presença
        await dispatchPresence(null, true);
        return;
      }

      // 5. Fallback padrão
      if (activeSettings.showDefault) {
        await dispatchPresence(
          {
            details: "Sistema Aegis",
            state: "Produtividade e foco pessoal",
            assets: {
              largeImage: getModuleDiscordAsset(route),
              largeText: "Aegis",
            },
          },
          true,
        );
        return;
      }

      await dispatchPresence(null, true);
    },
    [
      settings,
      user?.id,
      activeTimerTaskId,
      baseSeconds,
      sessionSeconds,
      route,
      dispatchPresence,
    ],
  );

  const updateSettings = useCallback(
    async (newPartial: Partial<DiscordRpcSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newPartial };
        localStorage.setItem(
          "aegis_discord_rpc_settings",
          JSON.stringify(updated),
        );
        if (newPartial.enabled !== undefined) {
          invoke("discord_rpc_set_enabled", {
            enabled: newPartial.enabled,
          }).catch(() => {});
          if (!newPartial.enabled) {
            invoke("discord_rpc_clear_presence").catch(() => {});
            setIsConnected(false);
          }
        }
        setTimeout(() => {
          calculateAndSendPresence(updated);
        }, 50);
        return updated;
      });
    },
    [calculateAndSendPresence],
  );

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      await updateSettings({ enabled });
    },
    [updateSettings],
  );

  const refreshPresence = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      calculateAndSendPresence();
    }, 150);
  }, [calculateAndSendPresence]);

  // Recalcula presença imediatamente quando rota, tarefas ou configurações mudam
  // (route está nas deps de calculateAndSendPresence → refreshPresence é recriado → este effect roda)
  useEffect(() => {
    refreshPresence();
  }, [refreshPresence]);

  // Escuta ticks do Pomodoro para manter o status sincronizado
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("pomo-tick", () => {
      refreshPresence();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [refreshPresence]);

  // Limpa presença ao desmontar a aplicação
  useEffect(() => {
    return () => {
      invoke("discord_rpc_clear_presence").catch(() => {});
    };
  }, []);

  return (
    <DiscordRpcContext.Provider
      value={{
        settings,
        isEnabled: settings.enabled,
        isConnected,
        setEnabled,
        updateSettings,
        refreshPresence,
      }}
    >
      {children}
    </DiscordRpcContext.Provider>
  );
}

export function useDiscordRpc() {
  const ctx = useContext(DiscordRpcContext);
  if (!ctx) {
    throw new Error("useDiscordRpc must be used within a DiscordRpcProvider");
  }
  return ctx;
}
