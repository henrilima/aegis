"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HydrationFormProps {
  newType: string;
  setNewType: (val: string) => void;
  newValue: string;
  setNewValue: (val: string) => void;
  newStartTime: string;
  setNewStartTime: (val: string) => void;
  onAdd: () => void;
}

/**
 * Formulário de configuração para novos lembretes de hidratação
 */
export function HydrationForm({
  newType,
  setNewType,
  newValue,
  setNewValue,
  newStartTime,
  setNewStartTime,
  onAdd,
}: HydrationFormProps) {
  const inputStyle =
    "bg-neutral-900 border-neutral-800 h-12 rounded-2xl font-bold focus:border-blue-500/40 transition-all placeholder:text-neutral-700 shadow-inner";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-500 ml-1";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
      {/* Seleção do Tipo de Lembrete */}
      <div className="space-y-2">
        <Label htmlFor="hydration-type" className={labelStyle}>
          Estratégia de Alerta
        </Label>
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger
            id="hydration-type"
            className="w-full bg-neutral-950 border-neutral-800 h-12 rounded-2xl text-xs font-bold ring-offset-neutral-950 focus:ring-blue-500/50 shadow-inner"
          >
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-800">
            <SelectItem
              value="Interval"
              className="text-xs font-bold py-3 hover:bg-neutral-800"
            >
              ⏱ Intervalo Periódico
            </SelectItem>
            <SelectItem
              value="Fixed"
              className="text-xs font-bold py-3 hover:bg-neutral-800"
            >
              📍 Horário Definido
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor do Lembrete (Minutos ou Hora) */}
      <div className="space-y-2 animate-in slide-in-from-top-1">
        <Label htmlFor="hydration-value" className={labelStyle}>
          {newType === "Interval"
            ? "Frequência (Minutos)"
            : "Horário de Alerta"}
        </Label>
        {newType === "Interval" ? (
          <Input
            id="hydration-value"
            type="text"
            inputMode="numeric"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value.replace(/\D/g, ""))}
            placeholder="Ex: 60"
            className={inputStyle}
          />
        ) : (
          <Input
            id="hydration-value"
            type="time"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className={inputStyle}
          />
        )}
      </div>

      {/* Horário de Início (Apenas para Intervalos) */}
      {newType === "Interval" && (
        <div className="space-y-2 animate-in slide-in-from-top-1">
          <Label htmlFor="hydration-start" className={labelStyle}>
            Momento da Primeira Dose
          </Label>
          <Input
            id="hydration-start"
            type="time"
            value={newStartTime}
            onChange={(e) => setNewStartTime(e.target.value)}
            className={inputStyle}
          />
        </div>
      )}

      {/* Botão de Ativação */}
      <Button
        type="button"
        onClick={onAdd}
        className="w-full py-7 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase transition-all shadow-lg shadow-blue-600/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none"
      >
        <Plus className="w-4 h-4" /> Ativar Lembrete
      </Button>
    </div>
  );
}
