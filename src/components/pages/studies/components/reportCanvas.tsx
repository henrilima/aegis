"use client";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { StudySession, StudyStats } from "../types";
import { formatHours } from "../utils";

interface ReportCanvasProps {
  periodStats: StudyStats;
  periodSessions: StudySession[];
  goalValue: (type: string) => number;
  periodTitle: string;
  periodRange: string;
  reportMode: "daily" | "weekly" | "monthly";
  accentColor?: string;
}

export function ReportCanvas({
  periodStats,
  periodSessions,
  goalValue,
  periodTitle,
  periodRange,
  reportMode,
  accentColor = "#a78bfa",
}: ReportCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileName, setFileName] = useState("");

  const drawReport = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img?: HTMLImageElement,
    ) => {
      canvas.width = 1080;
      canvas.height = 1920;

      // Determinando prefixo da meta
      const goalPrefix = reportMode === "monthly" ? "monthly_" : "weekly_";

      if (img) {
        ctx.save();
        ctx.filter = "grayscale(100%) brightness(0.3)";
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let dW = canvas.width,
          dH = canvas.height,
          oX = 0,
          oY = 0;
        if (imgAspect > canvasAspect) {
          dW = canvas.height * imgAspect;
          oX = (canvas.width - dW) / 2;
        } else {
          dH = canvas.width / imgAspect;
          oY = (canvas.height - dH) / 2;
        }
        ctx.drawImage(img, oX, oY, dW, dH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.8)");
      grad.addColorStop(0.3, "transparent");
      grad.addColorStop(0.7, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const accent = accentColor;
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 120px Montserrat, sans-serif";
      ctx.fillText("AEGIS", canvas.width / 2, 200);

      ctx.fillStyle = accent;
      ctx.font = "800 38px Montserrat, sans-serif";
      ctx.fillText(periodTitle.toUpperCase(), canvas.width / 2, 280);

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 32px Montserrat, sans-serif";
      ctx.fillText(periodRange, canvas.width / 2, 340);

      const hasPages = periodStats.pages > 0;

      // Rótulo da meta para modo diário
      const metaPrefix = reportMode === "daily" ? "META SEM." : "META";

      // Horas: posição Y muda conforme se há páginas ou não
      const hoursY = hasPages ? 640 : 700;
      const perfY = hasPages ? 715 : 780;

      ctx.fillStyle = "#ffffff";
      const hoursText = formatHours(periodStats.hours);
      let fontSize = 280;
      ctx.font = `900 ${fontSize}px Montserrat, sans-serif`;

      // Ajuste dinâmico para não vazar
      while (ctx.measureText(hoursText).width > 980 && fontSize > 100) {
        fontSize -= 10;
        ctx.font = `900 ${fontSize}px Montserrat, sans-serif`;
      }

      ctx.fillText(hoursText, canvas.width / 2, hoursY);

      const hrGoal = goalValue(`${goalPrefix}hours`);
      ctx.fillStyle = accent;
      const perfText =
        hrGoal > 0
          ? `PERFORMANCE: ${Math.round((periodStats.hours / hrGoal) * 100)}% DA ${metaPrefix}`
          : reportMode === "monthly"
            ? "ESTUDOS DO MÊS"
            : reportMode === "daily"
              ? "ESTUDOS DO DIA"
              : "ESTUDOS DA SEMANA";

      // Ajuste dinâmico da fonte do perfText para não vazar
      let perfFontSize = 34;
      ctx.font = `800 ${perfFontSize}px Montserrat, sans-serif`;
      while (ctx.measureText(perfText).width > 960 && perfFontSize > 20) {
        perfFontSize -= 2;
        ctx.font = `800 ${perfFontSize}px Montserrat, sans-serif`;
      }
      ctx.fillText(perfText, canvas.width / 2, perfY);

      const cardColor = "rgba(15, 15, 15, 0.85)";
      const borderColor = "rgba(255, 255, 255, 0.1)";
      const centerX = canvas.width / 2;

      const drawIcon = (type: string, x: number, y: number) => {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.translate(x, y);
        ctx.beginPath();
        if (type === "q") {
          ctx.rect(-25, -25, 50, 50);
          ctx.moveTo(-12, -8);
          ctx.lineTo(12, -8);
          ctx.moveTo(-12, 8);
          ctx.lineTo(12, 8);
        } else if (type === "p") {
          ctx.rect(-22, -28, 44, 56);
          ctx.moveTo(0, -28);
          ctx.lineTo(0, 28);
        } else if (type === "s") {
          ctx.arc(0, 0, 25, 0, Math.PI * 2);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -15);
          ctx.moveTo(0, 0);
          ctx.lineTo(12, 0);
        } else if (type === "e") {
          ctx.moveTo(-20, 10);
          ctx.lineTo(0, -10);
          ctx.lineTo(10, 0);
          ctx.lineTo(25, -20);
          ctx.moveTo(10, -20);
          ctx.lineTo(25, -20);
          ctx.lineTo(25, -5);
        }
        ctx.stroke();
        ctx.restore();
      };

      // CARD LARGO (Questões e Páginas)
      const drawFullCard = (
        y: number,
        type: string,
        label: string,
        value: string,
        sub: string,
      ) => {
        const cw = 960,
          ch = 240,
          r = 40;
        ctx.save();
        ctx.fillStyle = cardColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(centerX - cw / 2, y, cw, ch, r);
        ctx.fill();
        ctx.stroke();

        drawIcon(type, centerX - 360, y + ch / 2);

        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 85px Montserrat, sans-serif";
        ctx.fillText(value, centerX - 280, y + ch / 2 + 10);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "700 32px Montserrat, sans-serif";
        ctx.fillText(label.toUpperCase(), centerX - 280, y + ch / 2 + 55);

        ctx.textAlign = "right";
        ctx.fillStyle = accent;
        ctx.font = "800 32px Montserrat, sans-serif";
        ctx.fillText(sub.toUpperCase(), centerX + 400, y + ch / 2 + 55);
        ctx.restore();
      };

      // CARD METADE (Lado a Lado - Coluna Interna)
      const drawHalfCard = (
        x: number,
        y: number,
        type: string,
        label: string,
        value: string,
      ) => {
        const cw = 460,
          ch = 310,
          r = 40;
        ctx.save();
        ctx.fillStyle = cardColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, y, cw, ch, r);
        ctx.fill();
        ctx.stroke();

        // Layout em Coluna
        drawIcon(type, x + cw / 2, y + 82);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 68px Montserrat, sans-serif";
        ctx.fillText(value, x + cw / 2, y + 190);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "700 27px Montserrat, sans-serif";
        ctx.fillText(label.toUpperCase(), x + cw / 2, y + 240);
        ctx.restore();
      };

      // Cálculo de Eficiência: Apenas sessões que tiveram questões
      const sessionsWithQuestions = periodSessions.filter(
        (s: StudySession) => s.questions_new + s.questions_review > 0,
      );
      const totalQuestions = sessionsWithQuestions.reduce(
        (acc: number, s: StudySession) =>
          acc + s.questions_new + s.questions_review,
        0,
      );
      const totalHoursWithQuestions = sessionsWithQuestions.reduce(
        (acc: number, s: StudySession) => acc + s.hours,
        0,
      );
      const efficiency =
        totalHoursWithQuestions > 0
          ? Math.round(totalQuestions / totalHoursWithQuestions)
          : 0;

      const qGoal = goalValue(`${goalPrefix}questions`);
      const pGoal = goalValue(`${goalPrefix}pages`);

      if (hasPages) {
        // Layout completo: questões em 900, páginas em 1180, half-cards em 1460
        const spacing = 280;
        const startY = 900;

        drawFullCard(
          startY,
          "q",
          "Questões Resolvidas",
          `${periodStats.questions}`,
          qGoal > 0 ? `${metaPrefix}: ${qGoal}` : "",
        );

        drawFullCard(
          startY + spacing,
          "p",
          "Páginas Lidas",
          `${periodStats.pages}`,
          pGoal > 0 ? `${metaPrefix}: ${pGoal}` : "",
        );

        const subCardY = startY + spacing * 2;
        drawHalfCard(
          centerX - 960 / 2,
          subCardY,
          "s",
          "Sessões",
          `${periodStats.sessionsCount}`,
        );
        drawHalfCard(
          centerX + 20,
          subCardY,
          "e",
          "Questões / H",
          `${efficiency}`,
        );
      } else {
        // Sem páginas: questões desce para o centro, half-cards logo abaixo
        const startY = 1030;
        const halfCardY = startY + 320;

        drawFullCard(
          startY,
          "q",
          "Questões Resolvidas",
          `${periodStats.questions}`,
          qGoal > 0 ? `${metaPrefix}: ${qGoal}` : "",
        );

        drawHalfCard(
          centerX - 960 / 2,
          halfCardY,
          "s",
          "Sessões",
          `${periodStats.sessionsCount}`,
        );
        drawHalfCard(
          centerX + 20,
          halfCardY,
          "e",
          "Questões / H",
          `${efficiency}`,
        );
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 30px Montserrat, sans-serif";
      ctx.fillText(
        "Sistema Aegis - Software para Desktop",
        canvas.width / 2,
        1850,
      );

      setFileName(
        `relatorio-${reportMode === "daily" ? "diario" : reportMode === "weekly" ? "semanal" : "mensal"}-${periodRange
          .toLowerCase()
          .replace(/ \/ | - |, |\/| /g, "-")
          .replace(/-+/g, "-")}`,
      );
    },
    [
      periodStats,
      periodSessions,
      goalValue,
      periodTitle,
      periodRange,
      reportMode,
      accentColor,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = "/images/studies-background.jpg";
    img.onload = () => drawReport(ctx, canvas, img);
    img.onerror = () => drawReport(ctx, canvas);
  }, [drawReport]);

  const downloadCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0),
      );

      const path = await save({
        filters: [
          {
            name: "Imagens",
            extensions: ["png"],
          },
        ],
        defaultPath: `${fileName}.png`,
      });

      if (path) {
        await writeFile(path, binaryData);
        toast.success("Relatório salvo com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao salvar relatório:", err);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          <h2 className=" font-black uppercase text-muted-foreground">
            Relatório Visual (Story)
          </h2>
        </div>
        <button
          type="button"
          onClick={downloadCanvas}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase transition-all cursor-pointer border border-violet-600/30 hover:bg-violet-600/30"
        >
          <Download className="w-3.5 h-3.5" /> Baixar
        </button>
      </div>

      <div className="p-4 flex-1 flex items-center justify-center bg-background/20">
        <div className="relative aspect-9/16 w-full max-w-[303px] mx-auto rounded-xl border border-border overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            style={{
              imageRendering: "crisp-edges",
            }}
          />
        </div>
      </div>
    </div>
  );
}
