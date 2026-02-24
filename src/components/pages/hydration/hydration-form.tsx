import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

export function HydrationForm({
  newType,
  setNewType,
  newValue,
  setNewValue,
  newStartTime,
  setNewStartTime,
  onAdd,
}: HydrationFormProps) {
  return (
    <div className="space-y-4 rounded-md">
      <FieldGroup>
        <Field>
          <FieldLabel>Tipo</FieldLabel>
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Interval">Intervalo (Minutos)</SelectItem>
              <SelectItem value="Fixed">Horário Fixo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup className="flex flex-col md:flex-row gap-4">
        <Field className="flex-1">
          <FieldLabel>
            {/* Alterna o rótulo conforme o tipo de lembrete selecionado */}
            {newType === "Interval" ? "Minutos" : "Horário Escolhido"}
          </FieldLabel>
          {newType === "Interval" ? (
            <Input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="60"
            />
          ) : (
            <Input
              type="time"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          )}
        </Field>
      </FieldGroup>

      {newType === "Interval" && (
        <FieldGroup className="flex flex-col md:flex-row gap-4">
          <Field className="flex-1">
            <FieldLabel>Início</FieldLabel>
            <Input
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
            />
          </Field>
        </FieldGroup>
      )}

      <Button
        onClick={onAdd}
        className="w-full cursor-pointer font-bold bg-blue-500 hover:bg-blue-400"
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar Lembrete
      </Button>
    </div>
  );
}
