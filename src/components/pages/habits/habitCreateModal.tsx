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
    accumulates: boolean,
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

  // Configurações de cargas (opcional)
  const [chargesAmount, setChargesAmount] = useState(0);
  const [chargesInterval, setChargesInterval] = useState(7);
  const [accumulates, setAccumulates] = useState(false);

  const minCooldown = type === "Negative" ? 2 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(
      name.trim(),
      cooldown,
      type,
      chargesAmount,
      chargesInterval,
      accumulates,
    );
  };

  const ic =
    "w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50 transition-all placeholder:text-neutral-700 font-bold";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 bg-linear-to-br from-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Novo Roteiro</h2>
              <p className="text-[10px] font-black text-neutral-600 uppercase mt-0.5">
                Disciplina & Hábitos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Identificação */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                O que vamos rastrear?
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 20 páginas, Sem açúcar..."
                className={ic}
                required
              />
            </div>

            {/* Natureza do Registro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                Natureza
              </label>
              <Select
                value={type}
                onValueChange={(v) => {
                  const t = v as "Positive" | "Negative";
                  setType(t);
                  if (t === "Negative") setCooldown((c) => Math.max(c, 2));
                }}
              >
                <SelectTrigger className="w-full bg-neutral-900 border-neutral-800 h-[44px] rounded-2xl text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="Positive" className="text-xs font-bold">
                    ✅ Hábito Construtivo
                  </SelectItem>
                  <SelectItem value="Negative" className="text-xs font-bold">
                    🔒 Controle de Danos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Meta Temporal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  {type === "Negative" ? "Alerta (d)" : "Frequência (d)"}
                </label>
                <input
                  type="number"
                  min={minCooldown}
                  value={cooldown}
                  onChange={(e) =>
                    setCooldown(Math.max(minCooldown, Number(e.target.value)))
                  }
                  className={ic}
                />
              </div>

              {/* Quantidade de "Vidas" / Cargas */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  Vidas / Cargas
                </label>
                <input
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

            {/* Expansão de Cargas */}
            {chargesAmount > 0 && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                    Recuperação (d)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={chargesInterval}
                    onChange={(e) =>
                      setChargesInterval(Math.max(1, Number(e.target.value)))
                    }
                    className={ic}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                    Acúmulo
                  </label>
                  <Select
                    value={accumulates ? "yes" : "no"}
                    onValueChange={(v) => setAccumulates(v === "yes")}
                  >
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 h-[44px] rounded-2xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="yes" className="text-xs font-bold">
                        Sim
                      </SelectItem>
                      <SelectItem value="no" className="text-xs font-bold">
                        Não
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Ações de Rodapé */}
            <div className="flex flex-col gap-3 pt-3">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-teal-600 hover:bg-teal-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-teal-500/10 cursor-pointer text-xs uppercase transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Plus className="w-4 h-4 inline mr-2" /> Iniciar Rastreamento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-600 hover:text-neutral-400 py-2 text-xs font-black uppercase cursor-pointer transition-colors"
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
