"use client";

import { Check, Clock, Layout, Move, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveColor } from "@/colors.config";
import { DashboardClock } from "@/components/modules/dashboard/components/DashboardClock";
import { WIDGET_METADATA } from "@/components/modules/dashboard/widgets/registry";
import { useSettingsLogic } from "@/components/modules/settings/useSettingsLogic";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
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
  onReorder: _onReorder,
  widgetConfigs,
  onUpdateConfig,
  onClose,
  onStartVisualEdit,
}: DashboardConfigModalProps) {
  const { themeStyles: theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"layout" | "widgets">("layout");
  const [showPreview, setShowPreview] = useState(false);
  const [internalActiveIds, setInternalActiveIds] =
    useState<string[]>(activeWidgetIds);

  // Lógica de configurações estéticas globais (relógio e cabeçalho)
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
                <div className="flex flex-col text-left">
                  <h3 className="text-xl font-black text-foreground">
                    Personalizar Dashboard
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground lowercase opacity-50">
                    {activeTab === "layout"
                      ? "estilos do cabeçalho e relógio"
                      : "gerencie seus widgets e limites de itens"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "layout" && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-border bg-card hover:border-foreground/30"
                  >
                    Pré-visualizar
                  </button>
                )}

                {activeTab === "widgets" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartVisualEdit();
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black text-white transition-all cursor-pointer",
                      theme.solid,
                      theme.solidHover,
                    )}
                  >
                    <Move className="w-3.5 h-3.5" />
                    Organizar
                  </button>
                )}

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
              </div>
            </header>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === "layout" ? (
                <div className="flex flex-col gap-10 w-full">
                  {/* Lado a lado: Relógio e Cabeçalho */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                    {/* Seção Estilo do Relógio */}
                    <div className="space-y-4 text-left">
                      <div>
                        <h4 className="text-base font-black text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />{" "}
                          Estilo do Relógio
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Escolha o formato visual para o marcador de tempo na
                          Dashboard.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              "Hora digital integrada com fileira dos dias da semana.",
                          },
                          {
                            id: "word",
                            label: "Texto Literário",
                            description:
                              "Tempo escrito por extenso em português natural.",
                          },
                          {
                            id: "progress",
                            label: "Progresso do Dia",
                            description:
                              "Barra linear que indica a porcentagem concluída do dia.",
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
                                "p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-[110px]",
                                isSelected
                                  ? "bg-card"
                                  : "bg-card border-border hover:border-foreground/30 hover:bg-accent/10",
                              )}
                              style={
                                isSelected
                                  ? { borderColor: resolveColor(theme.name) }
                                  : undefined
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-foreground">
                                  {styleOption.label}
                                </span>
                                {isSelected && (
                                  <Check
                                    className={cn("w-3.5 h-3.5", theme.text)}
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                                {styleOption.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-card/40 rounded-xl border-2 border-border/80 mt-4">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-bold text-foreground">
                            Animar Transição do Tempo
                          </h5>
                          <p className="text-[10px] text-muted-foreground font-medium">
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
                    <div className="space-y-4 text-left">
                      <div>
                        <h4 className="text-base font-black text-foreground flex items-center gap-2">
                          <Layout className="w-4 h-4 text-muted-foreground" />{" "}
                          Estilo do Cabeçalho
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Defina o formato de exibição da saudação, clima e
                          contagem.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            id: "default",
                            label: "Layout Padrão",
                            description:
                              "Visual clássico com saudações, clima, contagem de hábitos e tarefas.",
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
                              "Design centralizado e simétrico para clareza máxima das informações.",
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
                              "Estilo glassmorphic amplo com clima detalhado e destaque.",
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
                                "p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-[110px]",
                                isSelected
                                  ? "bg-card"
                                  : "bg-card border-border hover:border-foreground/30 hover:bg-accent/10",
                              )}
                              style={
                                isSelected
                                  ? { borderColor: resolveColor(theme.name) }
                                  : undefined
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-foreground">
                                  {headerOption.label}
                                </span>
                                {isSelected && (
                                  <Check
                                    className={cn("w-3.5 h-3.5", theme.text)}
                                    strokeWidth={3}
                                  />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                                {headerOption.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Aba Widgets — Layout Vertical Empilhado
                <div className="w-full flex flex-col gap-8">
                  {/* Seção: Widgets Ativos */}
                  <div className="flex flex-col gap-4 text-left">
                    <div>
                      <h4 className="text-base font-black text-foreground">
                        Widgets Ativos
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Estes widgets estão visíveis na sua Dashboard. Clique no
                        ✓ para desativar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {internalActiveIds.map((id) => {
                        const w = WIDGET_METADATA.find((m) => m.id === id);
                        if (!w) return null;

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
                            className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-border bg-card hover:border-border/60 transition-all gap-3"
                          >
                            <div className="flex items-center gap-3 text-left min-w-0">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                  theme.bg,
                                )}
                              >
                                <Layout className={cn("w-4 h-4", theme.text)} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-foreground truncate">
                                  {w.name}
                                </span>
                                {hasLimit && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                      Qtd:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const dv = w.id === "reading" ? 2 : 3;
                                        const cv = wConfig.limit ?? dv;
                                        if (cv > 1)
                                          onUpdateConfig(w.id, {
                                            limit: cv - 1,
                                          });
                                      }}
                                      className="w-4 h-4 flex items-center justify-center rounded bg-background border border-border text-[10px] hover:border-foreground transition-all cursor-pointer font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-black w-4 text-center font-sans">
                                      {wConfig.limit ??
                                        (w.id === "reading" ? 2 : 3)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const dv = w.id === "reading" ? 2 : 3;
                                        const cv = wConfig.limit ?? dv;
                                        if (cv < 15)
                                          onUpdateConfig(w.id, {
                                            limit: cv + 1,
                                          });
                                      }}
                                      className="w-4 h-4 flex items-center justify-center rounded bg-background border border-border text-[10px] hover:border-foreground transition-all cursor-pointer font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggle(w.id)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                              title="Desativar widget"
                            >
                              <Check className="w-4 h-4" strokeWidth={3} />
                            </button>
                          </div>
                        );
                      })}

                      {internalActiveIds.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl">
                          <p className="text-xs font-bold text-muted-foreground lowercase">
                            nenhum widget ativo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="h-px bg-border/30" />

                  {/* Seção: Biblioteca de Widgets Inativos */}
                  <div className="flex flex-col gap-4 text-left">
                    <div>
                      <h4 className="text-base font-black text-foreground">
                        Biblioteca de Widgets
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Clique para adicionar um widget à sua Dashboard.
                      </p>
                    </div>

                    {inactiveWidgets.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl">
                        <p className="text-xs font-bold text-muted-foreground lowercase">
                          todos os widgets já estão ativos
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {inactiveWidgets.map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleToggle(w.id)}
                            className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-border bg-card/50 hover:border-foreground hover:bg-card transition-all text-left group cursor-pointer"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border group-hover:border-foreground/40 transition-all",
                                theme.bg,
                              )}
                            >
                              <Plus className={cn("w-4 h-4", theme.text)} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-foreground line-clamp-1">
                                {w.name}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground lowercase opacity-60 line-clamp-1 mt-0.5">
                                {w.description}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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
                Fechar
              </button>
            </footer>
          </main>
        </div>
      </DialogContent>

      {showPreview && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setShowPreview(false)}
        >
          <DialogContent className="max-w-6xl w-[95vw] sm:max-w-6xl p-8 sm:p-12 border-2 border-border backdrop-blur-md bg-background/95 rounded-3xl flex flex-col gap-8 text-left">
            <DialogTitle className="text-lg font-black text-foreground">
              Pré-visualização do Layout
            </DialogTitle>
            <div className="p-8 rounded-2xl bg-card border border-border/50">
              {/* Mock do cabeçalho e relógio baseado no estilo selecionado */}
              {dashboardHeaderStyle === "compact" ? (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-8 rounded-2xl bg-card/45 border border-border/40 backdrop-blur-sm">
                  <h2 className="text-2xl font-black text-foreground text-left">
                    Olá,{" "}
                    <span className={theme.text}>
                      {user?.username || "Viajante"}
                    </span>
                    !
                  </h2>
                  <div>
                    <DashboardClock
                      time={new Date()}
                      style={dashboardClockStyle}
                      animated={dashboardClockAnimated}
                    />
                  </div>
                </div>
              ) : dashboardHeaderStyle === "centered" ? (
                <div className="flex flex-col items-center text-center gap-8 p-10 rounded-2xl bg-card border border-border/50">
                  <div>
                    <DashboardClock
                      time={new Date()}
                      style={dashboardClockStyle}
                      animated={dashboardClockAnimated}
                    />
                  </div>
                  <h2 className="text-2xl font-black text-foreground text-center">
                    Olá,{" "}
                    <span className={theme.text}>
                      {user?.username || "Viajante"}
                    </span>
                    !
                  </h2>
                </div>
              ) : dashboardHeaderStyle === "minimal" ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-8 rounded-2xl bg-card border border-border/50">
                  <h2 className="text-2xl font-black text-foreground text-left">
                    Olá,{" "}
                    <span className={theme.text}>
                      {user?.username || "Viajante"}
                    </span>
                    !
                  </h2>
                  <div>
                    <DashboardClock
                      time={new Date()}
                      style={dashboardClockStyle}
                      animated={dashboardClockAnimated}
                    />
                  </div>
                </div>
              ) : dashboardHeaderStyle === "welcoming" ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-left space-y-3">
                    <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block">
                      Workspace Aegis
                    </span>
                    <h2 className="text-4xl font-black text-foreground">
                      Olá,{" "}
                      <span className={theme.text}>
                        {user?.username || "Viajante"}
                      </span>
                      !
                    </h2>
                  </div>
                  <div className="p-5 rounded-2xl bg-card/25 border border-border/20 backdrop-blur-md">
                    <DashboardClock
                      time={new Date()}
                      style={dashboardClockStyle}
                      animated={dashboardClockAnimated}
                    />
                  </div>
                </div>
              ) : (
                // Default Style Mockup
                <div className="flex flex-col lg:flex-row items-start justify-between gap-10 p-8 rounded-2xl bg-card border border-border/50">
                  <div className="text-left space-y-4">
                    <h2 className="text-4xl font-black text-foreground">
                      Olá,{" "}
                      <span className={theme.text}>
                        {user?.username || "Viajante"}
                      </span>
                      !
                    </h2>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border text-xs font-black w-fit">
                      <span>3/5 Hábitos</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>2 Tarefas</span>
                    </div>
                  </div>
                  <div>
                    <DashboardClock
                      time={new Date()}
                      style={dashboardClockStyle}
                      animated={dashboardClockAnimated}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer font-sans"
              >
                Fechar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
