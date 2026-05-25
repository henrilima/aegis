"use client";

import { Clock, Layout, Palette } from "lucide-react";
import type { ThemeColorKey } from "@/colors.config";
import { ColorPicker } from "@/components/global/ColorPicker";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";
import { useSettingsLogic } from "./useSettingsLogic";

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
  const {
    dashboardClockStyle,
    dashboardClockAnimated,
    dashboardHeaderStyle,
    updateConfigField,
  } = useSettingsLogic();

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

      {/* Seção de Estilo do Relógio */}
      <section className="space-y-5 pt-10 border-t border-border/20">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 shrink-0" /> Estilo do Relógio da
            Dashboard
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Escolha entre 8 modelos diferentes para personalizar a estética
            visual do tempo na sua Dashboard principal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "default",
              label: "Padrão Minimalista",
              description:
                "Design clássico com tipografia geométrica limpa e segundos integrados de forma sutil.",
              preview: (
                <div className="flex items-baseline gap-1 font-black text-2xl text-foreground/90 select-none">
                  <span>08:15</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      themeStyles.text,
                    )}
                  >
                    40s
                  </span>
                </div>
              ),
            },
            {
              id: "chunky",
              label: "Moderno Completo",
              description:
                "Visualização direta e unificada com horas, minutos e segundos no mesmo tamanho e fonte padrão (suporta carrossel de rolagem reativa se ativado abaixo).",
              preview: (
                <div className="flex items-baseline gap-1 font-black text-2xl text-foreground/90 select-none">
                  <span>08:15:40</span>
                </div>
              ),
            },
            {
              id: "semanal",
              label: "Calendário Semanal",
              description:
                "Hora e minuto digitais pareados com uma fileira minimalista dos dias da semana, destacando o dia atual na cor do tema.",
              preview: (
                <div className="flex flex-col gap-1.5 select-none text-left">
                  <span className="font-black text-xl leading-none">08:15</span>
                  <div className="flex gap-1 text-[8px] font-black text-muted-foreground/45">
                    <span>D</span>
                    <span
                      className={cn(
                        "text-white px-0.5 rounded-[3px] font-black",
                        themeStyles.bg,
                      )}
                    >
                      S
                    </span>
                    <span>T</span>
                    <span>Q</span>
                    <span>Q</span>
                    <span>S</span>
                    <span>S</span>
                  </div>
                </div>
              ),
            },
            {
              id: "word",
              label: "Texto Literário",
              description:
                "Exibição do tempo por extenso escrito em português natural, com primeira letra maiúscula e leitura poética.",
              preview: (
                <div className="flex flex-col text-left leading-none font-bold text-[10px] text-foreground/90 select-none">
                  <span>Oito horas e quinze minutos</span>
                  <span
                    className={cn(
                      "text-[9px] opacity-75 mt-0.5 lowercase",
                      themeStyles.text,
                    )}
                  >
                    e quarenta segundos
                  </span>
                </div>
              ),
            },
            {
              id: "progress",
              label: "Progresso do Dia",
              description:
                "Exibição ampliada do tempo integrada com uma robusta barra de preenchimento linear que indica a porcentagem concluída do dia.",
              preview: (
                <div className="flex flex-col gap-1.5 w-full max-w-[125px] select-none text-left">
                  <span className="font-black text-sm leading-none">
                    08:15{" "}
                    <span className={cn("text-[9px] ml-0.5", themeStyles.text)}>
                      40s
                    </span>
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-foreground/10 overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-full", themeStyles.bg)}
                      style={{ width: "34%" }}
                    />
                  </div>
                  <span className="text-[7px] text-muted-foreground/60 font-bold uppercase">
                    dia 34.40%
                  </span>
                </div>
              ),
            },
            {
              id: "datetime",
              label: "Data Completa",
              description:
                "Apresentação equilibrada mostrando a hora digital de forma proeminente alinhada com o dia e data atuais por extenso em português.",
              preview: (
                <div className="flex flex-col select-none text-left leading-none">
                  <span className="font-black text-xl leading-none">08:15</span>
                  <span
                    className={cn(
                      "text-[9px] font-bold mt-1",
                      themeStyles.text,
                    )}
                  >
                    Segunda, 25 de maio
                  </span>
                </div>
              ),
            },
          ].map((styleOption) => {
            const isSelected = dashboardClockStyle === styleOption.id;

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to maintain consistent layout with themes above without nested button complications.
              <div
                key={styleOption.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  updateConfigField("dashboardClockStyle", styleOption.id)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    updateConfigField("dashboardClockStyle", styleOption.id);
                  }
                }}
                className={cn(
                  "p-5 rounded-3xl border transition-all text-left flex flex-col gap-4 group cursor-pointer relative overflow-hidden min-h-[160px]",
                  isSelected
                    ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                    : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 flex items-center justify-start">
                    {styleOption.preview}
                  </div>
                  {isSelected && (
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
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
                    {styleOption.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                    {styleOption.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle Switch para animação (Exibido para estilos que suportam animações, como o Moderno Completo) */}
        <div className="flex items-center justify-between p-5 bg-card/45 backdrop-blur-sm rounded-3xl border border-border/40 mt-6">
          <div className="space-y-1 pr-4">
            <h4 className="text-sm font-bold text-foreground">
              Animar Transição do Tempo
            </h4>
            <p className="text-xs text-muted-foreground font-medium">
              Ativa o deslizamento contínuo de rolagem vertical para os números
              no relógio Moderno Completo e animações fluidas nos ponteiros do
              relógio Analógico.
            </p>
          </div>
          <Switch
            checked={dashboardClockAnimated}
            onCheckedChange={(val) =>
              updateConfigField("dashboardClockAnimated", val)
            }
            aria-label="Ativar animação do relógio"
          />
        </div>
      </section>

      {/* Seção de Estilo do Header */}
      <section className="space-y-5 pt-10 border-t border-border/20">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Layout className="w-5 h-5 shrink-0" /> Estilo do Header da
            Dashboard
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Escolha entre 5 modelos de cabeçalho para personalizar o layout de
            saudações, clima, hábitos e botões.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "default",
              label: "Layout Padrão",
              description:
                "O clássico visual balanceado com saudações, clima, contagem de hábitos e tarefas lado a lado com o relógio.",
            },
            {
              id: "compact",
              label: "Layout Compacto",
              description:
                "Tudo condensado de forma ultra-elegante em uma única linha horizontal para economizar espaço de tela.",
            },
            {
              id: "centered",
              label: "Layout Focado",
              description:
                "Um design totalmente centralizado e simétrico que destaca as informações principais de maneira limpa.",
            },
            {
              id: "minimal",
              label: "Layout Minimalista",
              description:
                "Apenas as saudações e o relógio digital, ocultando dados secundários como clima e tarefas para foco absoluto.",
            },
            {
              id: "welcoming",
              label: "Layout Acolhedor",
              description:
                "Destaque amplo para a mensagem de saudações e informações climáticas detalhadas, com botões organizados em grade.",
            },
          ].map((headerOption) => {
            const isSelected = dashboardHeaderStyle === headerOption.id;

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to maintain consistent layout with elements above without nested button complications.
              <div
                key={headerOption.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  updateConfigField("dashboardHeaderStyle", headerOption.id)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    updateConfigField("dashboardHeaderStyle", headerOption.id);
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
                    {headerOption.label}
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
                  {headerOption.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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
