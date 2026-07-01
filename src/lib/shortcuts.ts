import type { AppRoute } from "@/context/NavigationContext";

export type ShortcutAction = (context: {
  navigate: (route: AppRoute) => void;
  setIsPaletteOpen: (open: boolean) => void;
  setIsGuideOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}) => void;

export type ShortcutDetails = {
  action: ShortcutAction;
  description: string;
};

export interface RouteConfig {
  disabled?: boolean;
  [key: string]: ShortcutDetails | boolean | undefined;
}

export interface ShortcutConfig {
  global: RouteConfig;
  [route: string]: RouteConfig;
}

export const shortcuts: ShortcutConfig = {
  global: {
    "ctrl+k": {
      action: ({ setIsPaletteOpen }) => setIsPaletteOpen(true),
      description: "Abre a busca global (Command Palette)",
    },
    "shift+?": {
      action: ({ setIsGuideOpen }) => setIsGuideOpen(true),
      description: "Mostra o guia de atalhos",
    },
    "alt+n": {
      action: () => {
        window.dispatchEvent(new Event("toggle-notifications-panel"));
      },
      description: "Alternar painel de notificações",
    },
    "alt+d": {
      action: () => {
        window.dispatchEvent(new Event("toggle-dictionary-search"));
      },
      description: "Busca rápida no dicionário",
    },
    "alt+b": {
      action: () => {
        window.dispatchEvent(new Event("toggle-sidebar"));
      },
      description: "Alternar barra lateral",
    },
    "ctrl+shift+c": {
      action: ({ setSettingsOpen }) => setSettingsOpen(true),
      description: "Abrir configurações",
    },
    "ctrl+shift+l": {
      action: ({ setSettingsOpen }) => {
        setSettingsOpen(true);
        setTimeout(() => {
          window.dispatchEvent(new Event("open-telemetry"));
        }, 100);
      },
      description: "Abrir telemetria",
    },
    "alt+f": {
      action: () => {
        window.dispatchEvent(new Event("open-feedback"));
      },
      description: "Reportar bug / Sugestões (Feedback)",
    },
    "ctrl+shift+d": {
      action: () => {
        window.dispatchEvent(new Event("open-whats-new"));
      },
      description: "Abrir novidades da versão (O que há de novo?)",
    },
    "alt+shift+d": {
      action: ({ navigate }) => navigate("dictionary"),
      description: "Abrir módulo Dicionário",
    },
  },
};
