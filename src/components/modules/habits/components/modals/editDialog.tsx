import { Edit2, X } from "lucide-react";
import type { Habit } from "@/components/modules/habits/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface EditHabitDialogProps {
  habit: Habit;
  setHabit: (habit: Habit | null) => void;
  onUpdate: () => void;
}

const DAYS_LIST = [
  { value: 1, label: "S" },
  { value: 2, label: "T" },
  { value: 3, label: "Q" },
  { value: 4, label: "Q" },
  { value: 5, label: "S" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

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

  const weekdays = habit.weekdays
    ? habit.weekdays.split(",").map(Number)
    : [1, 2, 3, 4, 5];

  const toggleWeekday = (val: number) => {
    const next = weekdays.includes(val)
      ? weekdays.filter((d) => d !== val)
      : [...weekdays, val].sort();
    setHabit({ ...habit, weekdays: next.join(",") });
  };

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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* Coluna Esquerda */}
            <div className="flex flex-col gap-6">
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

              {/* Natureza */}
              <div className="space-y-1.5">
                <label htmlFor="ed-natureza" className={lc}>
                  Natureza do hábito
                </label>
                <input
                  id="ed-natureza"
                  value={
                    habit.habitType === "Positive"
                      ? "Hábito Diário"
                      : "Controle de Vício"
                  }
                  disabled
                  className={cn(ic, "opacity-60 cursor-not-allowed")}
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="flex flex-col gap-6">
              {habit.habitType === "Positive" ? (
                <>
                  {/* Frequência */}
                  <div className="space-y-1.5">
                    <label htmlFor="ed-frequency" className={lc}>
                      Frequência
                    </label>
                    <Select
                      value={habit.frequency || "daily"}
                      onValueChange={(v: "daily" | "weekdays") =>
                        setHabit({ ...habit, frequency: v })
                      }
                    >
                      <SelectTrigger
                        id="ed-frequency"
                        className="w-full bg-card border-border h-11 rounded-xl text-sm font-medium focus:ring-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem
                          value="daily"
                          className="text-sm font-medium"
                        >
                          Todos os dias
                        </SelectItem>
                        <SelectItem
                          value="weekdays"
                          className="text-sm font-medium"
                        >
                          Dias específicos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {habit.frequency === "weekdays" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <span className={lc}>Dias da semana</span>
                      <div className="flex gap-2 justify-between">
                        {DAYS_LIST.map((day) => {
                          const active = weekdays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleWeekday(day.value)}
                              className={cn(
                                "w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer border",
                                active
                                  ? cn(
                                      theme.solid,
                                      "border-transparent text-white",
                                    )
                                  : "bg-card border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Meta de Dias */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
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
                </>
              ) : (
                <>
                  <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cooldown */}
                      <div className="space-y-1.5">
                        <label htmlFor="ed-cooldown" className={lc}>
                          Tolerância (dias)
                        </label>
                        <Input
                          id="ed-cooldown"
                          type="number"
                          min={1}
                          value={habit.cooldownDays}
                          onChange={(e) =>
                            setHabit({
                              ...habit,
                              cooldownDays: Number(e.target.value),
                            })
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
                              chargesAmount: Math.max(
                                0,
                                Number(e.target.value),
                              ),
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
                              chargesIntervalDays: Math.max(
                                2,
                                Number(e.target.value),
                              ),
                            })
                          }
                          className={ic}
                        />
                      </div>
                    )}
                  </div>

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
                </>
              )}
            </div>
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
