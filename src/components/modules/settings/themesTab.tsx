"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

export function ThemesTab() {
  const { theme, setTheme, themeStyles } = useTheme();

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            themeStyles.bg,
          )}
        >
          <Palette className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Aparência</h2>
          <p className="text-sm text-muted-foreground">
            Personalize a identidade visual do seu Aegis.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHROMATIC_THEMES.map((themeOption) => (
          <button
            key={themeOption.id}
            type="button"
            onClick={() => setTheme(themeOption.id)}
            className={cn(
              "p-5 rounded-2xl border transition-all text-left flex flex-col gap-4 group cursor-pointer relative overflow-hidden",
              theme === themeOption.id
                ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-12 h-12 rounded-xl shrink-0 border-2 border-border/50"
                style={{ backgroundColor: themeOption.previewColor }}
              />
              {theme === themeOption.id && (
                <div
                  className={cn("w-2 h-2 rounded-full", themeStyles.solid)}
                />
              )}
            </div>

            <div className="flex-1">
              <span
                className={cn(
                  "text-base font-bold",
                  theme === themeOption.id
                    ? themeStyles.text
                    : "text-foreground",
                )}
              >
                {themeOption.label}
              </span>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {themeOption.description}
              </p>
            </div>

            {/* Marcador lateral sutil */}
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className={cn(
                  "w-1 h-8 rounded-full",
                  theme === themeOption.id ? themeStyles.solid : "bg-border",
                )}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
