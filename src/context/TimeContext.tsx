"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface TimeContextType {
  now: Date;
  isSimulated: boolean;
  refreshSimulation: () => Promise<void>;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(new Date());
  const [isSimulated, setIsSimulated] = useState(false);

  const refreshSimulation = useCallback(async () => {
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
    try {
      const status = await invoke<{
        isActive: boolean;
        simulatedTime: string;
        offsetSeconds: number;
      }>("global_get_simulation_status");
      setIsSimulated(status.isActive);
      setNow(new Date(status.simulatedTime));
    } catch (error) {
      console.error("Failed to fetch simulation status:", error);
    }
  }, []);

  useEffect(() => {
    refreshSimulation();

    // Atualiza o relógio a cada segundo
    const timer = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);

    // Refresh da simulação a cada 30 segundos para garantir sincronia com backend (e.g. se o usuário mudar o tempo no console)
    const refreshTimer = setInterval(refreshSimulation, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [refreshSimulation]);

  return (
    <TimeContext.Provider value={{ now, isSimulated, refreshSimulation }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error("useTime must be used within a TimeProvider");
  }
  return context;
}
