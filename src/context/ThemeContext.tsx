"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getThemeColor, type ThemeColorKey } from "@/lib/utils";
import { CHROMATIC_THEMES, type ChromaticThemeId } from "@/themes.config";

const VALID_THEME_IDS = new Set(CHROMATIC_THEMES.map((t) => t.id));
const FALLBACK_THEME: ChromaticThemeId = "default";

interface ThemeContextType {
  theme: ChromaticThemeId;
  setTheme: (theme: ChromaticThemeId) => void;
  accentColor: ThemeColorKey;
  setAccentColor: (color: ThemeColorKey) => void;
  themeStyles: ReturnType<typeof getThemeColor>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ChromaticThemeId>(FALLBACK_THEME);
  const [accentColor, setAccentColorState] = useState<ThemeColorKey>("blue");

  // Carrega o tema do localStorage ao montar o componente
  useEffect(() => {
    const raw = localStorage.getItem(
      "aegis-chromatic-theme",
    ) as ChromaticThemeId | null;

    const savedAccent = localStorage.getItem(
      "aegis-accent-color",
    ) as ThemeColorKey | null;

    if (savedAccent) {
      setAccentColorState(savedAccent);
    }

    // Valida se o tema ainda existe na lista de temas disponíveis
    const savedTheme: ChromaticThemeId =
      raw && VALID_THEME_IDS.has(raw) ? raw : FALLBACK_THEME;

    if (raw && !VALID_THEME_IDS.has(raw)) {
      // Tema removido: limpa o localStorage silenciosamente
      localStorage.setItem("aegis-chromatic-theme", FALLBACK_THEME);
    }

    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Ajustar .dark no carregamento inicial
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setTheme = (newTheme: ChromaticThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem("aegis-chromatic-theme", newTheme);

    // Gerenciar classe .dark para suporte ao Tailwind Light/Dark
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    if (newTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  const setAccentColor = (color: ThemeColorKey) => {
    setAccentColorState(color);
    localStorage.setItem("aegis-accent-color", color);
  };

  const themeStyles = useMemo(() => {
    // Temas que aceitam cor de destaque dinâmica
    const dynamicThemes: ChromaticThemeId[] = ["default", "midnight", "light"];

    if (dynamicThemes.includes(theme)) {
      return getThemeColor(accentColor);
    }

    return getThemeColor(theme);
  }, [theme, accentColor]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, accentColor, setAccentColor, themeStyles }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
