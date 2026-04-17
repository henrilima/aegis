"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getThemeColor } from "@/lib/utils";
import type { ChromaticThemeId } from "@/themes.config";

interface ThemeContextType {
  theme: ChromaticThemeId;
  setTheme: (theme: ChromaticThemeId) => void;
  themeStyles: ReturnType<typeof getThemeColor>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ChromaticThemeId>("default");

  // Carrega o tema do localStorage ao montar o componente
  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "aegis-chromatic-theme",
    ) as ChromaticThemeId;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);

      // Ajustar .dark no carregamento inicial
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
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

  const themeStyles = useMemo(() => {
    return getThemeColor(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeStyles }}>
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
