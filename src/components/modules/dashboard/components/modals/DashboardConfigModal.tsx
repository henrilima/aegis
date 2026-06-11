"use client";

import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Layout,
  Move,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { WIDGET_METADATA } from "@/components/modules/dashboard/widgets/registry";
import { useSettingsLogic } from "@/components/modules/settings/useSettingsLogic";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface DashboardConfigModalProps {
  activeWidgetIds: string[];
  onToggle: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  widgetConfigs: Record<string, { interactive: boolean; limit?: number }>;
  onUpdateConfig: (
    id: string,
    config: { interactive?: boolean; limit?: number },
  ) => void;
  onClose: () => void;
  onStartVisualEdit: () => void;
}

export function DashboardConfigModal({
  activeWidgetIds,
  onToggle,
  onReorder,
  widgetConfigs,
  onUpdateConfig,
  onClose,
  onStartVisualEdit,
}: DashboardConfigModalProps) {
  const { themeStyles: theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"layout" | "widgets">("layout");
  const [internalActiveIds, setInternalActiveIds] =
    useState<string[]>(activeWidgetIds);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Busca lógica de configurações estéticas globais (relógio e cabeçalho)
  const {
    dashboardClockStyle,
    dashboardClockAnimated,
    dashboardHeaderStyle = "default",
    updateConfigField,
  } = useSettingsLogic();

  useEffect(() => {
    setInternalActiveIds(activeWidgetIds);
  }, [activeWidgetIds]);

  const handleToggle = (id: string) => {
    onToggle(id);
    setSelectedIndex(null);
  };

  const move = (
    id: string,
    direction: "up" | "down" | "to",
    toIndex?: number,
  ) => {
    const idx = internalActiveIds.indexOf(id);
    if (idx === -1) return;

    const next = [...internalActiveIds];
    let target = direction === "up" ? idx - 1 : idx + 1;
    if (direction === "to" && typeof toIndex === "number") target = toIndex;
    if (target < 0 || target >= next.length || target === idx) return;

    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);

    setInternalActiveIds(next);
    onReorder(next);
    setSelectedIndex(null);
  };

  const handleItemClick = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      move(internalActiveIds[selectedIndex], "to", index);
    }
  };

  const inactiveWidgets = WIDGET_METADATA.filter(
    (w) => !internalActiveIds.includes(w.id),
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[98vw] h-[92vh] p-0 overflow-hidden border-2 border-border gap-0 sm:max-w-none backdrop-blur-md bg-background/95 flex flex-col">
        <DialogTitle className="sr-only">personalizar dashboard</DialogTitle>

        <div className="flex h-full w-full relative">
          {/* Painel Principal */}
          <main className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0">
            <header className="flex items-center justify-between px-8 py-6 border-b border-border/20">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    theme.bg,
                  )}
                >
                  <Layout className={cn("w-5 h-5", theme.text)} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground">
                    Personalizar Dashboard
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground lowercase opacity-50">
                    {activeTab === "layout"
                      ? "estilos do cabeçalho e relógio"
                      : "organize seus widgets e defina limites"}
                  </p>
                </div>
              </div>

              {/* Seletor de Abas */}
              <div className="flex gap-1.5 p-1 bg-accent/20 rounded-xl border border-border/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("layout")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeTab === "layout"
                      ? `${theme.solid} text-white`
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Cabeçalho e Relógio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("widgets")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeTab === "widgets"
                      ? `${theme.solid} text-white`
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Widgets ativos
                </button>
              </div>
            </header>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === "layout" ? (
                <div className="space-y-10 max-w-5xl mx-auto">
                  {/* Seção Estilo do Relógio */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-black text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />{" "}
                        Estilo do Relógio
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Escolha o estilo visual para o mostrador de tempo no
                        topo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          id: "default",
                          label: "Padrão Minimalista",
                          description:
                            "Design clássico com tipografia limpa e segundos discretos.",
                        },
                        {
                          id: "chunky",
                          label: "Moderno Completo",
                          description:
                            "Exibição direta de horas, minutos e segundos em tamanho uniforme.",
                        },
                        {
                          id: "semanal",
                          label: "Calendário Semanal",
                          description:
                            "Hora digital integrada com barra horizontal de dias da semana.",
                        },
                        {
                          id: "word",
                          label: "Texto Literário",
                          description:
                            "Tempo escrito por extenso de forma literária e poética.",
                        },
                        {
                          id: "progress",
                          label: "Progresso do Dia",
                          description:
                            "Mostrador integrado a uma barra que indica a porcentagem concluída do dia.",
                        },
                        {
                          id: "datetime",
                          label: "Data Completa",
                          description:
                            "Hora digital alinhada com a data atual por extenso.",
                        },
                      ].map((styleOption) => {
                        const isSelected =
                          dashboardClockStyle === styleOption.id;

                        return (
                          // biome-ignore lint/a11y/useSemanticElements: Div com clique é necessária para layout flex de cards
                          <div
                            key={styleOption.id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              updateConfigField(
                                "dashboardClockStyle",
                                styleOption.id,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                updateConfigField(
                                  "dashboardClockStyle",
                                  styleOption.id,
                                );
                              }
                            }}
                            className={cn(
                              "p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-[120px]",
                              isSelected
                                ? `bg-card border-foreground`
                                : "bg-card border-border hover:border-foreground/30 hover:bg-accent/10",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-foreground">
                                {styleOption.label}
                              </span>
                              {isSelected && (
                                <div
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    theme.solid,
                                  )}
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {styleOption.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card/40 rounded-2xl border-2 border-border/80 mt-4">
                      <div className="space-y-0.5 text-left">
                        <h5 className="text-sm font-bold text-foreground">
                          Animar Transição do Tempo
                        </h5>
                        <p className="text-xs text-muted-foreground font-medium">
                          Ativa transições e efeitos de rolagem vertical nos
                          marcadores.
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
                  </div>

                  {/* Seção Estilo do Cabeçalho */}
                  <div className="space-y-4 pt-6 border-t border-border/20">
                    <div>
                      <h4 className="text-base font-black text-foreground flex items-center gap-2">
                        <Layout className="w-4 h-4 text-muted-foreground" />{" "}
                        Estilo do Cabeçalho
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Defina o formato de exibição da saudação, do clima e das
                        ações gerais.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          id: "default",
                          label: "Layout Padrão",
                          description:
                            "Visual balanceado com clima, contagem de hábitos e relógio lado a lado.",
                        },
                        {
                          id: "compact",
                          label: "Layout Compacto",
                          description:
                            "Tudo condensado em uma única linha horizontal para economia de tela.",
                        },
                        {
                          id: "centered",
                          label: "Layout Focado",
                          description:
                            "Design centralizado e simétrico que destaca informações de forma limpa.",
                        },
                        {
                          id: "minimal",
                          label: "Layout Minimalista",
                          description:
                            "Apenas saudações e relógio digital, mantendo o foco absoluto.",
                        },
                        {
                          id: "welcoming",
                          label: "Layout Acolhedor",
                          description:
                            "Estilo glassmorphic amplo com clima detalhado e destaque especial.",
                        },
                      ].map((headerOption) => {
                        const isSelected =
                          dashboardHeaderStyle === headerOption.id;

                        return (
                          // biome-ignore lint/a11y/useSemanticElements: Div com clique é necessária para layout flex de cards
                          <div
                            key={headerOption.id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              updateConfigField(
                                "dashboardHeaderStyle",
                                headerOption.id,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                updateConfigField(
                                  "dashboardHeaderStyle",
                                  headerOption.id,
                                );
                              }
                            }}
                            className={cn(
                              "p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-[120px]",
                              isSelected
                                ? `bg-card border-foreground`
                                : "bg-card border-border hover:border-foreground/30 hover:bg-accent/10",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-foreground">
                                {headerOption.label}
                              </span>
                              {isSelected && (
                                <div
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    theme.solid,
                                  )}
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                              {headerOption.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Aba Widgets
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  {/* Botão de Modo de Edição Visual */}
                  <div className="flex justify-center mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartVisualEdit();
                      }}
                      className={cn(
                        "flex items-center gap-2 px-8 py-3 rounded-2xl text-white font-black text-sm transition-all active:scale-95 cursor-pointer",
                        theme.solid,
                        theme.solidHover,
                      )}
                    >
                      <Move className="w-4 h-4 animate-pulse" />
                      Entrar no Modo de Edição na Tela (Drag & Drop)
                    </button>
                  </div>

                  <div className="space-y-3">
                    {internalActiveIds.map((id, idx) => {
                      const w = WIDGET_METADATA.find((m) => m.id === id);
                      if (!w) return null;

                      const isSelected = selectedIndex === idx;
                      const isMoveTarget =
                        selectedIndex !== null && !isSelected;
                      const hasLimit = [
                        "habits",
                        "tasks",
                        "alarms",
                        "reading",
                      ].includes(w.id);
                      const wConfig = widgetConfigs[w.id] || {
                        interactive: false,
                        limit: undefined,
                      };

                      return (
                        <div
                          key={w.id}
                          className="flex items-center gap-3 group animate-in fade-in duration-300"
                        >
                          <button
                            type="button"
                            onClick={() => handleItemClick(idx)}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all shrink-0",
                              isSelected
                                ? "bg-foreground border-foreground text-background scale-105"
                                : "bg-card border-border text-muted-foreground hover:border-foreground hover:text-foreground cursor-pointer",
                              isMoveTarget &&
                                "bg-accent border-dashed border-foreground/30 animate-pulse",
                            )}
                          >
                            {isMoveTarget ? (
                              <ArrowDownUp className="w-4 h-4" />
                            ) : (
                              <GripVertical className="w-4 h-4" />
                            )}
                          </button>

                          <div
                            className={cn(
                              "flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border-2 bg-card transition-all gap-4",
                              isSelected
                                ? "border-foreground"
                                : "border-border",
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/50 text-foreground">
                                <Layout className="w-4 h-4 opacity-30" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-sm font-black text-foreground">
                                  {w.name}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground lowercase opacity-50">
                                  {w.description}
                                </span>
                              </div>
                            </div>

                            {/* Controles de Ordenação, Limites e Remoção */}
                            <div className="flex items-center gap-4 ml-auto sm:ml-0">
                              {/* Controle de Limite inline para Listas */}
                              {hasLimit && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/30 border border-border/40">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Qtd:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultVal =
                                        w.id === "reading" ? 2 : 3;
                                      const currentVal =
                                        wConfig.limit ?? defaultVal;
                                      if (currentVal > 1) {
                                        onUpdateConfig(w.id, {
                                          limit: currentVal - 1,
                                        });
                                      }
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-background border border-border text-xs hover:border-foreground transition-all cursor-pointer font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black w-4 text-center">
                                    {wConfig.limit ??
                                      (w.id === "reading" ? 2 : 3)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const defaultVal =
                                        w.id === "reading" ? 2 : 3;
                                      const currentVal =
                                        wConfig.limit ?? defaultVal;
                                      if (currentVal < 15) {
                                        onUpdateConfig(w.id, {
                                          limit: currentVal + 1,
                                        });
                                      }
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-background border border-border text-xs hover:border-foreground transition-all cursor-pointer font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {selectedIndex === null && (
                                <div className="flex items-center gap-1 border-r border-border/20 pr-3">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => move(w.id, "up")}
                                    className="p-1.5 rounded-lg bg-background border border-border hover:border-foreground disabled:opacity-20 transition-all cursor-pointer"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      idx === internalActiveIds.length - 1
                                    }
                                    onClick={() => move(w.id, "down")}
                                    className="p-1.5 rounded-lg bg-background border border-border hover:border-foreground disabled:opacity-20 transition-all cursor-pointer"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggle(w.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              >
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <footer className="px-8 py-6 border-t border-border/20 bg-accent/5 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-8 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                Salvar configurações
              </button>
            </footer>
          </main>

          {/* Lado Direito: Biblioteca (Apenas na aba de widgets) */}
          {activeTab === "widgets" && (
            <aside className="w-[400px] bg-accent/30 border-l border-border/40 flex flex-col p-8 gap-6 overflow-hidden animate-in slide-in-from-right duration-350">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="text-sm font-black text-foreground">
                    Biblioteca
                  </h4>
                  <p className="text-[10px] font-bold text-muted-foreground lowercase opacity-50">
                    adicione novos widgets
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-2 gap-3 pb-8">
                  {inactiveWidgets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleToggle(w.id)}
                      className="flex flex-col p-4 rounded-2xl border-2 border-border bg-card/50 hover:border-foreground hover:bg-card transition-all text-left group cursor-pointer h-full min-h-[120px]"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-background border border-border text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-black text-foreground line-clamp-1">
                          {w.name}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground lowercase opacity-50 line-clamp-2 leading-tight">
                          {w.description}
                        </span>
                      </div>
                    </button>
                  ))}

                  {inactiveWidgets.length === 0 && (
                    <div className="col-span-2 py-12 text-center">
                      <p className="text-xs font-bold text-muted-foreground lowercase">
                        todos ativos
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
