"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook } from "../types";
import { formatMinutes } from "../utils";

interface PeriodStats {
  pages: number;
  minutes: number;
  sessions: number;
  booksFinished: number;
}

function generateReadingReport({
  periodStats,
  periodTitle,
  periodRange,
  goalPages,
  goalMinutes,
}: {
  periodStats: PeriodStats;
  periodTitle: string;
  periodRange: string;
  goalPages: number;
  goalMinutes: number;
  books: ReadingBook[];
}) {
  const mode = periodTitle.includes("DIÁRIO")
    ? "Diário"
    : periodTitle.includes("SEMANAL")
      ? "Semanal"
      : "Mensal";
  const cleanTitle = `Aegis — Relatório ${mode} de Leitura`;

  const cleanRange = periodRange
    .toLowerCase()
    .replace(/^[a-z]|\s[a-z]|- [a-z]/g, (letter) => letter.toUpperCase())
    .replace("Feira", "feira");

  const lines = [
    `📚 ${cleanTitle}`,
    `📅 ${cleanRange}`,
    ``,
    `📖 Páginas lidas: ${periodStats.pages}${
      goalPages > 0
        ? ` / ${goalPages} (${Math.round((periodStats.pages / goalPages) * 100)}%)`
        : ""
    }`,
    `⏱ Tempo de leitura: ${formatMinutes(periodStats.minutes)}${
      goalMinutes > 0
        ? ` / ${formatMinutes(goalMinutes)} (${Math.round((periodStats.minutes / goalMinutes) * 100)}%)`
        : ""
    }`,
    `📍 Sessões realizadas: ${periodStats.sessions}`,
    `✅ Livros concluídos: ${periodStats.booksFinished}`,
    periodStats.sessions > 0
      ? `📈 Média por sessão: ${Math.round(
          periodStats.pages / periodStats.sessions,
        )} pág.`
      : undefined,
    ``,
    `- Gerado pelo Aegis`,
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

interface ReadingTextReportProps {
  periodStats: PeriodStats;
  periodTitle: string;
  periodRange: string;
  goalPages: number;
  goalMinutes: number;
  books: ReadingBook[];
}

/** Bloco de relatório de leitura copiável em formato texto */
export function ReadingTextReport({
  periodStats,
  periodTitle,
  periodRange,
  goalPages,
  goalMinutes,
  books,
}: ReadingTextReportProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const text = generateReadingReport({
    periodStats,
    periodTitle,
    periodRange,
    goalPages,
    goalMinutes,
    books,
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Relatório copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Copy className={cn("w-4 h-4", theme.text)} />
          <h2 className="font-bold text-muted-foreground">
            Relatório Detalhado (Texto)
          </h2>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
            theme.bg,
            theme.text,
            theme.border,
            theme.bgHover,
          )}
        >
          <Copy className="w-3.5 h-3.5" /> Copiar Tudo
        </button>
      </div>
      <div className="p-6 flex-1">
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap bg-background border border-border rounded-xl p-6 leading-relaxed h-full overflow-y-auto">
          {text}
        </pre>
      </div>
    </div>
  );
}
