"use client";

/**
 * Utilitários de data e formatação para o módulo de sono
 */

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function parseDate(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function qualityLabel(q: number) {
  switch (q) {
    case 5:
      return "Excelente";
    case 4:
      return "Boa";
    case 3:
      return "Razoável";
    case 2:
      return "Ruim";
    case 1:
      return "Péssima";
    default:
      return "—";
  }
}

export function qualityColor(q: number) {
  switch (q) {
    case 5:
      return "text-green-400";
    case 4:
      return "text-blue-400";
    case 3:
      return "text-yellow-400";
    case 2:
      return "text-orange-400";
    case 1:
      return "text-red-400";
    default:
      return "text-neutral-500";
  }
}

export function weekRange(referenceNow?: Date) {
  const now = referenceNow || new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now.getFullYear(), now.getMonth(), diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start: isoDate(start), end: isoDate(end) };
}

/**
 * Retorna o intervalo dos últimos 7 dias a partir de hoje (janela móvel)
 */
export function rollingRange(referenceNow?: Date) {
  const end = referenceNow || new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start: isoDate(start), end: isoDate(end) };
}

export function calcDurationMinutes(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  const bedMins = bh * 60 + bm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= bedMins) wakeMins += 24 * 60;
  return wakeMins - bedMins;
}
