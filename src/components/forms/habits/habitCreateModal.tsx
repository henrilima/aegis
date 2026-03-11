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
  const [name, setName] = useState("");
  const [cooldown, setCooldown] = useState(1);
  const [type, setType] = useState<"Positive" | "Negative">("Positive");
  const [chargesAmount, setChargesAmount] = useState(0);
  const [chargesInterval, setChargesInterval] = useState(7);

  const minCooldown = type === "Negative" ? 2 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), cooldown, type, chargesAmount, chargesInterval);
  };

  const ic =
    "w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50 transition-all placeholder:text-neutral-600 font-medium";
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-create-title"
    >
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none p-0 m-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-[28px] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 id="habit-create-title" className="text-base font-bold text-white leading-none">
                Novo Hábito
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Disciplina &amp; Foco</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Nome */}
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
                Natureza
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
                  className="w-full bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="Positive" className="text-sm font-medium">
                    ✅ Hábito Construtivo
                  </SelectItem>
                  <SelectItem value="Negative" className="text-sm font-medium">
                    🔒 Controle de Danos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frequência + Cargas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="hcm-cooldown" className={lc}>
                  {type === "Negative" ? "Tolerância (dias)" : "Frequência (dias)"}
                </label>
                <input
                  id="hcm-cooldown"
                  type="number"
                  min={minCooldown}
                  value={cooldown}
                  onChange={(e) =>
                    setCooldown(Math.max(minCooldown, Number(e.target.value)))
                  }
                  className={ic}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="hcm-charges" className={lc}>
                  Vidas / Cargas
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

            {/* Intervalo de recuperação de cargas */}
            {chargesAmount > 0 && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label htmlFor="hcm-interval" className={lc}>
                  Recuperação (dias)
                </label>
                <input
                  id="hcm-interval"
                  type="number"
                  min={1}
                  value={chargesInterval}
                  onChange={(e) =>
                    setChargesInterval(Math.max(1, Number(e.target.value)))
                  }
                  className={ic}
                />
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/40 hover:border-teal-400 text-teal-300 hover:text-teal-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Iniciar rastreamento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
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
