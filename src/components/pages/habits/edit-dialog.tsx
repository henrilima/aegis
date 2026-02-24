import { Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Habit } from "./types";

interface EditHabitDialogProps {
  habit: Habit;
  setHabit: (habit: Habit | null) => void;
  onUpdate: () => void;
}

export function EditHabitDialog({
  habit,
  setHabit,
  onUpdate,
}: EditHabitDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => setHabit(null)}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-xl border border-neutral-700">
              <Edit2 className="w-4 h-4 text-neutral-300" />
            </div>
            <h2 className="text-base font-bold">Editar Hábito</h2>
          </div>
          <button
            type="button"
            onClick={() => setHabit(null)}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Nome
            </p>
            <Input
              value={habit.name}
              onChange={(e) => setHabit({ ...habit, name: e.target.value })}
              className="bg-neutral-900 border-neutral-700"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Cooldown (Dias)
            </p>
            <Input
              type="number"
              min="1"
              value={habit.cooldown_days}
              onChange={(e) =>
                setHabit({ ...habit, cooldown_days: Number(e.target.value) })
              }
              className="bg-neutral-900 border-neutral-700"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => setHabit(null)}
              className="flex-1 border border-neutral-700 hover:bg-neutral-800 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={onUpdate}
              className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-bold cursor-pointer"
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
