"use client";

import { Layout, Palette } from "lucide-react";
import type { ThemeColorKey } from "@/colors.config";
import { ColorPicker } from "@/components/global/ColorPicker";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

export function ThemesTab() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    themeStyles,
    appMode,
    setAppMode,
  } = useTheme();

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Cabeçalho Principal */}
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
            themeStyles.bg,
          )}
        >
          <Palette className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Aparência</h2>
          <p className="text-sm text-muted-foreground">
            Escolha e personalize o estilo base do seu sistema.
          </p>
        </div>
      </div>

      {/* Seção de Temas */}
      <section className="space-y-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground">Tema Base</h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Selecione a paleta estrutural de cores do sistema e personalize a
            cor de destaque se compatível.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHROMATIC_THEMES.map((themeOption) => {
            const isSelected = theme === themeOption.id;
            const supportsAccent = ["default", "midnight", "light"].includes(
              themeOption.id,
            );

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to avoid nesting interactive elements (ColorPicker buttons) inside a native button element.
              <div
                key={themeOption.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isSelected) {
                    setTheme(themeOption.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (!isSelected) {
                      e.preventDefault();
                      setTheme(themeOption.id);
                    }
                  }
                }}
                className={cn(
                  "p-5 rounded-3xl border transition-all text-left flex flex-col gap-4 group cursor-pointer relative overflow-hidden",
                  isSelected
                    ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                    : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 border-2 border-border/50"
                    style={{ backgroundColor: themeOption.previewColor }}
                  />
                  {isSelected && (
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
                      isSelected ? themeStyles.text : "text-foreground",
                    )}
                  >
                    {themeOption.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                    {themeOption.description}
                  </p>
                </div>

                {/* Seletor de Cor de Destaque Embutido (Apenas se selecionado e compatível) */}
                {isSelected && supportsAccent && (
                  <div className="mt-1 pt-4 border-t border-border/20 space-y-2.5 animate-in slide-in-from-top-2 duration-300 w-full">
                    <div className="text-[10px] font-bold text-muted-foreground">
                      COR DE DESTAQUE
                    </div>
                    <ColorPicker
                      value={accentColor}
                      onChange={(c) =>
                        setAccentColor((c || "blue") as ThemeColorKey)
                      }
                      placeholder="Padrão"
                      defaultColor="blue"
                      className="w-full justify-start"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Banner Informativo sobre Personalização do Cabeçalho e Relógio */}
      <div className="p-6 rounded-3xl border border-dashed border-border bg-accent/25 text-left flex flex-col gap-2">
        <span className="text-sm font-black text-foreground">
          Buscando a personalização do cabeçalho e relógio?
        </span>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Essas opções foram movidas diretamente para a Dashboard para maior
          conveniência. Para configurá-las, volte ao painel principal
          (Dashboard) e clique no botão <strong>Personalizar</strong>.
        </p>
      </div>

      {/* Seção de Estilo do Aplicativo */}
      <section className="space-y-5 pt-10 border-t border-border/20">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Layout className="w-5 h-5 shrink-0" /> Estilo do aplicativo
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Escolha como o sistema é estruturado e navegue de forma mais limpa e
            focada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "default",
              label: "Modo padrão",
              description:
                "Layout tradicional com a barra lateral de navegação contínua disponível a qualquer momento.",
            },
            {
              id: "no_sidebar",
              label: "Focado (sem barra lateral)",
              description:
                "A barra lateral de navegação é desativada completamente. Configurações e utilitários são movidos para o cabeçalho.",
            },
            {
              id: "portal",
              label: "Portal de módulos",
              description:
                "Barra lateral também é desativada. O painel principal exibe atalhos interativos em grade no lugar dos widgets dinâmicos. Onde antes haviam widgets, agora existem atalhos.",
            },
          ].map((modeOption) => {
            const isSelected = appMode === modeOption.id;

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to maintain consistent layout with elements above without nested button complications.
              <div
                key={modeOption.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  setAppMode(
                    modeOption.id as "default" | "no_sidebar" | "portal",
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAppMode(
                      modeOption.id as "default" | "no_sidebar" | "portal",
                    );
                  }
                }}
                className={cn(
                  "p-5 rounded-3xl border transition-all text-left flex flex-col gap-3 group cursor-pointer relative overflow-hidden min-h-[130px]",
                  isSelected
                    ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                    : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "text-base font-black",
                      isSelected ? themeStyles.text : "text-foreground",
                    )}
                  >
                    {modeOption.label}
                  </span>
                  {isSelected && (
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        themeStyles.solid,
                      )}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
                  {modeOption.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
