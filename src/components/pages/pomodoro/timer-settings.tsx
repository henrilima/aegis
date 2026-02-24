import { Input } from "@/components/ui/input";
import type { PomodoroState } from "./types";

interface TimerSettingsProps {
  state: PomodoroState | null;
  onUpdateConfig: (key: "work_minutes" | "break_minutes", val: string) => void;
}

export function TimerSettings({ state, onUpdateConfig }: TimerSettingsProps) {
  return (
    <div className="flex gap-4 w-full max-w-xs mx-auto">
      <div className="flex-1 space-y-1.5">
        <p className="text-[10px] font-black uppercase  text-neutral-500 text-center">
          Foco
        </p>
        <Input
          type="number"
          value={state?.work_minutes || 25}
          onChange={(e) => onUpdateConfig("work_minutes", e.target.value)}
          disabled={state?.is_running}
          className="bg-neutral-950 border-neutral-700 font-mono text-center"
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <p className="text-[10px] font-black uppercase  text-neutral-500 text-center">
          Pausa
        </p>
        <Input
          type="number"
          value={state?.break_minutes || 5}
          onChange={(e) => onUpdateConfig("break_minutes", e.target.value)}
          disabled={state?.is_running}
          className="bg-neutral-950 border-neutral-700 font-mono text-center"
        />
      </div>
    </div>
  );
}
