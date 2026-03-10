"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    "bg-neutral-950 border-neutral-800 h-12 rounded-2xl font-bold focus:border-blue-500/40 transition-all placeholder:text-neutral-700 shadow-inner";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Campo de Data do Registro */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ef-date" className={labelStyle}>
          Data da Alvorada
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
          <Label htmlFor="ef-bedtime" className={labelStyle}>
            Recolhimento
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
          <Label htmlFor="ef-wake" className={labelStyle}>
            Despertar
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
        <span className="text-[10px] text-blue-400 font-black uppercase">
          Repouso Total: {formatDuration(duration)}
        </span>
      </div>

      {/* Seletor de Percepção de Qualidade */}
      <div className="flex flex-col gap-3">
        <Label className={labelStyle}>Grau de Vigor Bio-Neuronal</Label>
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
        <p className="text-center text-[10px] font-black uppercase text-neutral-700 mt-1">
          Estado: {qualityLabel(form.quality)}
        </p>
      </div>

      {/* Notas Opcionais */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ef-note" className={labelStyle}>
          Observações Biométricas
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
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          className="flex-1 py-6 rounded-2xl text-xs font-black uppercase text-neutral-600 hover:text-white transition-all border-none"
        >
          Descartar
        </Button>
        <Button
          type="submit"
          className="flex-2 py-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98] border-none"
        >
          {initial ? "Atualizar Log" : "Sincronizar Ciclo"}
        </Button>
      </div>
    </form>
  );
}
