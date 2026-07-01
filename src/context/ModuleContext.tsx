"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AppConfig } from "@/components/modules/settings/useSettingsLogic";
import { useAuth } from "@/context/AuthContext";

export type ModuleId =
  | "passwords"
  | "tasks"
  | "calendar"
  | "notes"
  | "studies"
  | "reading"
  | "dictionary"
  | "movies"
  | "habits"
  | "pomodoro"
  | "sleep"
  | "alarms"
  | "statistics"
  | "flashcards"
  | "achievements";

interface ModuleContextType {
  enabledModules: ModuleId[];
  isModuleEnabled: (id: ModuleId) => boolean;
  toggleModule: (id: ModuleId) => void;
}

const DEFAULT_MODULES: ModuleId[] = [
  "passwords",
  "tasks",
  "calendar",
  "notes",
  "studies",
  "reading",
  "dictionary",
  "movies",
  "habits",
  "pomodoro",
  "sleep",
  "alarms",
  "statistics",
  "flashcards",
  "achievements",
];

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("aegis_enabled_modules");
    if (saved) {
      try {
        const modules = JSON.parse(saved) as ModuleId[];
        const migrated = localStorage.getItem(
          "aegis_flashcards_enabled_default",
        );
        if (!migrated) {
          if (!modules.includes("flashcards")) {
            modules.push("flashcards");
          }
          localStorage.setItem("aegis_flashcards_enabled_default", "true");
        }
        const migratedAchievements = localStorage.getItem(
          "aegis_achievements_enabled_default",
        );
        if (!migratedAchievements) {
          if (!modules.includes("achievements")) {
            modules.push("achievements");
          }
          localStorage.setItem("aegis_achievements_enabled_default", "true");
        }
        setEnabledModules(modules);
      } catch {
        setEnabledModules(DEFAULT_MODULES);
      }
    } else {
      setEnabledModules(DEFAULT_MODULES);
      localStorage.setItem("aegis_flashcards_enabled_default", "true");
      localStorage.setItem("aegis_achievements_enabled_default", "true");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "aegis_enabled_modules" && e.newValue) {
        try {
          setEnabledModules(JSON.parse(e.newValue));
        } catch {}
      }
    };
    const handleCustomEvent = () => {
      const saved = localStorage.getItem("aegis_enabled_modules");
      if (saved) {
        try {
          setEnabledModules(JSON.parse(saved));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("aegis-modules-changed", handleCustomEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("aegis-modules-changed", handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "aegis_enabled_modules",
        JSON.stringify(enabledModules),
      );

      // Sincroniza a flag achievementsEnabled com o backend
      const achievementsActive = enabledModules.includes("achievements");
      const syncBackend = async () => {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const currentConfig = await invoke<AppConfig>(
            "global_get_app_config",
          );
          if (currentConfig.achievementsEnabled !== achievementsActive) {
            currentConfig.achievementsEnabled = achievementsActive;
            await invoke("global_set_app_config", { config: currentConfig });
          }
        } catch (e) {
          console.error(
            "Erro ao sincronizar módulo de conquistas com o backend:",
            e,
          );
        }
      };
      syncBackend();

      // Sincroniza com o servidor remoto se estiver sob gerenciamento aprovado
      const syncFromServer = localStorage.getItem("aegis_sync_from_server");
      if (syncFromServer === "true") {
        localStorage.removeItem("aegis_sync_from_server");
      } else {
        const managementStatus = localStorage.getItem(
          "aegis_management_status",
        );
        if (managementStatus === "approved" && user?.id) {
          const syncRemoteServer = async () => {
            try {
              const baseUrl =
                localStorage.getItem("aegis_remote_api_url") ||
                "https://aegiswebpainel.vercel.app";
              const apiKey =
                localStorage.getItem("aegis_remote_api_key") || "96421340";

              await fetch(`${baseUrl}/api/users/${user.id}/management-status`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": apiKey,
                },
                body: JSON.stringify({
                  status: "approved",
                  modules: enabledModules,
                }),
              });
              console.log(
                "[ModuleContext] Módulos sincronizados com o servidor remoto com sucesso.",
              );
            } catch (err) {
              console.error(
                "[ModuleContext] Erro ao sincronizar módulos com o servidor remoto:",
                err,
              );
            }
          };
          syncRemoteServer();
        }
      }
    }
  }, [enabledModules, mounted, user]);

  const isModuleEnabled = useCallback(
    (id: ModuleId) => {
      if (!mounted) return true; // Padrão como ativo durante SSR/montagem inicial
      return enabledModules.includes(id);
    },
    [mounted, enabledModules],
  );

  const toggleModule = useCallback((id: ModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  return (
    <ModuleContext.Provider
      value={{ enabledModules, isModuleEnabled, toggleModule }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error("useModules must be used within a ModuleProvider");
  }
  return context;
}
