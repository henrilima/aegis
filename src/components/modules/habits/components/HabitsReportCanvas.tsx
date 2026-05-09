"use client";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";

const COLOR_HEX: Record<string, string> = {
  rose: "#f43f5e",
  pink: "#ec4899",
  fuchsia: "#d946ef",
  purple: "#a855f7",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  green: "#22c55e",
  lime: "#84cc16",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  zinc: "#71717a",
  slate: "#64748b",
};

interface HabitsReportCanvasProps {
  habits: Habit[];
  accentColor?: string;
}

export function HabitsReportCanvas({
  habits,
  accentColor = "#14b8a6", // teal-500
}: HabitsReportCanvasProps) {
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileName, setFileName] = useState("");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const accent =
    accentColor !== "#14b8a6" ? accentColor : COLOR_HEX[color] || "#14b8a6";

  const positive = habits.filter((h) => h.habitType === "Positive");
  const negative = habits.filter(
    (h) => h.habitType === "Negative" || h.habitType === "Bad",
  );

  const totalCurrentStreak = positive.reduce(
    (acc, h) => acc + h.currentStreak,
    0,
  );
  const maxGlobalStreak = habits.reduce(
    (acc, h) => Math.max(acc, h.maxStreak),
    0,
  );
  const activeMaxStreak = positive.reduce(
    (acc, h) => Math.max(acc, h.currentStreak),
    0,
  );

  // Cálculo de Performance Global (Média de progresso em relação às metas ou recordes)
  const _globalPerformance = useMemo(() => {
    if (habits.length === 0) return 0;
    const total = habits.reduce((acc, h) => {
      const target =
        h.goalDays && h.goalDays > 0
          ? h.goalDays
          : h.maxStreak > 0
            ? h.maxStreak
            : 7;
      return acc + Math.min(100, (h.currentStreak / target) * 100);
    }, 0);
    return Math.round(total / habits.length);
  }, [habits]);

  const drawReport = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img?: HTMLImageElement | null,
    ) => {
      canvas.width = 1080;
      canvas.height = 1920;

      if (img) {
        ctx.save();
        ctx.filter = "grayscale(100%) brightness(0.25)";
        const ca = canvas.width / canvas.height;
        const ia = img.width / img.height;
        let dW = canvas.width,
          dH = canvas.height,
          oX = 0,
          oY = 0;
        if (ia > ca) {
          dW = canvas.height * ia;
          oX = (canvas.width - dW) / 2;
        } else {
          dH = canvas.width / ia;
          oY = (canvas.height - dH) / 2;
        }
        ctx.drawImage(img, oX, oY, dW, dH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.85)");
      grad.addColorStop(0.3, "transparent");
      grad.addColorStop(0.7, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 120px Montserrat, sans-serif";
      ctx.fillText("AEGIS", canvas.width / 2, 200);

      ctx.fillStyle = accent;
      ctx.font = "800 38px Montserrat, sans-serif";
      ctx.fillText("RELATÓRIO DE HÁBITOS", canvas.width / 2, 280);

      const dateStr = new Date()
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        .toUpperCase();
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 32px Montserrat, sans-serif";
      ctx.fillText(dateStr, canvas.width / 2, 340);

      const mainText = String(totalCurrentStreak);
      let fSize = 280;
      ctx.font = `900 ${fSize}px Montserrat, sans-serif`;
      while (ctx.measureText(mainText).width > 980 && fSize > 100) {
        fSize -= 10;
        ctx.font = `900 ${fSize}px Montserrat, sans-serif`;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(mainText, canvas.width / 2, 660);

      const perfLabel = "OFENSIVA ACUMULADA (DIAS)";
      let pFontSize = 34;
      ctx.font = `800 ${pFontSize}px Montserrat, sans-serif`;
      while (ctx.measureText(perfLabel).width > 960 && pFontSize > 20) {
        pFontSize -= 2;
        ctx.font = `800 ${pFontSize}px Montserrat, sans-serif`;
      }
      ctx.fillStyle = accent;
      ctx.fillText(perfLabel, canvas.width / 2, 730);

      const cardColor = "rgba(15, 15, 15, 0.85)";
      const borderColor = "rgba(255, 255, 255, 0.1)";
      const cx = canvas.width / 2;

      const drawIcon = (type: string, x: number, y: number) => {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.translate(x, y);
        ctx.beginPath();
        if (type === "zap") {
          ctx.moveTo(5, -20);
          ctx.lineTo(-15, 5);
          ctx.lineTo(5, 5);
          ctx.lineTo(-5, 20);
          ctx.lineTo(15, -5);
          ctx.lineTo(-5, -5);
          ctx.closePath();
        } else if (type === "shield") {
          ctx.moveTo(-20, -20);
          ctx.lineTo(20, -20);
          ctx.lineTo(20, 0);
          ctx.arc(0, 0, 20, 0, Math.PI);
          ctx.closePath();
        } else if (type === "star") {
          ctx.moveTo(0, -25);
          ctx.lineTo(6, -8);
          ctx.lineTo(24, -8);
          ctx.lineTo(10, 4);
          ctx.lineTo(15, 22);
          ctx.lineTo(0, 12);
          ctx.lineTo(-15, 22);
          ctx.lineTo(-10, 4);
          ctx.lineTo(-24, -8);
          ctx.lineTo(-6, -8);
          ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
      };

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

      drawHalfCard(
        cx - 960 / 2,
        960,
        "zap",
        "Hábitos (Foco)",
        String(positive.length),
      );
      drawHalfCard(
        cx + 20,
        960,
        "shield",
        "Vícios (Controle)",
        String(negative.length),
      );

      drawHalfCard(
        cx - 960 / 2,
        1320,
        "star",
        "Maior Ofensiva",
        String(activeMaxStreak),
      );
      drawHalfCard(
        cx + 20,
        1320,
        "star",
        "Recorde Global",
        String(maxGlobalStreak),
      );

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 30px Montserrat, sans-serif";
      ctx.fillText(
        "Sistema Aegis - Software para Desktop",
        canvas.width / 2,
        1850,
      );

      setFileName(
        `relatorio-habitos-${dateStr
          .toLowerCase()
          .replace(/ \/ | - |, |\/| /g, "-")
          .replace(/-+/g, "-")}`,
      );
    },
    [
      positive.length,
      negative.length,
      totalCurrentStreak,
      activeMaxStreak,
      maxGlobalStreak,
      accent,
    ],
  );

  useEffect(() => {
    const img = new Image();
    img.src = "/images/habits-background.jpg";
    img.onload = () => setBgImage(img);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawReport(ctx, canvas, bgImage);
  }, [drawReport, bgImage]);

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
        filters: [{ name: "Imagens", extensions: ["png"] }],
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
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col min-h-[500px]">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className={cn("w-4 h-4", theme.text)} />
          <h2 className="font-bold text-muted-foreground">
            Relatório Visual (Story)
          </h2>
        </div>
        <button
          type="button"
          onClick={downloadCanvas}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border disabled:opacity-50",
            theme.bg,
            theme.text,
            theme.border,
            theme.bgHover,
          )}
        >
          <Download className="w-3.5 h-3.5" /> Baixar
        </button>
      </div>

      <div className="p-4 flex-1 flex items-center justify-center bg-background/20">
        <div className="relative aspect-9/16 w-full max-w-[303px] mx-auto rounded-xl border border-border overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            style={{ imageRendering: "crisp-edges" }}
          />
        </div>
      </div>
    </div>
  );
}
