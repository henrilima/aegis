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
