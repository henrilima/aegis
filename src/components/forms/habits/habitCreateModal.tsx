"use client";

import { Activity, Plus, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { getColorTheme } from "@/lib/utils";

interface HabitCreateModalProps {
  onAdd: (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
    chargesAmount: number,
    chargesInterval: number,
  ) => void;
  onClose: () => void;
}

/**
 * Modal para criação de novos hábitos e vícios
 */
export function HabitCreateModal({ onAdd, onClose }: HabitCreateModalProps) {
  useLockBodyScroll();
  const [name, setName] = useState("");
  const [cooldown, setCooldown] = useState(1);
  const [type, setType] = useState<"Positive" | "Negative">("Positive");
  const [chargesAmount, setChargesAmount] = useState(0);
  const [chargesInterval, setChargesInterval] = useState(2);

  const minCooldown = type === "Negative" ? 2 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), cooldown, type, chargesAmount, chargesInterval);
  };

  const theme = getColorTheme("teal");
  const ic = `w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:${theme.border.split(" ")[0]} transition-all placeholder:text-neutral-700 font-medium`;
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-create-title"
    >
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
            >
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Coluna Esquerda: Definição Básica */}
              <div className="flex flex-col gap-6">
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
                        ✅ Hábito Construtivo
                      </SelectItem>
                      <SelectItem
                        value="Negative"
                        className="text-sm font-medium"
                      >
                        🔒 Controle de Danos
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Coluna Direita: Lógica de Recorrência */}
              <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hcm-cooldown" className={lc}>
                      {type === "Negative" ? "Tolerância" : "Recorrência"}
                    </label>
                    <div className="relative">
                      <input
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
                    <input
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
                      <input
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
                    <p className="text-[10px] text-teal-500/80 mt-2 px-1 font-bold">
                      Mínimo de 2 dias necessário para garantir que falhas sejam
                      registradas antes da recarga.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl">
                    <p className="text-[10px] text-neutral-600 font-medium leading-relaxed">
                      Defina cargas para permitir
                      <br />
                      flexibilidade na execução
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-6 border-t border-neutral-900/50">
              <button
                type="submit"
                disabled={!name.trim()}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover} ${theme.textDark} ${theme.textDarkHover} text-sm font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40`}
              >
                <Plus className="w-5 h-5" /> Criar Hábito
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-muted-foreground hover:text-muted-foreground py-2 text-sm font-medium cursor-pointer transition-colors"
              >
                Agora não
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
