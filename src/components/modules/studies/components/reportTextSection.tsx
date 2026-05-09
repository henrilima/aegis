"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudyStats } from "../types";
import { formatHours, hitRate } from "../utils";

interface ReportTextSectionProps {
  periodStats: StudyStats;
  periodTitle: string;
  periodRange: string;
  reportMode: "daily" | "weekly" | "monthly";
  goalValue: (type: string) => number;
}

export function ReportTextSection({
  periodStats,
  periodTitle,
  periodRange,
  reportMode,
  goalValue,
}: ReportTextSectionProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const generateDynamicText = () => {
    let typeHours = "weekly_hours";
    let typeQuestions = "weekly_questions";
    let typePages = "weekly_pages";

    if (reportMode === "monthly") {
      typeHours = "monthly_hours";
      typeQuestions = "monthly_questions";
      typePages = "monthly_pages";
    }

    const goalHours = goalValue(typeHours);
    const goalQ = goalValue(typeQuestions);
    const goalP = goalValue(typePages);

    const lines = [
      `📊 ${periodTitle}`,
      `📅 ${periodRange}`,
      ``,
      `  ⏱ Tempo: ${formatHours(periodStats.hours)}${reportMode !== "daily" ? ` / ${goalHours ? formatHours(goalHours) : "-"}` : ""}`,
      `  📝 Questões: ${periodStats.questions}${reportMode !== "daily" ? ` / ${goalQ || "-"}` : ""}`,
      `  📖 Páginas: ${periodStats.pages}${reportMode !== "daily" ? ` / ${goalP || "-"}` : ""}`,
      `  ✅ Acerto Inéditas: ${hitRate(periodStats.correctNew, periodStats.questionsNew)}%`,
      `  🔄 Acerto Refeitas: ${hitRate(periodStats.correctReview, periodStats.questionsReview)}%`,
      `  🎓 Sessões Realizadas: ${periodStats.sessionsCount}`,
      ``,
      `- Gerado pelo Aegis`,
    ];
    return lines.join("\n");
  };

  const text = generateDynamicText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Relatório copiado!");
    } catch {
      toast.error("Erro ao copiar o relatório.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Copy className={cn("w-4 h-4", theme.text)} />
          <h2 className=" font-bold text-muted-foreground">
            Relatório Detalhado (Texto)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border",
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
