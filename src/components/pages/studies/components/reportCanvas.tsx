"use client";

import { BookOpen, Download, TrendingUp } from "lucide-react";
import { useRef } from "react";
import type { StudyStats } from "../types";
import { formatHours, hitRate } from "../utils";

interface ReportCanvasProps {
  weekStats: StudyStats;
  allStats: StudyStats;
}

export function ReportCanvas({ weekStats, allStats }: ReportCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configura o canvas para 1080x1920 (Portrait 1080p)
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo elegante
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, "#0a0a0a");
    grad.addColorStop(1, "#171717");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Borda/Detalhe lateral
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(0, 0, 15, 1920);

    // Título
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Inter, sans-serif";
    ctx.fillText("RELATÓRIO DE ESTUDOS", 80, 150);

    ctx.fillStyle = "#a3a3a3";
    ctx.font = "30px Inter, sans-serif";
    ctx.fillText(new Date().toLocaleDateString("pt-BR"), 80, 200);

    // Linha divisória
    ctx.strokeStyle = "#262626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 250);
    ctx.lineTo(1000, 250);
    ctx.stroke();

    // Dados da Semana
    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 45px Inter, sans-serif";
    ctx.fillText("SEMANA ATUAL", 80, 350);

    ctx.fillStyle = "#ffffff";
    ctx.font = "40px Inter, sans-serif";
    ctx.fillText(`Tempo: ${formatHours(weekStats.hours)}`, 100, 430);
    ctx.fillText(`Questões: ${weekStats.questions}`, 100, 500);
    ctx.fillText(`Páginas: ${weekStats.pages}`, 100, 570);
    ctx.fillText(
      `Acerto Inéditas: ${hitRate(weekStats.correctNew, weekStats.questionsNew)}%`,
      100,
      640,
    );

    // Dados Totais
    ctx.fillStyle = "#7c3aed";
    ctx.font = "bold 45px Inter, sans-serif";
    ctx.fillText("TOTAL ACUMULADO", 80, 780);

    ctx.fillStyle = "#ffffff";
    ctx.font = "40px Inter, sans-serif";
    ctx.fillText(`Tempo Total: ${formatHours(allStats.hours)}`, 100, 860);
    ctx.fillText(`Questões Totais: ${allStats.questions}`, 100, 930);
    ctx.fillText(`Sessões: ${allStats.sessionsCount}`, 100, 1000);

    // Footer
    ctx.fillStyle = "#525252";
    ctx.font = "italic 30px Inter, sans-serif";
    ctx.fillText("Aegis Academy - Desktop App", 80, 1850);

    // Download
    const link = document.createElement("a");
    link.download = `relatorio-estudos-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-violet-500" />
          <h2 className="text-sm font-black uppercase text-neutral-400">
            Relatório Visual (Story)
          </h2>
        </div>
        <button
          type="button"
          onClick={downloadCanvas}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase transition-all cursor-pointer shadow-lg shadow-violet-600/20"
        >
          <Download className="w-4 h-4" /> Baixar
        </button>
      </div>

      <div className="relative aspect-9/16 w-full max-w-[320px] mx-auto bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-inner group">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-neutral-400">
            Preview do Canva
          </span>
          <p className="text-[10px] text-neutral-600 mt-2 px-4">
            A imagem será gerada verticalmente no momento do download.
          </p>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
