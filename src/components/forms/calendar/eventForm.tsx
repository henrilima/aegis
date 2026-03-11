"use client";

import { AlertTriangle, Calendar as CalendarIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CalendarEvent,
  DeadlineCategory,
} from "../../pages/calendar/types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  EVENT_COLOR_OPTIONS,
} from "../../pages/calendar/types";

interface EventFormProps {
  userId: string;
  initial?: CalendarEvent;
  onSave: (ev: CalendarEvent) => void;
  onCancel: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Formulário para criação e edição de eventos e prazos no calendário
 */
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
      toast.error("Informe o título do compromisso.");
      return;
    }
    onSave({ ...form, user_id: userId, id: initial?.id });
  }

  const isDeadline = form.event_type === "deadline";
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";
  const inputStyle =
    "w-full bg-neutral-950/50 border-neutral-800 h-11 rounded-xl text-sm font-medium focus:border-green-500/40 transition-all placeholder:text-neutral-700";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Tipo: Evento vs Deadline */}
      <div className="flex p-1 bg-neutral-950 border border-neutral-800 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => set("event_type", "event")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            !isDeadline
              ? "bg-green-600/10 text-green-400 border-green-600/30"
              : "bg-transparent text-neutral-600 border-transparent hover:text-neutral-400"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Evento
        </button>
        <button
          type="button"
          onClick={() => set("event_type", "deadline")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            isDeadline
              ? "bg-red-600/10 text-red-400 border-red-600/30"
              : "bg-transparent text-neutral-600 border-transparent hover:text-neutral-400"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Deadline
        </button>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div className="space-y-1.5">
          <Label htmlFor="ef-title" className={lc}>
            Título
          </Label>
          <Input
            id="ef-title"
            className={inputStyle}
            placeholder={
              isDeadline
                ? "Ex: Prova de Anatomia"
                : "Ex: Reunião de equipe"
            }
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        {/* Urgência (Deadlines) */}
        {isDeadline && (
          <div className="space-y-1.5">
            <Label className={lc}>Urgência</Label>
            <div className="flex gap-2">
              {(Object.keys(DEADLINE_LABELS) as DeadlineCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("deadline_category", cat)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      form.deadline_category === cat
                        ? "bg-neutral-800 text-white border-neutral-700"
                        : "bg-neutral-950/40 text-neutral-600 border-neutral-800 hover:text-neutral-400"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                      style={{ backgroundColor: DEADLINE_COLORS[cat] }}
                    />
                    {DEADLINE_LABELS[cat]}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        {/* Data + Horário */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ef-date" className={lc}>
              Data
            </Label>
            <Input
              id="ef-date"
              type="date"
              className={inputStyle}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ef-time" className={lc}>
              Horário
            </Label>
            <Input
              id="ef-time"
              type="time"
              className={inputStyle}
              value={form.time ?? ""}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>
        </div>

        {/* Cor do evento */}
        {!isDeadline && (
          <div className="space-y-1.5">
            <Label className={lc}>Cor</Label>
            <div className="flex flex-wrap gap-2.5 px-0.5">
              {EVENT_COLOR_OPTIONS.map((opt: { value: string; label: string }) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => set("color", opt.value)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    form.color === opt.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-950 scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: opt.value }}
                >
                  {form.color === opt.value && (
                    <Check className="w-3 h-3 text-black/70" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="ef-desc" className={lc}>
            Descrição <span className="text-neutral-600 font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="ef-desc"
            className="bg-neutral-950/50 border-neutral-800 rounded-xl min-h-[80px] resize-none text-sm font-medium text-neutral-300 focus:border-green-500/30 placeholder:text-neutral-700 transition-all"
            placeholder="Observações adicionais..."
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer border ${
            isDeadline
              ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200"
              : "bg-green-500/10 hover:bg-green-500/20 border-green-500/40 hover:border-green-400 text-green-300 hover:text-green-200"
          }`}
        >
          {initial ? "Salvar alterações" : "Criar evento"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
        >
          Agora não
        </button>
      </div>
    </form>
  );
}
