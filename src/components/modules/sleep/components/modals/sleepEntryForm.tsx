"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { SleepEntry } from "@/components/modules/sleep/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTime } from "@/context/TimeContext";

// Funções Utilitárias Internas

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
}

export function calcDurationMinutes(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
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
          className={`w-3.5 h-3.5 ${i <= q ? "fill-blue-400 text-blue-400" : "text-muted"}`}
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
export function SleepEntryForm({ userId, initial, onSave }: EntryFormProps) {
  const { now: simulatedNow } = useTime();
  const [form, setForm] = useState({
    date: initial?.date ?? isoDate(simulatedNow),
    bedtime: initial?.bedtime ?? "23:00",
    wakeTime: initial?.wakeTime ?? "07:00",
    quality: initial?.quality ?? 3,
    note: initial?.note ?? "",
    nap_minutes: initial?.nap_minutes ?? 0,
  });

  const nightDuration = calcDurationMinutes(form.bedtime, form.wakeTime);
  const totalDuration = nightDuration + form.nap_minutes;

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.date) {
      alert("Campo Obrigatório: Data do registro");
      return;
    }
    if (!form.bedtime) {
      alert("Campo Obrigatório: Horário de dormir");
      return;
    }
    if (!form.wakeTime) {
      alert("Campo Obrigatório: Horário de acordar");
      return;
    }

    onSave({
      ...form,
      userId: userId,
      id: initial?.id,
      durationMinutes: totalDuration,
      nap_minutes: form.nap_minutes,
    });
  }

  const inputStyle =
    "bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-blue-500/40 transition-all placeholder:text-neutral-700";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <form
      id="sleep-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo: Horários */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ef-date" className={lc}>
              Data do registro <span className="text-blue-500 ml-1">*</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-bedtime" className={lc}>
                Hora de dormir <span className="text-blue-500 ml-1">*</span>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ef-wake" className={lc}>
                Hora de acordar <span className="text-blue-500 ml-1">*</span>
              </Label>
              <Input
                id="ef-wake"
                type="time"
                className={inputStyle}
                value={form.wakeTime}
                onChange={(e) => setField("wakeTime", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Seção de Soneca */}
          <div className="flex flex-col gap-1.5 border-t border-border pt-5">
            <Label className={lc}>Adicionar Soneca (Extra do dia)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11">
                <Input
                  type="number"
                  min={0}
                  max={23}
                  className="bg-transparent border-none p-0 h-full text-center font-bold text-sm outline-none focus:ring-0"
                  placeholder="0"
                  value={Math.floor(form.nap_minutes / 60) || ""}
                  onChange={(e) => {
                    const h = Number(e.target.value);
                    const m = form.nap_minutes % 60;
                    setField("nap_minutes", h * 60 + m);
                  }}
                />
                <span className="text-[10px] font-bold text-neutral-600 uppercase">
                  h
                </span>
              </div>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  className="bg-transparent border-none p-0 h-full text-center font-bold text-sm outline-none focus:ring-0"
                  placeholder="0"
                  value={form.nap_minutes % 60 || ""}
                  onChange={(e) => {
                    const h = Math.floor(form.nap_minutes / 60);
                    const m = Number(e.target.value);
                    setField("nap_minutes", h * 60 + m);
                  }}
                />
                <span className="text-[10px] font-bold text-neutral-600 uppercase">
                  m
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-blue-500/5 border border-blue-500/10 rounded-xl animate-in fade-in duration-700">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-blue-500/70 font-bold uppercase mb-1">
                Duração total
              </span>
              <span className="text-xl font-black text-blue-400">
                {formatDuration(totalDuration)}
              </span>
              {form.nap_minutes > 0 && (
                <span className="text-[10px] text-neutral-600 font-bold mt-1 uppercase">
                  ({formatDuration(nightDuration)} sono +{" "}
                  {formatDuration(form.nap_minutes)} soneca)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Qualidade e Notas */}
        <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label className={lc}>Qualidade percebida</Label>
            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setField("quality", q)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    form.quality === q
                      ? "bg-blue-600/10 border-blue-600/30 text-blue-400"
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold text-neutral-600 uppercase">
              {qualityLabel(form.quality)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ef-note" className={lc}>
              Observações qualitativas
            </Label>
            <Textarea
              id="ef-note"
              className="bg-card border-border rounded-xl min-h-[105px] resize-none pt-4 text-sm font-medium text-muted-foreground focus:border-blue-600/30 placeholder:text-neutral-700 transition-all"
              placeholder="Fatores externos, sonhos, interrupções..."
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
