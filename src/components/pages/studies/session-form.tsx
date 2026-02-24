"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudySession } from "./types";

export function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function parseDate(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
}

export function hitRate(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatHours(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

interface SessionFormProps {
  userId: string;
  initial?: StudySession;
  onSave: (s: StudySession) => void;
  onCancel: () => void;
}

export function SessionForm({
  userId,
  initial,
  onSave,
  onCancel,
}: SessionFormProps) {
  const [form, setForm] = useState<
    Omit<StudySession, "id" | "user_id" | "created_at">
  >({
    date: initial?.date ?? isoDate(new Date()),
    subject: initial?.subject ?? "",
    hours: initial?.hours ?? 0,
    questions_new: initial?.questions_new ?? 0,
    questions_review: initial?.questions_review ?? 0,
    correct_new: initial?.correct_new ?? 0,
    correct_review: initial?.correct_review ?? 0,
    note: initial?.note ?? "",
  });

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error("Informe a matéria");
      return;
    }
    onSave({ ...form, user_id: userId, id: initial?.id });
  }

  const ic =
    "w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500 transition-colors";
  const lc = "text-[10px] font-black uppercase  text-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-subject" className={lc}>
            Matéria <span className="text-red-500">*</span>
          </label>
          <input
            id="sf-subject"
            className={ic}
            placeholder="Ex: Direito Constitucional"
            value={form.subject}
            onChange={(e) => setField("subject", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-date" className={lc}>
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="sf-date"
            type="date"
            className={ic}
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sf-hours" className={lc}>
          Horas de estudo <span className="text-red-500">*</span>
        </label>
        <input
          id="sf-hours"
          type="number"
          step="0.25"
          min="0"
          max="24"
          className={ic}
          placeholder="Ex: 2.5"
          value={form.hours || ""}
          onChange={(e) => setField("hours", parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-qnew" className={lc}>
            Questões Inéditas
          </label>
          <input
            id="sf-qnew"
            type="number"
            min="0"
            className={ic}
            value={form.questions_new || ""}
            onChange={(e) =>
              setField("questions_new", parseInt(e.target.value, 10) || 0)
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-cnew" className={lc}>
            Acertos (Inéditas)
          </label>
          <input
            id="sf-cnew"
            type="number"
            min="0"
            className={ic}
            value={form.correct_new || ""}
            onChange={(e) =>
              setField("correct_new", parseInt(e.target.value, 10) || 0)
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-qrev" className={lc}>
            Questões Refeitas
          </label>
          <input
            id="sf-qrev"
            type="number"
            min="0"
            className={ic}
            value={form.questions_review || ""}
            onChange={(e) =>
              setField("questions_review", parseInt(e.target.value, 10) || 0)
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sf-crev" className={lc}>
            Acertos (Refeitas)
          </label>
          <input
            id="sf-crev"
            type="number"
            min="0"
            className={ic}
            value={form.correct_review || ""}
            onChange={(e) =>
              setField("correct_review", parseInt(e.target.value, 10) || 0)
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sf-note" className={lc}>
          Anotação do dia
        </label>
        <textarea
          id="sf-note"
          className={`${ic} resize-none h-20`}
          placeholder="Observações, pontos fracos, estratégias..."
          value={form.note ?? ""}
          onChange={(e) => setField("note", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          {initial ? "Salvar alterações" : "Registrar sessão"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm font-bold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
