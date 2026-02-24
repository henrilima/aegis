import { Plus } from "lucide-react";
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

interface HabitFormProps {
  onAdd: (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
  ) => void;
}

export function HabitForm({ onAdd }: HabitFormProps) {
  const [name, setName] = useState("");
  const [cooldown, setCooldown] = useState(1);
  const [type, setType] = useState<"Positive" | "Negative">("Positive");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, cooldown, type);
    setName("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4"
    >
      <p className="text-[10px] font-black uppercase  text-neutral-500">
        Novo Hábito
      </p>

      <div className="space-y-1.5">
        <p className="text-xs font-bold text-neutral-500">Nome</p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Estudar Rust"
          className="bg-neutral-950 border-neutral-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-500">Tipo</p>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "Positive" | "Negative")}
          >
            <SelectTrigger className="bg-neutral-950 border-neutral-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Positive">Positivo</SelectItem>
              <SelectItem value="Negative">Negativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-500">Cooldown (dias)</p>
          <Input
            type="number"
            min={1}
            value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            className="bg-neutral-950 border-neutral-700"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-500 text-black font-bold cursor-pointer"
        disabled={!name.trim()}
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar Hábito
      </Button>
    </form>
  );
}
