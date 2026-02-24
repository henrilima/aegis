"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { SleepEntry } from "./types";

export function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function parseDate(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
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
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function qualityLabel(q: number) {
  return ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][q] ?? "";
}

export function qualityColor(q: number) {
  if (q >= 4) return "text-green-400";
  if (q === 3) return "text-yellow-400";
  return "text-red-400";
}

export function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now.getFullYear(), now.getMonth(), diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: isoDate(start), end: isoDate(end) };
}

export function Stars({ q }: { q: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= q ? "fill-yellow-400 text-yellow-400" : "text-neutral-700"}`}
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

export function EntryForm({
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

  const ic =
    "w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors";
  const lc = "text-[10px] font-black uppercase  text-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ef-date" className={lc}>
          Data (acordei em) <span className="text-red-500">*</span>
        </label>
        <input
          id="ef-date"
          type="date"
          className={ic}
          value={form.date}
          onChange={(e) => setField("date", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ef-bedtime" className={lc}>
            Hora de dormir <span className="text-red-500">*</span>
          </label>
          <input
            id="ef-bedtime"
            type="time"
            className={ic}
            value={form.bedtime}
            onChange={(e) => setField("bedtime", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ef-wake" className={lc}>
            Hora de acordar <span className="text-red-500">*</span>
          </label>
          <input
            id="ef-wake"
            type="time"
            className={ic}
            value={form.wake_time}
            onChange={(e) => setField("wake_time", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="text-center py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <span className="text-xs text-blue-400 font-bold">
          Duração: {formatDuration(duration)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className={lc}>Qualidade do sono</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setField("quality", q)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                form.quality === q
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-600">
          {qualityLabel(form.quality)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ef-note" className={lc}>
          Observação
        </label>
        <textarea
          id="ef-note"
          className={`${ic} resize-none h-16`}
          placeholder="Ex: acordou no meio da noite, pesadelo..."
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          {initial ? "Salvar alterações" : "Registrar sono"}
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
