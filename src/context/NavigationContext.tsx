"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
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
  | "movies"
  | "flashcards";

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
  "flashcards",
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

const SUB_MODULES = new Set<AppRoute>(["pomodoro", "dictionary"]);

interface NavigationContextType {
  route: AppRoute;
  previousRoute: AppRoute | null;
  navigate: (route: AppRoute) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);
  const [backTarget, setBackTarget] = useState<AppRoute | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const previousRoute = useMemo(() => {
    if (route === "dashboard") return null;
    return backTarget || "dashboard";
  }, [route, backTarget]);

  const navigate = useCallback((newRoute: AppRoute) => {
    if (!VALID_ROUTES.has(newRoute)) return;
    
    setBackTarget(() => {
      if (newRoute === "dashboard") {
        return null;
      }
      if (SUB_MODULES.has(newRoute)) {
        return route;
      }
      return "dashboard";
    });

    const url =
      newRoute === "dashboard" ? "/dashboard" : `/dashboard/${newRoute}`;
    try {
      window.history.pushState(null, "", url);
    } catch {}
    
    setRoute(newRoute);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aegis-route-click", { detail: newRoute })
      );
    }
  }, [route]);

  useEffect(() => {
    const handlePop = () => {
      const nextRoute = parsePathname(window.location.pathname);
      setRoute(nextRoute);
      if (nextRoute === "dashboard") {
        setBackTarget(null);
      } else if (SUB_MODULES.has(nextRoute)) {
        setBackTarget((prev) => (prev === nextRoute ? "dashboard" : prev));
      } else {
        setBackTarget("dashboard");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // Escuta atalhos globais ou eventos para abrir/fechar configurações
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    const handleCloseSettings = () => setSettingsOpen(false);
    window.addEventListener("open-settings", handleOpenSettings);
    window.addEventListener("close-settings", handleCloseSettings);
    window.addEventListener("close-all-modals", handleCloseSettings);
    return () => {
      window.removeEventListener("open-settings", handleOpenSettings);
      window.removeEventListener("close-settings", handleCloseSettings);
      window.removeEventListener("close-all-modals", handleCloseSettings);
    };
  }, []);

  // Escuta evento global para mudar de rota/módulo
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<AppRoute>;
      if (customEvent.detail) {
        navigate(customEvent.detail);
      }
    };
    window.addEventListener("aegis-navigate", handleNavigate);
    return () => {
      window.removeEventListener("aegis-navigate", handleNavigate);
    };
  }, [navigate]);

  return (
    <NavigationContext.Provider
      value={{ route, previousRoute, navigate, isSettingsOpen, setSettingsOpen }}
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
