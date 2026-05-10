"use client";

import { Check, Palette } from "lucide-react";
import { SELECTABLE_COLORS } from "@/colors.config";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

export function ThemesTab() {
  const { theme, setTheme, accentColor, setAccentColor, themeStyles } =
    useTheme();

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-500">
      {/* Seção de Temas */}
      <section className="space-y-6">
        <div className="flex items-center gap-5">
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
              Escolha o estilo base do seu sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHROMATIC_THEMES.map((themeOption) => (
            <button
              key={themeOption.id}
              type="button"
              onClick={() => setTheme(themeOption.id)}
              className={cn(
                "p-5 rounded-3xl border transition-all text-left flex flex-col gap-4 group cursor-pointer relative overflow-hidden",
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
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      themeStyles.solid,
                    )}
                  />
                )}
              </div>

              <div className="flex-1">
                <span
                  className={cn(
                    "text-base font-black",
                    theme === themeOption.id
                      ? themeStyles.text
                      : "text-foreground",
                  )}
                >
                  {themeOption.label}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                  {themeOption.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Seção de Cor de Destaque (Dinâmica) */}
      {["default", "midnight", "light"].includes(theme) && (
        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col">
            <h3 className="text-lg font-black text-foreground">
              Cor de Destaque
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Personalize o tom principal do tema selecionado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {SELECTABLE_COLORS.map((colorOption) => (
              <button
                key={colorOption.key}
                type="button"
                onClick={() => setAccentColor(colorOption.key)}
                className={cn(
                  "w-10 h-10 rounded-full transition-all active:scale-90 flex items-center justify-center border-2",
                  accentColor === colorOption.key
                    ? "border-white scale-110 shadow-lg shadow-black/40"
                    : "border-transparent hover:scale-105 opacity-80 hover:opacity-100",
                )}
                style={{ backgroundColor: colorOption.hex }}
                title={colorOption.label}
              >
                {accentColor === colorOption.key && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
