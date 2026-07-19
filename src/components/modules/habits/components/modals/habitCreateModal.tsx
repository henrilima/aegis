import { Activity, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface HabitCreateModalProps {
  onAdd: (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
    chargesAmount: number,
    chargesInterval: number,
    goalDays: number,
    frequency?: "daily" | "weekdays",
    weekdays?: string,
  ) => void;
  onClose: () => void;
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
 * Modal para criação e parametrização de novos hábitos
 */
export function HabitCreateModal({ onAdd, onClose }: HabitCreateModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Positive" | "Negative">("Positive");
  const [frequency, setFrequency] = useState<"daily" | "weekdays">("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Segunda a Sexta por padrão
  const [cooldown, setCooldown] = useState(1);
  const [chargesAmount, setChargesAmount] = useState(0);
  const [chargesInterval, setChargesInterval] = useState(7);
  const [goalDays, setGoalDays] = useState(0);

  const minCooldown = type === "Negative" ? 2 : 1;

  const toggleWeekday = (val: number) => {
    setWeekdays((prev) =>
      prev.includes(val)
        ? prev.filter((d) => d !== val)
        : [...prev, val].sort(),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(
      name.trim(),
      type === "Negative" ? cooldown : 1,
      type,
      type === "Negative" ? chargesAmount : 0,
      type === "Negative" ? chargesInterval : 1,
      goalDays,
      frequency,
      type !== "Negative" ? weekdays.join(",") : "",
    );
  };

  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const ic = cn(
    "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-neutral-700 font-medium",
    theme.borderHover.replace("hover:", "focus:"),
  );
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <ModalShell
      onClose={onClose}
      size="xl"
      aria-labelledby="habit-create-title"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}>
            <Activity className={`w-5 h-5 ${theme.text}`} />
          </div>
          <div>
            <h2
              id="habit-create-title"
              className="text-base font-bold text-foreground leading-none"
            >
              Configurar Hábito
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defina suas regras de disciplina
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Área rolável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <form
          id="habit-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-8"
        >
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* Coluna Esquerda: Definição Básica */}
            <div className="flex flex-col gap-6">
              {/* O que vamos rastrear? */}
              <div className="space-y-1.5">
                <label htmlFor="hcm-name" className={lc}>
                  O que vamos rastrear?
                </label>
                <input
                  id="hcm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ler 20 páginas, sem açúcar..."
                  className={ic}
                  required
                />
              </div>

              {/* Natureza */}
              <div className="space-y-1.5">
                <label htmlFor="hcm-type" className={lc}>
                  Natureza do hábito
                </label>
                <Select
                  value={type}
                  onValueChange={(v: string) => {
                    const t = v as "Positive" | "Negative";
                    setType(t);
                    if (t === "Negative") setCooldown((c) => Math.max(c, 2));
                  }}
                >
                  <SelectTrigger
                    id="hcm-type"
                    className={`w-full bg-card border-border h-11 rounded-xl text-sm font-medium focus:ring-0 focus:${theme.border.split(" ")[0]}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem
                      value="Positive"
                      className="text-sm font-medium"
                    >
                      Hábito Diário
                    </SelectItem>
                    <SelectItem
                      value="Negative"
                      className="text-sm font-medium"
                    >
                      Controle de Vício
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coluna Direita: Lógica Adicional */}
            <div className="flex flex-col gap-6">
              {type !== "Negative" ? (
                <>
                  {/* Frequência */}
                  <div className="space-y-1.5">
                    <label htmlFor="hcm-frequency" className={lc}>
                      Frequência
                    </label>
                    <Select
                      value={frequency}
                      onValueChange={(v: "daily" | "weekdays") =>
                        setFrequency(v)
                      }
                    >
                      <SelectTrigger
                        id="hcm-frequency"
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

                  {frequency === "weekdays" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <span className={lc}>Selecione os dias</span>
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

                  {/* Meta */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <label htmlFor="hcm-goal" className={lc}>
                      Meta de Dias (opcional)
                    </label>
                    <div className="relative">
                      <Input
                        id="hcm-goal"
                        type="number"
                        min={0}
                        value={goalDays === 0 ? "" : goalDays}
                        onChange={(e) =>
                          setGoalDays(Math.max(0, Number(e.target.value)))
                        }
                        placeholder="Sem meta"
                        className={ic}
                      />
                      {goalDays > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600 uppercase">
                          Dias
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="hcm-cooldown" className={lc}>
                        Tolerância
                      </label>
                      <div className="relative">
                        <Input
                          id="hcm-cooldown"
                          type="number"
                          min={minCooldown}
                          value={cooldown}
                          onChange={(e) =>
                            setCooldown(
                              Math.max(minCooldown, Number(e.target.value)),
                            )
                          }
                          className={`${ic} pr-12`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600 uppercase">
                          Dias
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="hcm-charges" className={lc}>
                        Cargas iniciais
                      </label>
                      <Input
                        id="hcm-charges"
                        type="number"
                        min={0}
                        value={chargesAmount}
                        onChange={(e) =>
                          setChargesAmount(Math.max(0, Number(e.target.value)))
                        }
                        className={ic}
                      />
                    </div>
                  </div>

                  {chargesAmount > 0 ? (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label htmlFor="hcm-interval" className={lc}>
                        Intervalo de recuperação
                      </label>
                      <div className="relative">
                        <Input
                          id="hcm-interval"
                          type="number"
                          min={2}
                          value={chargesInterval}
                          onChange={(e) =>
                            setChargesInterval(
                              Math.max(2, Number(e.target.value)),
                            )
                          }
                          className={`${ic} pr-12`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600 uppercase">
                          Dias
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl">
                      <p className="text-[10px] text-neutral-600 font-bold leading-relaxed uppercase">
                        Cargas: Permissão para falhar e controlar vícios
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Rodapé Fixo */}
      <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="habit-form"
          disabled={!name.trim()}
          className={cn(
            "flex-2 px-4 py-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 text-white",
            theme.solid,
            theme.solidHover,
          )}
        >
          Criar Hábito
        </button>
      </div>
    </ModalShell>
  );
}
