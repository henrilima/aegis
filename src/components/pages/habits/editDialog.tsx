"use client";

import { Edit2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Habit } from "./types";

interface EditHabitDialogProps {
  habit: Habit;
  setHabit: (habit: Habit | null) => void;
  onUpdate: () => void;
}

/**
 * Dialog para edição de configurações de hábitos existentes
 */
export function EditHabitDialog({
  habit,
  setHabit,
  onUpdate,
}: EditHabitDialogProps) {
  const ic =
    "bg-neutral-900 border-neutral-800 text-white rounded-xl text-sm outline-none focus:border-teal-500/50 transition-all font-bold p-2.5 w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={() => setHabit(null)} />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 bg-linear-to-br from-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Edit2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Editar Configurações
              </h2>
              <p className="text-[10px] font-black text-neutral-600 uppercase mt-0.5">
                Gestão de Hábito
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHabit(null)}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nome do Hábito */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
              Nome do Hábito
            </label>
            <input
              value={habit.name}
              onChange={(e) => setHabit({ ...habit, name: e.target.value })}
              className={ic}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Frequência / Cooldown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                {habit.habit_type === "Positive" ? "Frequência" : "Tolerância"}{" "}
                (d)
              </label>
              <input
                type="number"
                min="1"
                value={habit.cooldown_days}
                onChange={(e) =>
                  setHabit({ ...habit, cooldown_days: Number(e.target.value) })
                }
                className={ic}
              />
            </div>

            {/* Quantidade de Cargas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                Cargas Permitidas
              </label>
              <input
                type="number"
                min={0}
                value={habit.charges_amount}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    charges_amount: Math.max(0, Number(e.target.value)),
                  })
                }
                className={ic}
              />
            </div>
          </div>

          {/* Configurações Avançadas de Recarga */}
          {habit.charges_amount > 0 && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  Intervalo Recarga (d)
                </label>
                <input
                  type="number"
                  min={1}
                  value={habit.charges_interval_days}
                  onChange={(e) =>
                    setHabit({
                      ...habit,
                      charges_interval_days: Math.max(
                        1,
                        Number(e.target.value),
                      ),
                    })
                  }
                  className={ic}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">
                  Acúmulo de Cargas
                </label>
                <Select
                  value={habit.accumulates ? "yes" : "no"}
                  onValueChange={(v) =>
                    setHabit({ ...habit, accumulates: v === "yes" })
                  }
                >
                  <SelectTrigger className="bg-neutral-900 border-neutral-800 h-[42px] rounded-xl text-xs font-bold ring-offset-neutral-950 focus:ring-teal-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem
                      value="yes"
                      className="text-xs font-bold hover:bg-neutral-800 focus:bg-neutral-800"
                    >
                      Habilitado
                    </SelectItem>
                    <SelectItem
                      value="no"
                      className="text-xs font-bold hover:bg-neutral-800 focus:bg-neutral-800"
                    >
                      Desabilitado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Ações de Rodapé */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setHabit(null)}
              className="flex-1 py-3 text-xs font-black uppercase text-neutral-500 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onUpdate}
              className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-black font-black text-xs uppercase transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98] cursor-pointer"
            >
              Salvar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
