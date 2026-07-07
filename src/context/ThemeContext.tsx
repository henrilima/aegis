"use client";

import { load } from "@tauri-apps/plugin-store";
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
  appMode: "default" | "no_sidebar" | "portal";
  setAppMode: (mode: "default" | "no_sidebar" | "portal") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ChromaticThemeId>(FALLBACK_THEME);
  const [accentColor, setAccentColorState] = useState<ThemeColorKey>("blue");
  const [appMode, setAppModeState] = useState<
    "default" | "no_sidebar" | "portal"
  >("default");

  // Carrega o tema do localStorage e do Store ao montar o componente
  useEffect(() => {
    const loadSavedThemes = async () => {
      try {
        const store = await load("aegis-theme-settings.json", {
          defaults: {},
          autoSave: true,
        });

        // Tenta pegar do Store primeiro (mais confiável em saídas abruptas)
        let savedTheme = await store.get<ChromaticThemeId>("theme");
        let savedAccent = await store.get<ThemeColorKey>("accent-color");
        let savedAppMode = await store.get<"default" | "no_sidebar" | "portal">(
          "app-mode",
        );

        // Se não tiver no Store, pega do localStorage (retrocompatibilidade)
        if (!savedTheme) {
          savedTheme =
            (localStorage.getItem(
              "aegis-chromatic-theme",
            ) as ChromaticThemeId | null) || FALLBACK_THEME;
        }
        if (!savedAccent) {
          savedAccent =
            (localStorage.getItem(
              "aegis-accent-color",
            ) as ThemeColorKey | null) || "blue";
        }
        if (!savedAppMode) {
          savedAppMode =
            (localStorage.getItem("aegis-app-mode") as
              | "default"
              | "no_sidebar"
              | "portal"
              | null) || "default";
        }

        // Valida e aplica
        const finalTheme =
          savedTheme && VALID_THEME_IDS.has(savedTheme)
            ? savedTheme
            : FALLBACK_THEME;
        setThemeState(finalTheme);
        setAccentColorState(savedAccent);
        setAppModeState(savedAppMode);

        document.documentElement.setAttribute("data-theme", finalTheme);
        if (finalTheme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }

        // Garante que o localStorage e o Store fiquem sincronizados
        localStorage.setItem("aegis-chromatic-theme", finalTheme);
        localStorage.setItem("aegis-accent-color", savedAccent);
        localStorage.setItem("aegis-app-mode", savedAppMode);

        await store.set("theme", finalTheme);
        await store.set("accent-color", savedAccent);
        await store.set("app-mode", savedAppMode);
      } catch (err) {
        console.error("Erro ao carregar configurações de tema:", err);
      }
    };

    loadSavedThemes();
  }, []);

  const setAppMode = (mode: "default" | "no_sidebar" | "portal") => {
    setAppModeState(mode);
    localStorage.setItem("aegis-app-mode", mode);
    load("aegis-theme-settings.json", { defaults: {}, autoSave: true }).then(
      (store) => {
        store.set("app-mode", mode);
      },
    );
  };

  const setTheme = (newTheme: ChromaticThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem("aegis-chromatic-theme", newTheme);
    load("aegis-theme-settings.json", { defaults: {}, autoSave: true }).then(
      (store) => {
        store.set("theme", newTheme);
      },
    );

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
    load("aegis-theme-settings.json", { defaults: {}, autoSave: true }).then(
      (store) => {
        store.set("accent-color", color);
      },
    );
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
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        themeStyles,
        appMode,
        setAppMode,
      }}
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
