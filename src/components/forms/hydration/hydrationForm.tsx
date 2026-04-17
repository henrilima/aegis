"use client";

import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";

interface HydrationFormProps {
  newType: string;
  setNewType: (val: string) => void;
  newValue: string;
  setNewValue: (val: string) => void;
  newStartTime: string;
  setNewStartTime: (val: string) => void;
  onAdd: () => void;
  onCancel: () => void;
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
  onCancel,
}: HydrationFormProps) {
  const { themeStyles: theme } = useTheme();
  const inputStyle = `w-full bg-background border-border h-11 rounded-xl text-sm font-medium focus:${theme.border.split(" ")[0]} transition-all placeholder:text-muted-foreground/50`;
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="bg-background/40 border border-border rounded-xl p-6 space-y-5">
      {/* Tipo de Alerta */}
      <div className="space-y-1.5">
        <Label htmlFor="hydration-type" className={lc}>
          Tipo de alerta
        </Label>
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger
            id="hydration-type"
            className={`w-full bg-background border-border h-11 rounded-xl text-sm font-medium ring-offset-neutral-950 focus:ring-${theme.text.split("-")[1]}-500/50`}
          >
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem
              value="Interval"
              className="text-xs font-bold py-3 hover:bg-accent/50"
            >
              ⏱ Intervalo Periódico
            </SelectItem>
            <SelectItem
              value="Fixed"
              className="text-xs font-bold py-3 hover:bg-accent/50"
            >
              📍 Horário Definido
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 animate-in slide-in-from-top-1">
        <Label htmlFor="hydration-value" className={lc}>
          {newType === "Interval"
            ? "Frequência (minutos)"
            : "Horário do alerta"}
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

      {newType === "Interval" && (
        <div className="space-y-1.5 animate-in slide-in-from-top-1">
          <Label htmlFor="hydration-start" className={lc}>
            Início dos alertas
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

      {/* Ações */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onAdd}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover} ${theme.textDark} ${theme.textDarkHover} text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer`}
        >
          <Plus className="w-4 h-4" /> Ativar lembrete
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-muted-foreground hover:text-muted-foreground py-2 text-sm font-medium cursor-pointer transition-colors"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
