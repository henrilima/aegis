import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/app.config";
import {
  HEX_COLORS as RAW_HEX,
  THEME_COLORS_CONFIG,
  type ThemeColorKey,
} from "@/colors.config";

export type { ThemeColorKey };

import { CHROMATIC_THEMES } from "@/themes.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function setCookie(name: string, value: string, maxAge: number) {
  // biome-ignore lint/suspicious/noDocumentCookie: Uso intencional para persistência simples do estado da sidebar
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const HEX_COLORS = RAW_HEX;
export const THEME_COLORS = THEME_COLORS_CONFIG;

export function getColorTheme(colorName: string) {
  const key = colorName as ThemeColorKey;
  return THEME_COLORS[key] || THEME_COLORS.blue;
}

export function getThemeColor(themeId?: string) {
  let primary: ThemeColorKey = APP_CONFIG.theme.primary as ThemeColorKey;

  if (themeId) {
    // Tenta encontrar nos temas cromáticos primeiro
    const config = CHROMATIC_THEMES.find((t) => t.id === themeId);
    if (config) {
      primary = config.primary;
    } else {
      // Se não for um tema, assume que é uma chave de cor direta (para o Aegis Default dinâmico)
      primary = themeId as ThemeColorKey;
    }
  }

  const theme = getColorTheme(primary);
  return {
    ...theme,
    name: primary || "blue",
  };
}

// Formata data para YYYY-MM-DD (local)
export function formatDateLocal(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma classe de cor (que pode ter variantes dark:) para a sua versão hover.
 * Ex: "text-amber-600 dark:text-amber-500" -> "hover:text-amber-600 dark:hover:text-amber-500"
 */
export function toHoverClass(classStr: string): string {
  if (!classStr) return "";
  return classStr
    .split(" ")
    .map((cls) => {
      if (cls.startsWith("dark:")) {
        return `dark:hover:${cls.substring(5)}`;
      }
      return `hover:${cls}`;
    })
    .join(" ");
}

export function changeModule(route: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aegis-navigate", { detail: route }));
  }
}

export function closeAllModals() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("close-all-modals"));
  }
}

export function openSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("open-settings"));
  }
}

export function closeSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("close-settings"));
  }
}

if (typeof window !== "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: registrar funções no escopo global
  const w = window as any;
  w.changeModule = changeModule;
  w.closeAllModals = closeAllModals;
  w.openSettings = openSettings;
  w.closeSettings = closeSettings;

  w.mudarModulo = changeModule;
  w.fecharTodosModais = closeAllModals;
  w.abrirConfiguracoes = openSettings;
  w.fecharConfiguracoes = closeSettings;
}
