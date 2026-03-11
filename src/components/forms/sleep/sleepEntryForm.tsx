"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SleepEntry } from "../../pages/sleep/types";

// ─── Funções Utilitárias Internas ───────────────────────────────────────────

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
}

export function calcDurationMinutes(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  const bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return wakeMins - bedMins;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function qualityLabel(q: number) {
  return (
    ["", "Crítico", "Irregular", "Aceitável", "Revigorante", "Excelente"][q] ??
    ""
  );
}

/**
 * Componente Visual de Estrelas para Qualidade
 */
export function Stars({ q }: { q: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= q ? "fill-blue-400 text-blue-400" : "text-neutral-800"}`}
        />
      ))}
    </div>
  );
}

interface EntryFormProps {
  userId: string;
  initial?: SleepEntry;
  onSave: (e: SleepEntry) => void;
  onCancel: () => void;
}

/**
 * Formulário Unificado: Registra novos ciclos ou edita registros históricos
 */
export function SleepEntryForm({
  userId,
  initial,
  onSave,
  onCancel,
}: EntryFormProps) {
  const [form, setForm] = useState({
    date: initial?.date ?? isoDate(new Date()),
    bedtime: initial?.bedtime ?? "23:00",
    wake_time: initial?.wake_time ?? "07:00",
    quality: initial?.quality ?? 3,
    note: initial?.note ?? "",
  });

  const duration = calcDurationMinutes(form.bedtime, form.wake_time);

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      user_id: userId,
      id: initial?.id,
      duration_minutes: duration,
    });
  }

  const inputStyle =
    "bg-neutral-950 border-neutral-800 h-12 rounded-xl text-sm font-medium focus:border-blue-500/40 transition-all placeholder:text-neutral-700";
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Campo de Data do Registro */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ef-date" className={lc}>
          Data
        </Label>
        <Input
          id="ef-date"
          type="date"
          className={inputStyle}
          value={form.date}
          onChange={(e) => setField("date", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Hora de Recolhimento */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="ef-bedtime" className={lc}>
            Hora de dormir
          </Label>
          <Input
            id="ef-bedtime"
            type="time"
            className={inputStyle}
            value={form.bedtime}
            onChange={(e) => setField("bedtime", e.target.value)}
            required
          />
        </div>
        {/* Hora de Despertar */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="ef-wake" className={lc}>
            Hora de acordar
          </Label>
          <Input
            id="ef-wake"
            type="time"
            className={inputStyle}
            value={form.wake_time}
            onChange={(e) => setField("wake_time", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Indicador de Descanso Calculado */}
      <div className="text-center py-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl animate-in fade-in duration-700 shadow-inner">
        <span className="text-xs text-blue-400 font-medium">
          Total de repouso: {formatDuration(duration)}
        </span>
      </div>

      {/* Seletor de Percepção de Qualidade */}
      <div className="flex flex-col gap-3">
        <Label className={lc}>Qualidade do sono</Label>
        <div className="flex gap-2 p-1 bg-neutral-950/50 border border-neutral-800 rounded-2xl">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setField("quality", q)}
              className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                form.quality === q
                  ? "bg-blue-600/10 border-blue-600/30 text-blue-400 shadow-lg shadow-blue-500/5"
                  : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-center text-xs font-medium text-neutral-500 mt-1">
          {qualityLabel(form.quality)}
        </p>
      </div>

      {/* Notas Opcionais */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ef-note" className={lc}>
          Observações <span className="text-neutral-600 font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="ef-note"
          className="bg-neutral-950 border-neutral-800 rounded-2xl min-h-[100px] resize-none pt-4 font-bold text-neutral-400 focus:border-blue-500/30 placeholder:text-neutral-800 transition-all shadow-inner"
          placeholder="Ex: Interrupções, sonhos, fatores externos qualitativos..."
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
        />
      </div>

      {/* Ações do Formulário */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-blue-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
        >
          {initial ? "Salvar alterações" : "Registrar sono"}
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
