"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AppRoute =
  | "dashboard"
  | "passwords"
  | "habits"
  | "alarms"
  | "notes"
  | "pomodoro"
  | "studies"
  | "sleep"
  | "calendar"
  | "statistics"
  | "reading"
  | "dictionary"
  | "tasks"
  | "movies";

const VALID_ROUTES = new Set<AppRoute>([
  "dashboard",
  "passwords",
  "habits",
  "alarms",
  "notes",
  "pomodoro",
  "studies",
  "sleep",
  "calendar",
  "statistics",
  "reading",
  "dictionary",
  "tasks",
  "movies",
]);

function parsePathname(raw: string): AppRoute {
  let path = raw.replace(/\.html$/, "").replace(/\/$/, "");
  path = path.replace("/dashboard", "");
  if (path.startsWith("/")) path = path.slice(1);
  if (path === "") return "dashboard";
  if (VALID_ROUTES.has(path as AppRoute)) return path as AppRoute;
  return "dashboard";
}

function getInitialRoute(): AppRoute {
  if (typeof window === "undefined") return "dashboard";
  return parsePathname(window.location.pathname);
}

interface NavigationContextType {
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const navigate = useCallback((newRoute: AppRoute) => {
    if (!VALID_ROUTES.has(newRoute)) return;
    const url =
      newRoute === "dashboard" ? "/dashboard" : `/dashboard/${newRoute}`;
    try {
      window.history.pushState(null, "", url);
    } catch {}
    setRoute(newRoute);
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setRoute(parsePathname(window.location.pathname));
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Escuta atalhos globais ou eventos para abrir configurações
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("open-settings", handleOpenSettings);
    return () =>
      window.removeEventListener("open-settings", handleOpenSettings);
  }, []);

  return (
    <NavigationContext.Provider
      value={{ route, navigate, isSettingsOpen, setSettingsOpen }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
