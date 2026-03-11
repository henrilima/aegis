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
export function HabitCreateModal({ onAdd, onClose }: HabitCreateModalProps) {
  const [name, setName] = useState("");
  const [cooldown, setCooldown] = useState(1);
  const [type, setType] = useState<"Positive" | "Negative">("Positive");
  const [chargesAmount, setChargesAmount] = useState(0);
  const [chargesInterval, setChargesInterval] = useState(1);
  const minCooldown = type === "Negative" ? 2 : 1;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), cooldown, type, chargesAmount, chargesInterval);
  };
  const ic =
    "w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500/50 transition-all placeholder:text-neutral-600 font-medium";
  const lc = "text-xs font-semibold text-neutral-400 ml-0.5";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {" "}
      <button
        type="button"
        aria-label="Voltar"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />{" "}
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {" "}
        {/* Cabeçalho */}{" "}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 ">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20">
              {" "}
              <Activity className="w-5 h-5 text-teal-400" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h2 className="text-lg font-bold text-white">Novo Hábito</h2>{" "}
              <p className="text-xs text-neutral-500 mt-0.5">
                Disciplina & Hábitos
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            {" "}
            <X className="w-5 h-5" />{" "}
          </button>{" "}
        </div>{" "}
        <div className="max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          {" "}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {" "}
            {/* Nome */}{" "}
            <div className="space-y-1.5">
              {" "}
              <label htmlFor="hcm-name" className={lc}>
                {" "}
                O que vamos rastrear?{" "}
              </label>{" "}
              <input
                id="hcm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ler 20 páginas, Sem açúcar..."
                className={ic}
                required
              />{" "}
            </div>{" "}
            {/* Natureza */}{" "}
            <div className="space-y-1.5">
              {" "}
              <label htmlFor="hcm-type" className={lc}>
                Natureza
              </label>{" "}
              <Select
                value={type}
                onValueChange={(v: string) => {
                  const t = v as "Positive" | "Negative";
                  setType(t);
                  if (t === "Negative") setCooldown((c) => Math.max(c, 2));
                }}
              >
                {" "}
                <SelectTrigger
                  id="hcm-type"
                  className="w-full bg-neutral-900 border-neutral-800 h-[44px] rounded-2xl text-xs font-bold"
                >
                  {" "}
                  <SelectValue />{" "}
                </SelectTrigger>{" "}
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {" "}
                  <SelectItem value="Positive" className="text-xs font-bold">
                    {" "}
                    ✅ Hábito Construtivo{" "}
                  </SelectItem>{" "}
                  <SelectItem value="Negative" className="text-xs font-bold">
                    {" "}
                    🔒 Controle de Danos{" "}
                  </SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
            {/* Frequência + Cargas */}{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div className="space-y-1.5">
                {" "}
                <label htmlFor="hcm-cooldown" className={lc}>
                  {" "}
                  {type === "Negative" ? "Alerta (d)" : "Frequência (d)"}{" "}
                </label>{" "}
                <input
                  id="hcm-cooldown"
                  type="number"
                  min={minCooldown}
                  value={cooldown}
                  onChange={(e) =>
                    setCooldown(Math.max(minCooldown, Number(e.target.value)))
                  }
                  className={ic}
                />{" "}
              </div>{" "}
              <div className="space-y-1.5">
                {" "}
                <label htmlFor="hcm-charges" className={lc}>
                  {" "}
                  Vidas / Cargas{" "}
                </label>{" "}
                <input
                  id="hcm-charges"
                  type="number"
                  min={0}
                  value={chargesAmount}
                  onChange={(e) =>
                    setChargesAmount(Math.max(0, Number(e.target.value)))
                  }
                  className={ic}
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Intervalo de recuperação de cargas */}{" "}
            {chargesAmount > 0 && (
              <div className="space-y-1.5 animate-in slide-in-">
                {" "}
                <label htmlFor="hcm-interval" className={lc}>
                  {" "}
                  Recuperação (d){" "}
                </label>{" "}
                <input
                  id="hcm-interval"
                  type="number"
                  min={1}
                  value={chargesInterval}
                  onChange={(e) =>
                    setChargesInterval(Math.max(1, Number(e.target.value)))
                  }
                  className={ic}
                />{" "}
              </div>
            )}{" "}
            {/* Ações */}{" "}
            <div className="flex flex-col gap-3 pt-1">
              {" "}
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/60 hover:border-teal-400 text-teal-300 hover:text-teal-200 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                {" "}
                <Plus className="w-4 h-4" /> Iniciar rastreamento{" "}
              </button>{" "}
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
              >
                {" "}
                Agora não{" "}
              </button>{" "}
            </div>{" "}
          </form>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
