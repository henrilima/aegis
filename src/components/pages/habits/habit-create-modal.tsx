import { Activity, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ) => void;
  onClose: () => void;
}

export function HabitCreateModal({ onAdd, onClose }: HabitCreateModalProps) {
  const [name, setName] = useState("");
  const [cooldown, setCooldown] = useState(2);
  const [type, setType] = useState<"Positive" | "Negative">("Positive");

  const minCooldown = type === "Negative" ? 2 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), cooldown, type);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <Activity className="w-4 h-4 text-teal-500" />
            </div>
            <h2 className="text-base font-bold text-white">Novo Hábito</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Nome do Hábito
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Estudar Rust"
              className="bg-neutral-900 border-neutral-700"
              autoFocus
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase  text-neutral-500">
                Tipo
              </p>
              <Select
                value={type}
                onValueChange={(v) => {
                  const t = v as "Positive" | "Negative";
                  setType(t);
                  if (t === "Negative") setCooldown((c) => Math.max(c, 2));
                }}
              >
                <SelectTrigger className="w-full bg-neutral-900 border-neutral-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive">✅ Hábito Positivo</SelectItem>
                  <SelectItem value="Negative">🔒 Controle de Vício</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase  text-neutral-500">
                  {type === "Negative"
                    ? "Intervalo de Cooldown (dias)"
                    : "Meta de Frequência (dias)"}
                </p>
                {type === "Negative" && (
                  <span className="text-[9px] font-bold text-teal-500 px-1.5 py-0.5 bg-teal-500/10 rounded border border-teal-500/20">
                    mín. 2 dias
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={minCooldown}
                value={cooldown}
                onChange={(e) =>
                  setCooldown(Math.max(minCooldown, Number(e.target.value)))
                }
                className="bg-neutral-900 border-neutral-700"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Hábito
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full text-neutral-500 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
