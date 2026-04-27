import { Edit2, X } from "lucide-react";
import type { Habit } from "@/components/pages/habits/types";

interface EditHabitDialogProps {
  habit: Habit;
  setHabit: (habit: Habit | null) => void;
  onUpdate: () => void;
}

/**
 * Dialog para edição de configurações de hábitos existentes
 */
export function EditHabitDialog({
  habit,
  setHabit,
  onUpdate,
}: EditHabitDialogProps) {
  const ic =
    "bg-card border border-border text-foreground rounded-xl outline-none focus:border-teal-500/50 transition-all font-medium text-sm p-3 w-full placeholder:text-muted-foreground/50";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none p-0 m-0 cursor-default"
        onClick={() => setHabit(null)}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                Editar hábito
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ajustar configurações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHabit(null)}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="ed-name" className={lc}>
              Nome do hábito
            </label>
            <input
              id="ed-name"
              value={habit.name}
              onChange={(e) => setHabit({ ...habit, name: e.target.value })}
              className={ic}
              placeholder="Nome do hábito"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Cooldown */}
            <div className="space-y-1.5">
              <label htmlFor="ed-cooldown" className={lc}>
                {habit.habit_type === "Positive"
                  ? "Frequência (dias)"
                  : "Tolerância (dias)"}
              </label>
              <input
                id="ed-cooldown"
                type="number"
                min="1"
                value={habit.cooldown_days}
                onChange={(e) =>
                  setHabit({ ...habit, cooldown_days: Number(e.target.value) })
                }
                className={ic}
              />
            </div>

            {/* Cargas */}
            <div className="space-y-1.5">
              <label htmlFor="ed-charges" className={lc}>
                Cargas
              </label>
              <input
                id="ed-charges"
                type="number"
                min={0}
                value={habit.charges_amount}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    charges_amount: Math.max(0, Number(e.target.value)),
                  })
                }
                className={ic}
              />
            </div>
          </div>

          {/* Configurações de recarga */}
          {habit.charges_amount > 0 && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
              <label htmlFor="ed-interval" className={lc}>
                Recuperação (dias)
              </label>
              <input
                id="ed-interval"
                type="number"
                min={2}
                value={habit.charges_interval_days}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    charges_interval_days: Math.max(2, Number(e.target.value)),
                  })
                }
                className={ic}
              />
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={() => setHabit(null)}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onUpdate}
            className="flex-2 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
