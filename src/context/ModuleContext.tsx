"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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
  | "achievements"
  | "grades";

export interface SingleModuleConfig {
  stickyHeader?: boolean;
}

export type ModuleSettingsMap = Partial<Record<ModuleId, SingleModuleConfig>>;

interface ModuleContextType {
  enabledModules: ModuleId[];
  isModuleEnabled: (id: ModuleId) => boolean;
  toggleModule: (id: ModuleId) => void;
  moduleSettings: ModuleSettingsMap;
  isStickyHeaderEnabled: (id: ModuleId) => boolean;
  toggleStickyHeader: (id: ModuleId) => void;
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
  const userId = user?.id ?? "default";
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsMap>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Carrega módulos ativos por perfil
    const modulesKey =
      userId !== "default"
        ? `aegis_enabled_modules_${userId}`
        : "aegis_enabled_modules";
    const savedModules = localStorage.getItem(modulesKey);
    if (savedModules) {
      try {
        const modules = JSON.parse(savedModules) as ModuleId[];
        setEnabledModules(modules);
      } catch {
        setEnabledModules(DEFAULT_MODULES);
      }
    } else {
      setEnabledModules(DEFAULT_MODULES);
    }

    // Carrega configurações individuais de módulo por perfil de usuário
    const savedSettings = localStorage.getItem(
      `aegis_module_settings_${userId}`,
    );
    if (savedSettings) {
      try {
        setModuleSettings(JSON.parse(savedSettings));
      } catch {
        setModuleSettings({});
      }
    } else {
      setModuleSettings({});
    }

    setMounted(true);
  }, [userId]);

  useEffect(() => {
    const modulesKey =
      userId !== "default"
        ? `aegis_enabled_modules_${userId}`
        : "aegis_enabled_modules";
    const handleStorage = (e: StorageEvent) => {
      if (e.key === modulesKey && e.newValue) {
        try {
          setEnabledModules(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === `aegis_module_settings_${userId}` && e.newValue) {
        try {
          setModuleSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [userId]);

  useEffect(() => {
    if (mounted) {
      const modulesKey =
        userId !== "default"
          ? `aegis_enabled_modules_${userId}`
          : "aegis_enabled_modules";
      localStorage.setItem(modulesKey, JSON.stringify(enabledModules));
    }
  }, [enabledModules, mounted, userId]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        `aegis_module_settings_${userId}`,
        JSON.stringify(moduleSettings),
      );
    }
  }, [moduleSettings, mounted, userId]);

  const isModuleEnabled = useCallback(
    (id: ModuleId) => {
      if (!mounted) return true;
      return enabledModules.includes(id);
    },
    [mounted, enabledModules],
  );

  const toggleModule = useCallback((id: ModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  const isStickyHeaderEnabled = useCallback(
    (id: ModuleId) => {
      return moduleSettings[id]?.stickyHeader ?? false;
    },
    [moduleSettings],
  );

  const toggleStickyHeader = useCallback((id: ModuleId) => {
    setModuleSettings((prev) => {
      const current = prev[id]?.stickyHeader ?? true;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          stickyHeader: !current,
        },
      };
    });
  }, []);

  return (
    <ModuleContext.Provider
      value={{
        enabledModules,
        isModuleEnabled,
        toggleModule,
        moduleSettings,
        isStickyHeaderEnabled,
        toggleStickyHeader,
      }}
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
