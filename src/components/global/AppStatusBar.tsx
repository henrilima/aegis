"use client";

import { Command, Pause, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDiscordRpc } from "@/context/DiscordRpcContext";
import { useTaskTimerContext } from "@/context/TaskTimerContext";

export function AppStatusBar() {
  const router = useRouter();
  const { activeTimerTaskId, sessionSeconds, baseSeconds, pauseTimer } =
    useTaskTimerContext();
  const { isEnabled, isConnected } = useDiscordRpc();

  const totalSeconds = baseSeconds + sessionSeconds;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleOpenGlobalSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );
  };

  return (
    <div className="fixed bottom-3 right-6 z-40 hidden sm:flex items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Widget de Tarefa Ativa (se houver timer rodando) */}
      {activeTimerTaskId !== null && (
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border/40 px-3 py-1.5 rounded-full text-xs font-medium text-foreground">
          <div className="flex items-center gap-1.5 text-indigo-500 font-bold">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span>{formatTimer(totalSeconds)}</span>
          </div>

          <span className="text-muted-foreground/40">·</span>

          <button
            type="button"
            onClick={() => router.push("/dashboard/tasks")}
            className="truncate max-w-35 text-muted-foreground hover:text-foreground cursor-pointer text-left font-medium"
            title="Ir para módulo de tarefas"
          >
            Tarefa em andamento
          </button>

          <button
            type="button"
            onClick={() => pauseTimer()}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
            title="Pausar e salvar cronômetro"
          >
            <Pause className="w-3 h-3 text-amber-500" />
          </button>
        </div>
      )}

      {/* Chip de Status do Discord (se ativo e conectado) */}
      {isEnabled && isConnected && (
        <div
          className="flex items-center gap-1.5 bg-card/85 backdrop-blur-md border border-border/40 px-2.5 py-1.5 rounded-full text-xs text-muted-foreground"
          title="Discord Rich Presence ativo e conectado"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
          <span className="text-[11px] font-medium text-foreground">
            Discord
          </span>
        </div>
      )}

      {/* Chip de Atalho Rápido */}
      <button
        type="button"
        onClick={handleOpenGlobalSearch}
        className="flex items-center gap-1.5 bg-card/85 backdrop-blur-md border border-border/40 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        title="Busca rápida e comandos"
      >
        <Command className="w-3 h-3" />
        <span className="font-medium text-[11px]">Busca</span>
        <kbd className="bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded text-[9px] font-bold">
          Ctrl K
        </kbd>
      </button>
    </div>
  );
}
