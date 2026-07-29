// src/context/ThemeContext.tsx
"use client";

import { load } from "@tauri-apps/plugin-store";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id ? String(user.id) : "";

  const themeKey = uid
    ? `aegis-chromatic-theme_${uid}`
    : "aegis-chromatic-theme";
  const prefThemeKey = uid
    ? `aegis-preferred-theme_${uid}`
    : "aegis-preferred-theme";
  const accentKey = uid ? `aegis-accent-color_${uid}` : "aegis-accent-color";
  const prefAccentKey = uid
    ? `aegis-accent-color-preferred_${uid}`
    : "aegis-accent-color-preferred";
  const modeKey = uid ? `aegis-app-mode_${uid}` : "aegis-app-mode";
  const storeFileName = uid
    ? `aegis-theme-settings_${uid}.json`
    : "aegis-theme-settings.json";

  const [theme, setThemeState] = useState<ChromaticThemeId>(FALLBACK_THEME);
  const [accentColor, setAccentColorState] = useState<ThemeColorKey>("blue");
  const [appMode, setAppModeState] = useState<
    "default" | "no_sidebar" | "portal"
  >("default");

  // Carrega o tema do localStorage e do Store ao montar o componente ou trocar de usuário
  useEffect(() => {
    const loadSavedThemes = async () => {
      try {
        const store = await load(storeFileName, {
          defaults: {},
          autoSave: true,
        });

        // Tenta pegar do Store primeiro (mais confiável em saídas abruptas)
        let savedTheme = await store.get<ChromaticThemeId>("theme");
        let savedAccent = await store.get<ThemeColorKey>("accent-color");
        let savedAppMode = await store.get<"default" | "no_sidebar" | "portal">(
          "app-mode",
        );

        // Se não tiver no Store, pega do localStorage
        if (!savedTheme) {
          savedTheme =
            (localStorage.getItem(themeKey) as ChromaticThemeId | null) ||
            FALLBACK_THEME;
        }
        if (!savedAccent) {
          savedAccent =
            (localStorage.getItem(accentKey) as ThemeColorKey | null) || "blue";
        }
        if (!savedAppMode) {
          savedAppMode =
            (localStorage.getItem(modeKey) as
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

        if (finalTheme === "default") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", finalTheme);
        }

        if (finalTheme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }

        // Garante que o localStorage e o Store fiquem sincronizados
        localStorage.setItem(themeKey, finalTheme);
        localStorage.setItem(prefThemeKey, finalTheme);
        localStorage.setItem(accentKey, savedAccent);
        localStorage.setItem(prefAccentKey, savedAccent);
        localStorage.setItem(modeKey, savedAppMode);

        await store.set("theme", finalTheme);
        await store.set("accent-color", savedAccent);
        await store.set("app-mode", savedAppMode);
      } catch (err) {
        console.error("Erro ao carregar configurações de tema:", err);
      }
    };

    loadSavedThemes();
  }, [
    storeFileName,
    themeKey,
    accentKey,
    modeKey,
    prefThemeKey,
    prefAccentKey,
  ]);

  // Ouvintes de eventos Tauri para automação de alteração temporária de temas
  useEffect(() => {
    let unlistenChange: (() => void) | null = null;
    let unlistenRestore: (() => void) | null = null;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<unknown>("change-theme", (event) => {
        let payloadUserId: string | undefined;
        let newThemeStr = "";

        if (typeof event.payload === "object" && event.payload !== null) {
          const obj = event.payload as { userId?: string; theme?: string };
          payloadUserId = obj.userId;
          newThemeStr = obj.theme || "";
        } else if (typeof event.payload === "string") {
          newThemeStr = event.payload;
        }

        const activeUserId =
          typeof window !== "undefined"
            ? localStorage.getItem("aegis_session_user_id")
            : null;
        if (payloadUserId && activeUserId && payloadUserId !== activeUserId) {
          return;
        }

        let newTheme = newThemeStr;
        let newAccent: ThemeColorKey | null = null;

        if (newTheme.includes(":")) {
          const parts = newTheme.split(":");
          newTheme = parts[0];
          newAccent = parts[1] as ThemeColorKey;
        }

        const typedTheme = newTheme as ChromaticThemeId;
        if (VALID_THEME_IDS.has(typedTheme)) {
          setThemeState(typedTheme);
          localStorage.setItem(themeKey, typedTheme);

          if (newAccent) {
            setAccentColorState(newAccent);
            localStorage.setItem(accentKey, newAccent);
          }

          if (typedTheme === "light") {
            document.documentElement.classList.remove("dark");
          } else {
            document.documentElement.classList.add("dark");
          }

          if (typedTheme === "default") {
            document.documentElement.removeAttribute("data-theme");
          } else {
            document.documentElement.setAttribute("data-theme", typedTheme);
          }
        }
      }).then((fn) => {
        unlistenChange = fn;
      });

      listen<unknown>("restore-default-theme", (event) => {
        let payloadUserId: string | undefined;
        if (typeof event.payload === "object" && event.payload !== null) {
          payloadUserId = (event.payload as { userId?: string }).userId;
        }

        const activeUserId =
          typeof window !== "undefined"
            ? localStorage.getItem("aegis_session_user_id")
            : null;
        if (payloadUserId && activeUserId && payloadUserId !== activeUserId) {
          return;
        }

        const preferredTheme =
          (localStorage.getItem(prefThemeKey) as ChromaticThemeId | null) ||
          FALLBACK_THEME;
        const preferredAccent =
          (localStorage.getItem(prefAccentKey) as ThemeColorKey | null) ||
          "blue";

        setThemeState(preferredTheme);
        localStorage.setItem(themeKey, preferredTheme);

        setAccentColorState(preferredAccent);
        localStorage.setItem(accentKey, preferredAccent);

        if (preferredTheme === "light") {
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
        }

        if (preferredTheme === "default") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", preferredTheme);
        }
      }).then((fn) => {
        unlistenRestore = fn;
      });
    });

    return () => {
      if (unlistenChange) unlistenChange();
      if (unlistenRestore) unlistenRestore();
    };
  }, [accentKey, prefAccentKey, prefThemeKey, themeKey]);

  const setAppMode = (mode: "default" | "no_sidebar" | "portal") => {
    setAppModeState(mode);
    localStorage.setItem(modeKey, mode);
    load(storeFileName, { defaults: {}, autoSave: true }).then((store) => {
      store.set("app-mode", mode);
    });
  };

  const setTheme = (newTheme: ChromaticThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem(themeKey, newTheme);
    localStorage.setItem(prefThemeKey, newTheme); // Salva a preferência definitiva do usuário
    load(storeFileName, { defaults: {}, autoSave: true }).then((store) => {
      store.set("theme", newTheme);
    });

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
    localStorage.setItem(accentKey, color);
    localStorage.setItem(prefAccentKey, color); // Salva o destaque preferido definitivo
    load(storeFileName, { defaults: {}, autoSave: true }).then((store) => {
      store.set("accent-color", color);
    });
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
