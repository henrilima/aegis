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
import { Label } from "@/components/ui/label";

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
    "w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50 transition-all placeholder:text-neutral-700 font-bold";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button 
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none p-0 m-0 cursor-default" 
        onClick={onClose} 
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-[32px] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 bg-teal-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-black text-white">Novo Roteiro</h2>
              <p className="text-[10px] font-black text-neutral-600 uppercase mt-0.5">
                Disciplina & Hábitos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Identificação */}
            <div className="space-y-2">
              <Label htmlFor="habit-name" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                O que vamos rastrear?
              </Label>
              <input
                id="habit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 20 páginas, Sem açúcar..."
                className={ic}
                required
              />
            </div>

            {/* Natureza do Registro */}
            <div className="space-y-2">
              <Label htmlFor="habit-type" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                Natureza
              </Label>
              <Select
                value={type}
                onValueChange={(v: string) => {
                  const t = v as "Positive" | "Negative";
                  setType(t);
                  if (t === "Negative") setCooldown((c) => Math.max(c, 2));
                }}
              >
                <SelectTrigger id="habit-type" className="w-full bg-neutral-900 border-neutral-800 h-12 rounded-xl text-xs font-bold shadow-none">
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
              <div className="space-y-2">
                <Label htmlFor="habit-cooldown" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  {type === "Negative" ? "Alerta (d)" : "Frequência (d)"}
                </Label>
                <input
                  id="habit-cooldown"
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
              <div className="space-y-2">
                <Label htmlFor="habit-charges" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  Vidas / Cargas
                </Label>
                <input
                  id="habit-charges"
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
                <div className="space-y-2">
                  <Label htmlFor="charge-interval" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                    Recuperação (d)
                  </Label>
                  <input
                    id="charge-interval"
                    type="number"
                    min={1}
                    value={chargesInterval}
                    onChange={(e) =>
                      setChargesInterval(Math.max(1, Number(e.target.value)))
                    }
                    className={ic}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charge-accumulate" className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                    Acúmulo
                  </Label>
                  <Select
                    value={accumulates ? "yes" : "no"}
                    onValueChange={(v: string) => setAccumulates(v === "yes")}
                  >
                    <SelectTrigger id="charge-accumulate" className="bg-neutral-900 border-neutral-800 h-12 rounded-xl text-xs font-bold shadow-none">
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
                className="w-full py-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase transition-all hover:bg-teal-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Iniciar Rastreamento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-600 hover:text-neutral-400 py-2 text-[10px] font-black uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
