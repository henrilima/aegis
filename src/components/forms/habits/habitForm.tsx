"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HabitFormProps {
  name: string;
  setName: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  cooldown: number;
  setCooldown: (val: number) => void;
}

/**
 * Formulário base para modelagem de novos hábitos ou modificação de comportamentos existentes
 */
export function HabitForm({
  name,
  setName,
  type,
  setType,
  cooldown,
  setCooldown,
}: HabitFormProps) {
  return (
    <div className="space-y-6">
      {/* Campo de Identificação */}
      <div className="space-y-2">
        <Label
          htmlFor="habit-name"
          className="text-[10px] font-black uppercase text-neutral-500 ml-1"
        >
          Arquétipo do Hábito
        </Label>
        <Input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Meditação Matinal, Treino de Alta Intensidade..."
          className="bg-neutral-900 border-neutral-800 h-12 rounded-2xl font-bold focus:border-teal-500/50 transition-all placeholder:text-neutral-700 shadow-inner"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Polaridade do Hábito */}
        <div className="space-y-2">
          <Label
            htmlFor="habit-type"
            className="text-[10px] font-black uppercase text-neutral-500 ml-1"
          >
            Polaridade Biológica
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger
              id="habit-type"
              className="bg-neutral-900 border-neutral-800 h-12 rounded-2xl font-bold focus:border-teal-500/50 transition-all shadow-inner"
            >
              <SelectValue placeholder="Selecione a natureza" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              <SelectItem
                value="Positive"
                className="text-xs font-bold py-3 hover:bg-neutral-800"
              >
                ⭐ Reforço Positivo
              </SelectItem>
              <SelectItem
                value="Negative"
                className="text-xs font-bold py-3 hover:bg-neutral-800"
              >
                🛑 Controle / Restrição
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frequência de Recorrência */}
        <div className="space-y-2">
          <Label
            htmlFor="habit-cooldown"
            className="text-[10px] font-black uppercase text-neutral-500 ml-1"
          >
            Janela de Recorrência (Dias)
          </Label>
          <Input
            id="habit-cooldown"
            type="number"
            min={1}
            value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            className="bg-neutral-900 border-neutral-800 h-12 rounded-2xl font-bold focus:border-teal-500/50 transition-all shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
