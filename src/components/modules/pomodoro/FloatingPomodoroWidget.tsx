// src/components/modules/pomodoro/FloatingPomodoroWidget.tsx
"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Pause, Play, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { usePomodoroLogic } from "./usePomodoroLogic";

/**
 * Componente que representa o widget flutuante do Pomodoro.
 * Exibe uma interface minimalista e compacta para controle do timer.
 */
export function FloatingPomodoroWidget() {
  const { state, formattedTime, loading, actions } = usePomodoroLogic();
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);
  const [windowSize, setWindowSize] = useState({ width: 240, height: 180 });

  // Monitora o redimensionamento da janela para atualizar o layout responsivo
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Define o tamanho inicial
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-card p-4 select-none">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground/60 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-[9px] font-bold text-foreground">
            Sincronizando...
          </span>
        </div>
      </div>
    );
  }

  const isWork = state?.cycleType === "Work";

  // Fecha a janela flutuante nativamente
  const handleClose = () => {
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      getCurrentWindow().close();
    }
  };

  // Define quebras de responsividade baseadas no tamanho da janela
  const isTinyHeight = windowSize.height < 110;
  const isTinyWidth = windowSize.width < 185; // Aumentado ligeiramente para comportar a barra lateral
  const isMicro = windowSize.width < 145 || windowSize.height < 90;

  // Condição para layout horizontal: muito largo e pouco alto
  const isWideAndShort =
    windowSize.width > windowSize.height * 1.4 && windowSize.height < 130;

  // Tamanho do texto do temporizador dinâmico
  let timerTextClass = "text-5xl";
  if (isMicro) {
    timerTextClass = "text-2xl";
  } else if (isTinyWidth || isTinyHeight) {
    timerTextClass = "text-3xl";
  }

  return (
    <div className="w-screen h-screen flex flex-row bg-card text-foreground font-sans select-none relative overflow-hidden">
      {/* Barra de arraste (drag region) na lateral esquerda */}
      <div
        data-tauri-drag-region
        className="h-full w-5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-neutral-800/10 border-r border-border/30 bg-background/15 shrink-0 gap-1.5"
        title="Arraste para mover"
      >
        <div
          data-tauri-drag-region
          className="w-1.5 h-1.5 bg-muted-foreground/45 rounded-full"
        />
        <div
          data-tauri-drag-region
          className="w-1.5 h-1.5 bg-muted-foreground/45 rounded-full"
        />
        <div
          data-tauri-drag-region
          className="w-1.5 h-1.5 bg-muted-foreground/45 rounded-full"
        />
      </div>

      {/* Conteúdo principal */}
      <div
        data-tauri-drag-region
        className="flex-1 h-full flex flex-col items-center justify-between p-3 relative overflow-hidden"
      >
        {/* Botão de Fechar discreto no canto superior direito */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-lg text-muted-foreground hover:bg-muted/80 transition-colors z-50 cursor-pointer border-none bg-transparent"
          title="Fechar Widget"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {isWideAndShort ? (
          /* Layout Horizontal: Timer à esquerda e Botões à direita */
          <div
            data-tauri-drag-region
            className="flex-1 flex items-center justify-between w-full px-1.5 gap-4"
          >
            <div
              data-tauri-drag-region
              className="flex flex-col items-start gap-0.5 justify-center"
            >
              {/* Tipo de Ciclo em formato super compacto */}
              <span
                className={cn(
                  "font-bold tracking-wide uppercase text-[7px]",
                  isWork ? theme.text : "text-muted-foreground",
                )}
              >
                {isWork ? "Foco" : "Pausa"}
              </span>
              <span
                className={cn(
                  "font-black font-outfit tabular-nums transition-all leading-none",
                  timerTextClass,
                  isWork ? theme.text : "text-muted-foreground",
                )}
              >
                {formattedTime}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pr-6">
              <button
                onClick={actions.toggleTimer}
                className={cn(
                  "flex items-center justify-center transition-all rounded-lg font-outfit text-white w-8 h-8 p-0 border-none cursor-pointer",
                  isWork
                    ? cn(theme.solid, theme.solidHover)
                    : "bg-primary/20 hover:bg-primary/30 text-foreground",
                )}
                type="button"
                title={state?.isRunning ? "Pausar" : "Iniciar"}
              >
                {state?.isRunning ? (
                  <Pause className="fill-current w-4 h-4" />
                ) : (
                  <Play className="fill-current w-4 h-4" />
                )}
              </button>
              <button
                onClick={actions.stopTimer}
                disabled={!state?.isRunning && state?.cyclesCompleted === 0}
                className="flex items-center justify-center border border-border bg-muted/30 hover:bg-muted/80 text-muted-foreground disabled:opacity-30 rounded-lg transition-all font-bold w-8 h-8 p-0 cursor-pointer"
                type="button"
                title="Parar"
              >
                <Square className="fill-current w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Layout Vertical Tradicional */
          <>
            {/* Tipo de Ciclo */}
            {!isTinyHeight && (
              <div className="pt-0.5 flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "font-bold px-3 py-1 rounded-full border tracking-wide uppercase",
                    isTinyWidth ? "text-[8px] px-2 py-0.5" : "text-[9px]",
                    isWork
                      ? cn(theme.bg, theme.border, theme.text)
                      : "bg-muted border-border text-muted-foreground",
                  )}
                >
                  {isWork ? "Foco" : "Pausa"}
                </span>
              </div>
            )}

            {/* Temporizador */}
            <div
              data-tauri-drag-region
              className="flex-1 flex items-center justify-center w-full"
            >
              <span
                data-tauri-drag-region
                className={cn(
                  "font-black font-outfit tabular-nums transition-all leading-none",
                  timerTextClass,
                  isWork ? theme.text : "text-muted-foreground",
                )}
              >
                {formattedTime}
              </span>
            </div>

            {/* Controles do Widget */}
            <div className="w-full flex justify-center gap-1.5 pb-0.5">
              <button
                onClick={actions.toggleTimer}
                className={cn(
                  "flex items-center justify-center transition-all rounded-lg font-outfit text-white border-none cursor-pointer",
                  isWork
                    ? cn(theme.solid, theme.solidHover)
                    : "bg-primary/20 hover:bg-primary/30 text-foreground",
                  isTinyWidth ? "w-8 h-8 p-0" : "w-24 h-8 text-xs font-black",
                )}
                type="button"
                title={state?.isRunning ? "Pausar" : "Iniciar"}
              >
                {state?.isRunning ? (
                  <Pause
                    className={cn(
                      "fill-current",
                      isTinyWidth ? "w-4 h-4" : "w-3.5 h-3.5 mr-1.5",
                    )}
                  />
                ) : (
                  <Play
                    className={cn(
                      "fill-current",
                      isTinyWidth ? "w-4 h-4" : "w-3.5 h-3.5 mr-1.5",
                    )}
                  />
                )}
                {!isTinyWidth && (state?.isRunning ? "Pausar" : "Iniciar")}
              </button>
              <button
                onClick={actions.stopTimer}
                disabled={!state?.isRunning && state?.cyclesCompleted === 0}
                className={cn(
                  "flex items-center justify-center border border-border bg-muted/30 hover:bg-muted/80 text-muted-foreground disabled:opacity-30 rounded-lg transition-all font-bold cursor-pointer",
                  isTinyWidth ? "w-8 h-8 p-0" : "w-20 h-8 text-xs",
                )}
                type="button"
                title="Parar"
              >
                <Square
                  className={cn(
                    "fill-current",
                    isTinyWidth ? "w-3.5 h-3.5" : "w-3 h-3 mr-1.5",
                  )}
                />
                {!isTinyWidth && "Parar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
