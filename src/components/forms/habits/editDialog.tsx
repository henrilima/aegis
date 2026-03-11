"use client";
import { Edit2, X } from "lucide-react";
import type { Habit } from "@/components/pages/habits/types";
interface EditHabitDialogProps {
  habit: Habit;
  setHabit: (habit: Habit | null) => void;
  onUpdate: () => void;
}
export function EditHabitDialog({
  habit,
  setHabit,
  onUpdate,
}: EditHabitDialogProps) {
  const ic =
    "bg-neutral-900 border border-neutral-800 text-white rounded-xl text-sm outline-none focus:border-teal-500/50 transition-all font-medium p-3 w-full placeholder:text-neutral-600";
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
        className="absolute inset-0 w-full h-full bg-transparent border-none p-0 m-0 cursor-default"
        onClick={() => setHabit(null)}
        tabIndex={-1}
        aria-hidden="true"
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
              <Edit2 className="w-5 h-5 text-teal-400" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h2 className="text-lg font-bold text-white">Editar hábito</h2>{" "}
              <p className="text-xs text-neutral-500 mt-0.5">
                Ajustar configurações
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <button
            type="button"
            onClick={() => setHabit(null)}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            {" "}
            <X className="w-5 h-5" />{" "}
          </button>{" "}
        </div>{" "}
        <div className="p-6 space-y-5">
          {" "}
          {/* Nome */}{" "}
          <div className="space-y-1.5">
            {" "}
            <label htmlFor="ed-name" className={lc}>
              Nome
            </label>{" "}
            <input
              id="ed-name"
              value={habit.name}
              onChange={(e) => setHabit({ ...habit, name: e.target.value })}
              className={ic}
              placeholder="Nome do hábito"
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            {/* Cooldown */}{" "}
            <div className="space-y-1.5">
              {" "}
              <label htmlFor="ed-cooldown" className={lc}>
                {" "}
                {habit.habit_type === "Positive"
                  ? "Frequência (d)"
                  : "Tolerância (d)"}{" "}
              </label>{" "}
              <input
                id="ed-cooldown"
                type="number"
                min="1"
                value={habit.cooldown_days}
                onChange={(e) =>
                  setHabit({ ...habit, cooldown_days: Number(e.target.value) })
                }
                className={ic}
              />{" "}
            </div>{" "}
            {/* Cargas */}{" "}
            <div className="space-y-1.5">
              {" "}
              <label htmlFor="ed-charges" className={lc}>
                Vidas / Cargas
              </label>{" "}
              <input
                id="ed-charges"
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
              />{" "}
            </div>{" "}
          </div>{" "}
          {/* Intervalo de recarga */}{" "}
          {habit.charges_amount > 0 && (
            <div className="space-y-1.5 animate-in slide-in-">
              {" "}
              <label htmlFor="ed-interval" className={lc}>
                Recuperação (d)
              </label>{" "}
              <input
                id="ed-interval"
                type="number"
                min={1}
                value={habit.charges_interval_days}
                onChange={(e) =>
                  setHabit({
                    ...habit,
                    charges_interval_days: Math.max(1, Number(e.target.value)),
                  })
                }
                className={ic}
              />{" "}
            </div>
          )}{" "}
          {/* Ações */}{" "}
          <div className="flex gap-3 pt-1">
            {" "}
            <button
              type="button"
              onClick={() => setHabit(null)}
              className="flex-1 py-3 text-sm font-semibold text-neutral-500 hover:text-white transition-colors"
            >
              {" "}
              Cancelar{" "}
            </button>{" "}
            <button
              type="button"
              onClick={onUpdate}
              className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/60 hover:border-teal-400 text-teal-300 hover:text-teal-200 font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              {" "}
              Salvar alterações{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
