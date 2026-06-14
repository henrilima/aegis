"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";

interface PeriodStats {
  decksCount: number;
  totalCards: number;
  reviewsCount: number;
  successCount: number;
  accuracy: number;
}

function generateFlashcardReport({
  periodStats,
  periodTitle,
  periodRange,
}: {
  periodStats: PeriodStats;
  periodTitle: string;
  periodRange: string;
}) {
  const mode = periodTitle.toLowerCase().includes("diário")
    ? "Diário"
    : periodTitle.toLowerCase().includes("semanal")
      ? "Semanal"
      : "Mensal";
  const cleanTitle = `Aegis — Relatório ${mode} de Flashcards`;

  const cleanRange = periodRange
    .toLowerCase()
    .replace(/^[a-z]|\s[a-z]|- [a-z]/g, (letter) => letter.toUpperCase())
    .replace("Feira", "feira");

  const lines = [
    `🧠 ${cleanTitle}`,
    `📅 ${cleanRange}`,
    ``,
    `📂 Baralhos ativos: ${periodStats.decksCount}`,
    `🃏 Cartões cadastrados: ${periodStats.totalCards}`,
    `🔄 Revisões realizadas: ${periodStats.reviewsCount}`,
    `✅ Respostas corretas: ${periodStats.successCount}`,
    `📈 Taxa de acerto global: ${
      periodStats.reviewsCount > 0 ? `${periodStats.accuracy}%` : "0%"
    }`,
    ``,
    `- Gerado pelo Aegis`,
  ];
  return lines.join("\n");
}

interface FlashcardsTextReportProps {
  periodStats: PeriodStats;
  periodTitle: string;
  periodRange: string;
  reportMode: "daily" | "weekly" | "monthly";
}

const MODE_COLOR: Record<string, string> = {
  daily: "blue",
  weekly: "indigo",
  monthly: "emerald",
};

export function FlashcardsTextReport({
  periodStats,
  periodTitle,
  periodRange,
  reportMode,
}: FlashcardsTextReportProps) {
  const theme = getColorTheme(MODE_COLOR[reportMode] || "blue");
  const text = generateFlashcardReport({
    periodStats,
    periodTitle,
    periodRange,
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
            Relatório detalhado (Texto)
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
          <Copy className="w-3.5 h-3.5" /> Copiar tudo
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
