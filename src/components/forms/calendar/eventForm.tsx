"use client";

import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
 * Gestor de Compromissos: Interface para criação de eventos e prazos fatais
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
      toast.error("Identifique o título do compromisso.");
      return;
    }
    onSave({ ...form, user_id: userId, id: initial?.id });
  }

  const isDeadline = form.event_type === "deadline";
  const inputStyle =
    "bg-neutral-950/50 border-neutral-800 h-11 rounded-xl font-bold focus:border-green-500/40 transition-all placeholder:text-neutral-700 shadow-inner";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Seletor de Polaridade: Evento Cronológico vs Prazo Crítico */}
      <div className="flex p-1 bg-neutral-950 border border-neutral-800 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => set("event_type", "event")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            !isDeadline
              ? "bg-green-600/10 text-green-400 border-green-600/30 shadow-lg shadow-green-600/5"
              : "bg-transparent text-neutral-600 border-transparent hover:text-neutral-400"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Evento
        </button>
        <button
          type="button"
          onClick={() => set("event_type", "deadline")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            isDeadline
              ? "bg-red-600/10 text-red-400 border-red-600/30 shadow-lg shadow-red-600/5"
              : "bg-transparent text-neutral-600 border-transparent hover:text-neutral-400"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Deadline
        </button>
      </div>

      <div className="space-y-5 px-1">
        {/* Identificação do Compromisso */}
        <div className="space-y-2">
          <Label htmlFor="ef-title" className={labelStyle}>
            Designação do Compromisso
          </Label>
          <Input
            id="ef-title"
            className={inputStyle}
            placeholder={
              isDeadline
                ? "Ex: Prova Geral de Anatomia"
                : "Ex: Sprint de Desenvolvimento"
            }
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>

        {/* Categorização de Urgência (Apenas para Prazos) */}
        {isDeadline && (
          <div className="space-y-3">
            <Label className={labelStyle}>Vetor de Urgência</Label>
            <div className="flex gap-2">
              {(Object.keys(DEADLINE_LABELS) as DeadlineCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("deadline_category", cat)}
                    style={{
                      boxShadow:
                        form.deadline_category === cat
                          ? `0 0 15px ${DEADLINE_COLORS[cat]}10`
                          : "none",
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                      form.deadline_category === cat
                        ? "bg-neutral-800 text-white"
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

        {/* Cronograma Espacial */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ef-date" className={labelStyle}>
              Data Alvo
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
          <div className="space-y-2">
            <Label htmlFor="ef-time" className={labelStyle}>
              Marcador Temporal
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

        {/* Customização Visual (Eventos) */}
        {!isDeadline && (
          <div className="space-y-3">
            <Label className={labelStyle}>Identidade Visual</Label>
            <div className="flex gap-3 px-1">
              {EVENT_COLOR_OPTIONS.map(
                (opt: { value: string; label: string }) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    onClick={() => set("color", opt.value)}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer border-2 ${
                      form.color === opt.value
                        ? "border-white scale-110 shadow-lg"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: opt.value }}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* Memorial Descritivo */}
        <div className="space-y-2">
          <Label htmlFor="ef-desc" className={labelStyle}>
            Detalhes Analíticos
          </Label>
          <Textarea
            id="ef-desc"
            className="bg-neutral-950/50 border-neutral-800 rounded-2xl min-h-[80px] resize-none pt-4 font-bold text-neutral-400 focus:border-green-500/30 placeholder:text-neutral-800 transition-all shadow-inner"
            placeholder="Observações complementares e notas de execução..."
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      {/* Ações de Persistência */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          className="flex-1 py-6 rounded-2xl text-xs font-black uppercase text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all border-none"
        >
          Descartar
        </Button>
        <Button
          type="submit"
          className={`flex-2 py-6 rounded-2xl text-white text-xs font-black uppercase shadow-lg transition-all active:scale-[0.98] border-none ${
            isDeadline
              ? "bg-red-600 hover:bg-red-500 shadow-red-600/10"
              : "bg-green-600 hover:bg-green-500 shadow-green-600/10"
          }`}
        >
          {initial ? "Salvar Alterações" : "Consolidar Registro"}
        </Button>
      </div>
    </form>
  );
}
