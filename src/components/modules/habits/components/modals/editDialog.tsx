import { Edit2, X } from "lucide-react";
import type { Habit } from "@/components/modules/habits/types";
import { Input } from "@/components/ui/input";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

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
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const ic = cn(
    "bg-card border border-border text-foreground rounded-xl outline-none transition-all font-medium text-sm p-3 w-full placeholder:text-muted-foreground/50",
    theme.borderHover.replace("hover:", "focus:"),
  );
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
            <div
              className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
            >
              <Edit2 className={cn("w-5 h-5", theme.text)} />
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
                {habit.habitType === "Positive"
                  ? "Frequência (dias)"
                  : "Tolerância (dias)"}
              </label>
              <Input
                id="ed-cooldown"
                type="number"
                min="1"
                value={habit.cooldownDays}
                onChange={(e) =>
                  setHabit({ ...habit, cooldownDays: Number(e.target.value) })
                }
                className={ic}
              />
            </div>

            {/* Cargas */}
            <div className="space-y-1.5">
              <label htmlFor="ed-charges" className={lc}>
                Cargas
              </label>
              <Input
                id="ed-charges"
                type="number"
                min={0}
                value={habit.chargesAmount}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    chargesAmount: Math.max(0, Number(e.target.value)),
                  })
                }
                className={ic}
              />
            </div>
          </div>

          {/* Configurações de recarga */}
          {habit.chargesAmount > 0 && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
              <label htmlFor="ed-interval" className={lc}>
                Recuperação (dias)
              </label>
              <Input
                id="ed-interval"
                type="number"
                min={2}
                value={habit.chargesIntervalDays}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    chargesIntervalDays: Math.max(2, Number(e.target.value)),
                  })
                }
                className={ic}
              />
            </div>
          )}

          <div className="space-y-1.5 pt-4 border-t border-border/40">
            <label htmlFor="ed-goal" className={lc}>
              Meta de Dias (0 para sem meta)
            </label>
            <Input
              id="ed-goal"
              type="number"
              min={0}
              value={habit.goalDays || 0}
              onChange={(e) =>
                setHabit({
                  ...habit,
                  goalDays: Math.max(0, Number(e.target.value)),
                })
              }
              className={ic}
              placeholder="Ex: 10, 21, 30..."
            />
          </div>
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
            className={cn(
              "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
