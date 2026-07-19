"use client";

import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "@/components/global/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTime } from "@/context/TimeContext";
import { cn, formatDateLocal } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { CalendarEvent, DeadlineCategory } from "../../types";
import { DEADLINE_COLORS, DEADLINE_LABELS } from "../../types";

interface EventFormProps {
  userId: string;
  initial?: CalendarEvent;
  onSave: (ev: CalendarEvent) => void;
  onCancel: () => void;
}

/**
 * Formulário para criação e edição de eventos e prazos no calendário
 */
export function EventForm({ userId, initial, onSave }: EventFormProps) {
  const { now: simulatedNow } = useTime();
  const [form, setForm] = useState<
    Omit<CalendarEvent, "id" | "userId" | "createdAt">
  >({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ?? formatDateLocal(simulatedNow),
    time: initial?.time ?? "",
    eventType: initial?.eventType ?? "event",
    deadlineCategory: initial?.deadlineCategory,
    color: initial?.color ?? "",
    recurrence: initial?.recurrence ?? "none",
    recurrenceExceptions: initial?.recurrenceExceptions ?? "",
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
    onSave({ ...form, userId: userId, id: initial?.id });
  }

  const isDeadline = form.eventType === "deadline";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const inputStyle =
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-green-500/40 transition-all placeholder:text-muted-foreground/50";

  return (
    <form
      id="calendar-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo: Identificação */}
        <div className="flex flex-col gap-6">
          <div className="space-y-1.5">
            <Label className={lc}>Tipo de registro</Label>
            <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
              <button
                key="type-event"
                type="button"
                onClick={() => set("eventType", "event")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  !isDeadline
                    ? "bg-green-600/10 text-green-400 border-green-600/30"
                    : "bg-transparent text-neutral-600 border-transparent hover:text-muted-foreground"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" /> Evento
              </button>
              <button
                key="type-deadline"
                type="button"
                onClick={() => set("eventType", "deadline")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                  isDeadline
                    ? "bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/30"
                    : "bg-transparent text-neutral-600 border-transparent hover:text-muted-foreground"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Prazo
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ef-title" className={lc}>
              Título do compromisso
            </Label>
            <Input
              id="ef-title"
              disabled={initial?.isHoliday}
              className={inputStyle}
              placeholder={
                isDeadline ? "Ex: Prova de Anatomia" : "Ex: Reunião de equipe"
              }
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ef-desc" className={lc}>
              Descrição adicional
            </Label>
            <Textarea
              id="ef-desc"
              disabled={initial?.isHoliday}
              className="bg-card border-border rounded-xl min-h-[120px] resize-none text-sm font-medium text-muted-foreground focus:border-green-600/30 placeholder:text-muted-foreground/50 transition-all"
              placeholder="Notas, links ou detalhes relevantes..."
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>

        {/* Lado Direito: Agendamento e Estilo */}
        <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ef-date" className={lc}>
                Data
              </Label>
              <Input
                id="ef-date"
                type="date"
                disabled={initial?.isHoliday}
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
                disabled={initial?.isHoliday}
                className={inputStyle}
                value={form.time ?? ""}
                onChange={(e) => set("time", e.target.value)}
              />
            </div>
          </div>

          {isDeadline ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
              <Label className={lc}>Nível de urgência</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DEADLINE_LABELS) as DeadlineCategory[]).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => set("deadlineCategory", cat)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                        form.deadlineCategory === cat
                          ? "bg-neutral-800 text-foreground border-border"
                          : "bg-background/40 text-neutral-600 border-border hover:text-muted-foreground"
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
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
              <Label className={lc}>Cor do marcador</Label>
              <ColorPicker
                value={form.color || ""}
                onChange={(c) => set("color", c)}
                placeholder="Padrão"
                defaultColor={getModuleColor("calendar")}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <Label htmlFor="ef-recurrence" className={lc}>
              Repetição
            </Label>
            <select
              id="ef-recurrence"
              disabled={initial?.isHoliday}
              value={form.recurrence || "none"}
              onChange={(e) =>
                set(
                  "recurrence",
                  e.target.value as "none" | "weekly" | "monthly",
                )
              }
              className={cn(
                inputStyle,
                "w-full bg-card border border-border rounded-xl text-xs font-semibold px-3 outline-none cursor-pointer",
              )}
            >
              <option value="none">Não se repete</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
