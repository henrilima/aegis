"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

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
  | "flashcards";

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
];

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
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
        setEnabledModules(modules);
      } catch {
        setEnabledModules(DEFAULT_MODULES);
      }
    } else {
      setEnabledModules(DEFAULT_MODULES);
      localStorage.setItem("aegis_flashcards_enabled_default", "true");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "aegis_enabled_modules",
        JSON.stringify(enabledModules),
      );
    }
  }, [enabledModules, mounted]);

  const isModuleEnabled = (id: ModuleId) => {
    if (!mounted) return true; // Default to enabled during SSR/initial mount
    return enabledModules.includes(id);
  };

  const toggleModule = (id: ModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

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
