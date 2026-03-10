"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CalendarEvent, DeadlineCategory } from "../types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  EVENT_COLOR_OPTIONS,
} from "../types";

interface EventFormProps {
  userId: string;
  initial?: CalendarEvent;
  onSave: (ev: CalendarEvent) => void;
  onCancel: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function EventForm({
  userId,
  initial,
  onSave,
  onCancel,
}: EventFormProps) {
  const [form, setForm] = useState<
    Omit<CalendarEvent, "id" | "user_id" | "created_at">
  >({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ?? todayIso(),
    time: initial?.time ?? "",
    event_type: initial?.event_type ?? "event",
    deadline_category: initial?.deadline_category,
    color: initial?.color ?? EVENT_COLOR_OPTIONS[0].value,
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Informe o título do evento");
      return;
    }
    if (!form.date) {
      toast.error("Informe a data");
      return;
    }
    onSave({ ...form, user_id: userId, id: initial?.id });
  }

  const ic =
    "w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-500 transition-colors";
  const lc = "text-[10px] font-black uppercase text-neutral-500";

  const isDeadline = form.event_type === "deadline";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => set("event_type", "event")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
            !isDeadline
              ? "bg-green-500/15 text-green-400 border-green-500/30"
              : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:text-neutral-200"
          }`}
        >
          📅 Evento
        </button>
        <button
          type="button"
          onClick={() => set("event_type", "deadline")}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
            isDeadline
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:text-neutral-200"
          }`}
        >
          ⚠️ Deadline
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ef-title" className={lc}>
          Título <span className="text-red-500">*</span>
        </label>
        <input
          id="ef-title"
          className={ic}
          placeholder={
            isDeadline
              ? "Ex: Prova de Direito Civil"
              : "Ex: Revisão de Conteúdo"
          }
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>

      {isDeadline && (
        <div className="flex flex-col gap-1.5">
          <span className={lc}>Categoria</span>
          <div className="flex gap-2">
            {(Object.keys(DEADLINE_LABELS) as DeadlineCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set("deadline_category", cat)}
                style={{
                  borderColor:
                    form.deadline_category === cat
                      ? DEADLINE_COLORS[cat]
                      : undefined,
                  color:
                    form.deadline_category === cat
                      ? DEADLINE_COLORS[cat]
                      : undefined,
                  backgroundColor:
                    form.deadline_category === cat
                      ? `${DEADLINE_COLORS[cat]}18`
                      : undefined,
                }}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-neutral-700 text-neutral-500 hover:text-neutral-200"
              >
                {DEADLINE_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ef-date" className={lc}>
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="ef-date"
            type="date"
            className={ic}
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ef-time" className={lc}>
            Horário (opcional)
          </label>
          <input
            id="ef-time"
            type="time"
            className={ic}
            value={form.time ?? ""}
            onChange={(e) => set("time", e.target.value)}
          />
        </div>
      </div>

      {!isDeadline && (
        <div className="flex flex-col gap-1.5">
          <span className={lc}>Cor</span>
          <div className="flex gap-2">
            {EVENT_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => set("color", opt.value)}
                className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
                style={{
                  backgroundColor: opt.value,
                  borderColor:
                    form.color === opt.value ? "#fff" : "transparent",
                  transform:
                    form.color === opt.value ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ef-desc" className={lc}>
          Descrição (opcional)
        </label>
        <textarea
          id="ef-desc"
          className={`${ic} resize-none h-16`}
          placeholder="Detalhes adicionais..."
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          {initial ? "Salvar alterações" : "Adicionar"}
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
