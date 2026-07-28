"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  Check,
  Clock,
  Image,
  Layout,
  LayoutGrid,
  Move,
  Plus,
  Sliders,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { resolveColor } from "@/colors.config";
import { WIDGET_METADATA } from "@/components/modules/dashboard/widgets/registry";
import { useSettingsLogic } from "@/components/modules/settings/useSettingsLogic";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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

const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes(".mp4") ||
    lowerUrl.includes(".webm") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.startsWith("data:video/")
  );
};

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
  const [activeTab, setActiveTab] = useState<
    "relogio" | "cabecalho" | "estetica" | "widgets"
  >("relogio");
  const [internalActiveIds, setInternalActiveIds] =
    useState<string[]>(activeWidgetIds);

  const [coverInputMode, setCoverInputMode] = useState<"url" | "file">("url");

  // Lógica de configurações estéticas globais (relógio e cabeçalho)
  const { user } = useAuth();
  const {
    dashboardClockStyle,
    dashboardClockAnimated,
    dashboardHeaderStyle = "default",
    dashboardCoverImage = "",
    dashboardWelcomingGlass = true,
    dashboardCoverPositionX = 50,
    dashboardCoverPositionY = 50,
    dashboardShowDate = true,
    dashboardCoverBlur = 0,
    dashboardCoverGrayscale = 0,
    dashboardCoverSaturation = 100,
    dashboardCoverZoom = 100,
    dashboardCoverHeight = 300,
    updateConfigField,
    updateConfigFields,
  } = useSettingsLogic();

  const [localPosX, setLocalPosX] = useState(dashboardCoverPositionX);
  const [localPosY, setLocalPosY] = useState(dashboardCoverPositionY);
  const [localBlur, setLocalBlur] = useState(dashboardCoverBlur);
  const [localGrayscale, setLocalGrayscale] = useState(dashboardCoverGrayscale);
  const [localSaturation, setLocalSaturation] = useState(
    dashboardCoverSaturation,
  );
  const [localZoom, setLocalZoom] = useState(dashboardCoverZoom);
  const [localHeight, setLocalHeight] = useState(dashboardCoverHeight);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    setLocalPosX(dashboardCoverPositionX);
    setLocalPosY(dashboardCoverPositionY);
    setLocalBlur(dashboardCoverBlur);
    setLocalGrayscale(dashboardCoverGrayscale);
    setLocalSaturation(dashboardCoverSaturation);
    setLocalZoom(dashboardCoverZoom);
    setLocalHeight(dashboardCoverHeight);
  }, [
    dashboardCoverPositionX,
    dashboardCoverPositionY,
    dashboardCoverBlur,
    dashboardCoverGrayscale,
    dashboardCoverSaturation,
    dashboardCoverZoom,
    dashboardCoverHeight,
  ]);

  const handleSaveCoverAdjustments = useCallback(async () => {
    await updateConfigFields({
      dashboardCoverPositionX: localPosX,
      dashboardCoverPositionY: localPosY,
      dashboardCoverBlur: localBlur,
      dashboardCoverGrayscale: localGrayscale,
      dashboardCoverSaturation: localSaturation,
      dashboardCoverZoom: localZoom,
      dashboardCoverHeight: localHeight,
    });
  }, [
    localPosX,
    localPosY,
    localBlur,
    localGrayscale,
    localSaturation,
    localZoom,
    localHeight,
    updateConfigFields,
  ]);

  const hasCoverChanges =
    localPosX !== dashboardCoverPositionX ||
    localPosY !== dashboardCoverPositionY ||
    localBlur !== dashboardCoverBlur ||
    localGrayscale !== dashboardCoverGrayscale ||
    localSaturation !== dashboardCoverSaturation ||
    localZoom !== dashboardCoverZoom ||
    localHeight !== dashboardCoverHeight;

  useEffect(() => {
    setInternalActiveIds(activeWidgetIds);
  }, [activeWidgetIds]);

  const handleToggle = (id: string) => {
    onToggle(id);
  };

  const handleSelectLocalFile = useCallback(async () => {
    try {
      const path = await openDialog({
        multiple: false,
        filters: [
          {
            name: "Capa do Dashboard",
            extensions: ["png", "jpg", "jpeg", "webp", "mp4", "webm"],
          },
        ],
      });
      if (!path || typeof path !== "string") return;

      const savedPath = await invoke<string>("global_save_dashboard_cover", {
        sourcePath: path,
        userId: user ? String(user.id) : undefined,
      });
      const localUrl = `${convertFileSrc(savedPath)}?t=${Date.now()}`;
      updateConfigField("dashboardCoverImage", localUrl);
    } catch (err) {
      console.error("Erro ao selecionar arquivo de capa:", err);
    }
  }, [updateConfigField, user]);

  const inactiveWidgets = WIDGET_METADATA.filter(
    (w) => !internalActiveIds.includes(w.id),
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl w-[98vw] h-[92vh] p-0 overflow-hidden border-2 border-border gap-0 sm:max-w-none backdrop-blur-md bg-background/95 flex flex-col"
      >
        <DialogTitle className="sr-only">personalizar dashboard</DialogTitle>

        <div className="flex h-full w-full relative">
          {/* Sidebar - Desktop */}
          <aside className="w-72 bg-accent/30 border-r border-border/40 flex-col p-6 gap-8 hidden md:flex shrink-0">
            <div className="px-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center",
                    theme.bg,
                  )}
                >
                  <Layout className={cn("w-3.5 h-3.5", theme.text)} />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  Personalizar
                </h2>
              </div>
            </div>

            <nav className="flex flex-col gap-8 overflow-y-auto no-scrollbar pr-2">
              <div className="flex flex-col gap-1.5 text-left">
                <span className="px-2.5 text-xs font-semibold text-muted-foreground/50 mb-1">
                  Aparência
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("relogio")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent text-left",
                    activeTab === "relogio"
                      ? `${theme.bg} ${theme.text} font-semibold border-border/10`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Clock className="w-4 h-4" />
                  Relógio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cabecalho")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent text-left",
                    activeTab === "cabecalho"
                      ? `${theme.bg} ${theme.text} font-semibold border-border/10`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Layout className="w-4 h-4" />
                  Cabeçalho
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("estetica")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent text-left",
                    activeTab === "estetica"
                      ? `${theme.bg} ${theme.text} font-semibold border-border/10`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Image className="w-4 h-4" />
                  Capa e estética
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="px-2.5 text-xs font-semibold text-muted-foreground/50 mb-1">
                  Conteúdo
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("widgets")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-transparent text-left",
                    activeTab === "widgets"
                      ? `${theme.bg} ${theme.text} font-semibold border-border/10`
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Widgets ativos
                </button>
              </div>
            </nav>
          </aside>

          {/* Painel Principal */}
          <main className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0">
            <header className="flex items-center justify-between px-8 py-6 border-b border-border/20">
              <div className="flex items-center gap-4 text-left">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                    theme.bg,
                  )}
                >
                  {activeTab === "relogio" && (
                    <Clock className={cn("w-6 h-6", theme.text)} />
                  )}
                  {activeTab === "cabecalho" && (
                    <Layout className={cn("w-6 h-6", theme.text)} />
                  )}
                  {activeTab === "estetica" && (
                    <Image className={cn("w-6 h-6", theme.text)} />
                  )}
                  {activeTab === "widgets" && (
                    <LayoutGrid className={cn("w-6 h-6", theme.text)} />
                  )}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                    {activeTab === "relogio" && "Relógio"}
                    {activeTab === "cabecalho" && "Cabeçalho"}
                    {activeTab === "estetica" && "Capa e estética"}
                    {activeTab === "widgets" && "Widgets ativos"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium leading-normal">
                    {activeTab === "relogio" &&
                      "Estilos e formato do marcador de tempo"}
                    {activeTab === "cabecalho" &&
                      "Aparência do topo, data e efeitos visuais"}
                    {activeTab === "estetica" &&
                      "Imagem de capa e enquadramento"}
                    {activeTab === "widgets" &&
                      "Gerencie seus widgets e limites de itens"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "widgets" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartVisualEdit();
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer",
                      theme.solid,
                      theme.solidHover,
                    )}
                  >
                    <Move className="w-3.5 h-3.5" />
                    Organizar
                  </button>
                )}

                {/* Mobile Selector */}
                <div className="flex md:hidden gap-1 p-1 bg-accent/20 rounded-xl border border-border/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab("relogio")}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      activeTab === "relogio"
                        ? `${theme.solid} text-white`
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Relógio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cabecalho")}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      activeTab === "cabecalho"
                        ? `${theme.solid} text-white`
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Cabeçalho
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("estetica")}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      activeTab === "estetica"
                        ? `${theme.solid} text-white`
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Capa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("widgets")}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      activeTab === "widgets"
                        ? `${theme.solid} text-white`
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Widgets
                  </button>
                </div>
              </div>
            </header>

            {/* Conteúdo das Abas */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                {activeTab === "relogio" && (
                  <div className="flex flex-col gap-10 w-full text-left animate-in fade-in duration-300">
                    {/* Estilo do Relógio */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          Estilo do relógio
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Escolha o formato visual para o marcador de tempo na
                          dashboard.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            id: "default",
                            label: "Padrão minimalista",
                            description:
                              "Design clássico com tipografia limpa e segundos discretos.",
                          },
                          {
                            id: "chunky",
                            label: "Moderno completo",
                            description:
                              "Exibição direta de horas, minutos e segundos em tamanho uniforme.",
                          },
                          {
                            id: "semanal",
                            label: "Calendário semanal",
                            description:
                              "Hora digital integrada com fileira dos dias da semana.",
                          },
                          {
                            id: "word",
                            label: "Texto literário",
                            description:
                              "Tempo escrito por extenso em português natural.",
                          },
                          {
                            id: "progress",
                            label: "Progresso do dia",
                            description:
                              "Barra linear que indica a porcentagem concluída do dia.",
                          },
                          {
                            id: "datetime",
                            label: "Data completa",
                            description:
                              "Hora digital alinhada com a data atual por extenso.",
                          },
                        ].map((styleOption) => {
                          const isSelected =
                            dashboardClockStyle === styleOption.id;

                          return (
                            <button
                              key={styleOption.id}
                              type="button"
                              onClick={() =>
                                updateConfigField(
                                  "dashboardClockStyle",
                                  styleOption.id,
                                )
                              }
                              className={cn(
                                "p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-27.5 text-left",
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
                                <span className="text-xs font-bold text-foreground">
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
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-card/40 rounded-xl border border-border/80">
                        <div className="space-y-0.5 text-left">
                          <h5 className="text-xs font-bold text-foreground">
                            Animar transição do tempo
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
                  </div>
                )}

                {activeTab === "cabecalho" && (
                  <div className="flex flex-col gap-10 w-full text-left animate-in fade-in duration-300">
                    {/* Estilo do Cabeçalho */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Layout className="w-4 h-4 text-muted-foreground" />
                          Estilo do cabeçalho
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
                            label: "Layout padrão",
                            description:
                              "Visual clássico com saudações, clima, contagem de hábitos e tarefas.",
                          },
                          {
                            id: "compact",
                            label: "Layout compacto",
                            description:
                              "Tudo condensado em uma única linha horizontal para economia de tela.",
                          },
                          {
                            id: "centered",
                            label: "Layout focado",
                            description:
                              "Design centralizado e simétrico para clareza máxima das informações.",
                          },
                          {
                            id: "minimal",
                            label: "Layout minimalista",
                            description:
                              "Apenas saudações e relógio digital, mantendo o foco absoluto.",
                          },
                          {
                            id: "welcoming",
                            label: "Layout acolhedor",
                            description:
                              "Estilo glassmorphic amplo com clima detalhado e destaque.",
                          },
                        ].map((headerOption) => {
                          const isSelected =
                            dashboardHeaderStyle === headerOption.id;

                          return (
                            <button
                              key={headerOption.id}
                              type="button"
                              onClick={() =>
                                updateConfigField(
                                  "dashboardHeaderStyle",
                                  headerOption.id,
                                )
                              }
                              className={cn(
                                "p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden min-h-27.5 text-left",
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
                                <span className="text-xs font-bold text-foreground">
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
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="h-px bg-border/20" />

                    {/* Opções de exibição */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Layout className="w-4 h-4 text-muted-foreground" />
                          Opções de exibição
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Personalize elementos específicos mostrados no topo da
                          sua dashboard.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-card/40 rounded-xl border border-border/80">
                          <div className="space-y-0.5 text-left pr-4">
                            <h5 className="text-xs font-bold text-foreground">
                              Exibir calendário e data
                            </h5>
                            <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                              Mostra a data atual e o calendário auxiliar no
                              cabeçalho da dashboard.
                            </p>
                          </div>
                          <Switch
                            checked={dashboardShowDate}
                            onCheckedChange={(val) =>
                              updateConfigField("dashboardShowDate", val)
                            }
                            aria-label="Ativar exibição de data e calendário"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-card/40 rounded-xl border border-border/80">
                          <div className="space-y-0.5 text-left pr-4">
                            <h5 className="text-xs font-bold text-foreground">
                              Fundo desfocado (Glassmorphism)
                            </h5>
                            <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                              Mantém os efeitos de luz, blur e vidro no
                              cabeçalho e nos widgets.
                            </p>
                          </div>
                          <Switch
                            checked={dashboardWelcomingGlass}
                            onCheckedChange={(val) =>
                              updateConfigField("dashboardWelcomingGlass", val)
                            }
                            aria-label="Ativar fundo desfocado"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "estetica" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full text-left animate-in fade-in duration-300">
                    {/* Lado Esquerdo: Preview e Sugestões */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Pré-visualização da capa (proporção real da dashboard)
                        </span>
                        {dashboardCoverImage ? (
                          <div
                            className="relative rounded-2xl overflow-hidden border border-border/40 w-full bg-accent/5"
                            style={{ aspectRatio: `1400 / ${localHeight}` }}
                          >
                            {isVideoUrl(dashboardCoverImage) ? (
                              <video
                                src={dashboardCoverImage}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover transition-all"
                                style={{
                                  objectPosition: `${localPosX}% ${localPosY}%`,
                                  filter: `blur(${localBlur}px) grayscale(${localGrayscale}%) saturate(${localSaturation}%)`,
                                  transform: `scale(${localZoom / 100})`,
                                }}
                              />
                            ) : (
                              <img
                                src={dashboardCoverImage}
                                alt="Preview da capa"
                                className="w-full h-full object-cover transition-all"
                                style={{
                                  objectPosition: `${localPosX}% ${localPosY}%`,
                                  filter: `blur(${localBlur}px) grayscale(${localGrayscale}%) saturate(${localSaturation}%)`,
                                  transform: `scale(${localZoom / 100})`,
                                }}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setShowRemoveConfirm(true)}
                              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/85 border border-border flex items-center justify-center hover:bg-background transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                            >
                              <X className="w-4 h-4 text-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 bg-accent/5 w-full"
                            style={{ aspectRatio: `1400 / ${localHeight}` }}
                          >
                            <Image className="w-8 h-8 text-muted-foreground/30 mb-2" />
                            <p className="text-xs text-muted-foreground font-semibold">
                              Nenhuma imagem de capa selecionada
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-border/10" />

                      {/* Sugestões de Capas */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Sugestões de capas
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            Escolha um dos planos de fundo artísticos
                            pré-selecionados ou explore mais imagens no{" "}
                            <a
                              href="https://unsplash.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground hover:underline font-bold"
                            >
                              Unsplash
                            </a>
                            .
                          </p>
                        </div>

                        <div className="space-y-6">
                          {[
                            {
                              categoria: "Artísticos",
                              itens: [
                                {
                                  nome: "Ondas",
                                  url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Retro Synthwave",
                                  url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1500&q=80",
                                },
                              ],
                            },
                            {
                              categoria: "Paisagens",
                              itens: [
                                {
                                  nome: "Templo de Kyoto",
                                  url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Floresta Névoa",
                                  url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1500&q=80",
                                },
                              ],
                            },
                            {
                              categoria: "Universo",
                              itens: [
                                {
                                  nome: "Nebulosa Rosada",
                                  url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Céu Estrelado",
                                  url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Aurora Boreal",
                                  url: "https://images.unsplash.com/photo-1483086431886-3590a88317fe?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Galáxia Cósmica",
                                  url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1500&q=80",
                                },
                              ],
                            },
                            {
                              categoria: "Abstrato",
                              itens: [
                                {
                                  nome: "Tintas Fluídas",
                                  url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Gradiente Escuro",
                                  url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Macro de Gotas",
                                  url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1500&q=80",
                                },
                                {
                                  nome: "Matrix Digital",
                                  url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1500&q=80",
                                },
                              ],
                            },
                          ].map((grupo) => (
                            <div key={grupo.categoria} className="space-y-2">
                              <span className="text-xs font-bold text-muted-foreground/80">
                                {grupo.categoria}
                              </span>
                              <div className="grid grid-cols-2 gap-3">
                                {grupo.itens.map((preset) => (
                                  <button
                                    key={preset.nome}
                                    type="button"
                                    onClick={() =>
                                      updateConfigField(
                                        "dashboardCoverImage",
                                        preset.url,
                                      )
                                    }
                                    className={cn(
                                      "relative h-28 rounded-xl overflow-hidden border transition-all text-left cursor-pointer group",
                                      dashboardCoverImage === preset.url
                                        ? "border-2"
                                        : "border-border hover:border-foreground/40",
                                    )}
                                    style={
                                      dashboardCoverImage === preset.url
                                        ? {
                                            borderColor: resolveColor(
                                              theme.name,
                                            ),
                                          }
                                        : undefined
                                    }
                                  >
                                    <img
                                      src={preset.url}
                                      alt={preset.nome}
                                      className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/45 to-transparent p-3 flex items-end">
                                      <span className="text-xs font-bold text-white leading-none truncate w-full">
                                        {preset.nome}
                                      </span>
                                    </div>
                                    {dashboardCoverImage === preset.url && (
                                      <div className="absolute top-2 right-2 bg-background/80 w-5 h-5 rounded-full flex items-center justify-center border border-border">
                                        <Check
                                          className={cn(
                                            "w-3.5 h-3.5",
                                            theme.text,
                                          )}
                                          strokeWidth={3}
                                        />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Controles e Ajustes */}
                    <div className="space-y-6">
                      {/* Configurações de Capa */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Image className="w-4 h-4 text-muted-foreground" />
                            Imagem de capa
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            Recomendado: mínimo 1500 × 500 px para boa
                            qualidade.
                          </p>
                        </div>

                        <div className="flex rounded-xl bg-accent/20 p-1 border border-border/10 w-fit">
                          {(["file", "url"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setCoverInputMode(mode)}
                              className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                coverInputMode === mode
                                  ? `${theme.solid} text-white`
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                              )}
                            >
                              {mode === "file"
                                ? "Arquivo local"
                                : "URL da imagem"}
                            </button>
                          ))}
                        </div>

                        {coverInputMode === "file" ? (
                          <button
                            type="button"
                            onClick={handleSelectLocalFile}
                            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-foreground/30 bg-accent/5 hover:bg-accent/10 transition-all text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Upload className="w-4 h-4 shrink-0" />
                            <span>
                              {dashboardCoverImage &&
                              !dashboardCoverImage.startsWith("http")
                                ? "Substituir arquivo…"
                                : "Escolher arquivo (Imagens, MP4)"}
                            </span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <input
                              id="dashboardCoverImageUrl"
                              type="text"
                              placeholder="https://exemplo.com/imagem.jpg"
                              value={
                                dashboardCoverImage?.startsWith("data:")
                                  ? ""
                                  : (dashboardCoverImage ?? "")
                              }
                              onChange={(e) =>
                                updateConfigField(
                                  "dashboardCoverImage",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl bg-accent/15 border-2 border-border focus:border-foreground/30 focus:outline-hidden text-foreground"
                            />
                            <p className="text-[10px] text-muted-foreground font-medium leading-normal">
                              Encontre fotos incríveis no{" "}
                              <a
                                href="https://unsplash.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground hover:underline font-bold"
                              >
                                Unsplash
                              </a>
                              .
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ajustes e Filtros da Capa */}
                      {dashboardCoverImage && (
                        <div className="p-5 rounded-3xl border border-border/40 bg-accent/5 space-y-5">
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-bold text-foreground">
                              Ajustes e Filtros da Capa
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Posição horizontal</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localPosX}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={localPosX}
                                onChange={(e) =>
                                  setLocalPosX(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Posição vertical</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localPosY}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={localPosY}
                                onChange={(e) =>
                                  setLocalPosY(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Altura da capa</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localHeight}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={150}
                                max={500}
                                value={localHeight}
                                onChange={(e) =>
                                  setLocalHeight(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Zoom da imagem</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localZoom}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={100}
                                max={200}
                                value={localZoom}
                                onChange={(e) =>
                                  setLocalZoom(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Desfoque (Blur)</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localBlur}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={20}
                                value={localBlur}
                                onChange={(e) =>
                                  setLocalBlur(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Escala de cinzas</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localGrayscale}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={localGrayscale}
                                onChange={(e) =>
                                  setLocalGrayscale(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>

                            <div className="space-y-1.5 text-left md:col-span-2">
                              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                                <span>Saturação</span>
                                <span className={cn("font-bold", theme.text)}>
                                  {localSaturation}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={200}
                                value={localSaturation}
                                onChange={(e) =>
                                  setLocalSaturation(Number(e.target.value))
                                }
                                className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: resolveColor(theme.name) }}
                              />
                            </div>
                          </div>

                          {hasCoverChanges && (
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleSaveCoverAdjustments}
                                className={cn(
                                  "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer active:scale-95 animate-in fade-in duration-300",
                                  theme.solid,
                                  theme.solidHover,
                                )}
                              >
                                <Check
                                  className="w-3.5 h-3.5"
                                  strokeWidth={3}
                                />
                                Salvar Ajustes
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "widgets" && (
                  <div className="w-full flex flex-col gap-8 text-left animate-in fade-in duration-300">
                    {/* Seção: Widgets Ativos */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-base font-bold text-foreground">
                          Widgets ativos
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Estes widgets estão visíveis na sua Dashboard. Clique
                          no ✓ para desativar.
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
                                  <Layout
                                    className={cn("w-4 h-4", theme.text)}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-foreground truncate">
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
                                      <span className="text-xs font-semibold w-4 text-center font-sans">
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
                            <p className="text-xs font-bold text-muted-foreground">
                              Nenhum widget ativo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border/30" />

                    {/* Biblioteca de Widgets Inativos */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="text-base font-bold text-foreground">
                          Biblioteca de Widgets
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Clique para adicionar um widget à sua Dashboard.
                        </p>
                      </div>

                      {inactiveWidgets.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl">
                          <p className="text-xs font-bold text-muted-foreground">
                            Todos os widgets já estão ativos
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
                                <span className="text-xs font-semibold text-foreground line-clamp-1">
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
            </div>

            <footer className="px-8 py-6 border-t border-border/20 bg-accent/5 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                Fechar
              </button>
            </footer>
            {showRemoveConfirm && (
              <ConfirmModal
                disablePortal={true}
                title="Remover imagem de capa"
                description="Deseja remover a imagem de capa atual da sua dashboard?"
                confirmLabel="Remover"
                cancelLabel="Cancelar"
                variant="danger"
                onConfirm={async () => {
                  try {
                    await invoke("global_delete_dashboard_cover", {
                      userId: user ? String(user.id) : undefined,
                    });
                  } catch (err) {
                    console.error("Erro ao deletar arquivo de capa:", err);
                  }
                  updateConfigField("dashboardCoverImage", "");
                  setShowRemoveConfirm(false);
                }}
                onCancel={() => setShowRemoveConfirm(false)}
              />
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
