import type { PomodoroState } from "./types";

interface TimerDisplayProps {
  timeLeft: number;
  state: PomodoroState | null;
  formatTime: (seconds: number) => string;
}

export function TimerDisplay({
  timeLeft,
  state,
  formatTime,
}: TimerDisplayProps) {
  const isWork = state?.cycle_type === "Work";
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`text-8xl font-mono font-bold  transition-colors ${isWork ? "text-red-400" : "text-green-400"}`}
      >
        {formatTime(timeLeft)}
      </div>
      <span
        className={`text-xs font-black uppercase  px-3 py-1 rounded-full border ${isWork ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}
      >
        {/* Traduz o tipo de ciclo para exibição amigável */}
        {isWork ? "Foco" : "Pausa"}
      </span>
    </div>
  );
}
