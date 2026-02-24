import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PomodoroState } from "./types";

interface TimerControlsProps {
  state: PomodoroState | null;
  onToggle: () => void;
  onStop: () => void;
  isWork: boolean;
}

export function TimerControls({
  state,
  onToggle,
  onStop,
  isWork,
}: TimerControlsProps) {
  const themeColor = isWork
    ? "bg-red-500 hover:bg-red-400"
    : "bg-green-500 hover:bg-green-400";
  return (
    <div className="flex gap-3">
      <Button
        size="lg"
        onClick={onToggle}
        className={cn(
          "px-8 font-bold cursor-pointer text-black transition-colors shadow-lg",
          themeColor,
        )}
      >
        {state?.is_running ? (
          <>
            <Pause className="w-4 h-4 mr-2" /> Pausar
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" /> Iniciar
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="lg"
        onClick={onStop}
        disabled={!state?.is_running && state?.cycles_completed === 0}
        className="border border-neutral-700 hover:bg-neutral-800 font-bold cursor-pointer transition-colors"
      >
        <Square className="w-4 h-4 mr-2" /> Parar
      </Button>
    </div>
  );
}
