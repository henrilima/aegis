"use client";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HEX_COLORS } from "@/colors.config";
import { cn, getColorTheme } from "@/lib/utils";

interface PeriodStats {
  decksCount: number;
  totalCards: number;
  reviewsCount: number;
  successCount: number;
  accuracy: number;
}

interface FlashcardsReportCanvasProps {
  periodStats: PeriodStats;
  periodTitle: string;
  periodRange: string;
  reportMode: "daily" | "weekly" | "monthly";
}

export function FlashcardsReportCanvas({
  periodStats,
  periodTitle,
  periodRange,
  reportMode,
}: FlashcardsReportCanvasProps) {
  const modeAccentColor = {
    daily: "blue",
    weekly: "indigo",
    monthly: "emerald",
  }[reportMode];
  const accentHex =
    HEX_COLORS[modeAccentColor as keyof typeof HEX_COLORS] || "#3b82f6";
  const theme = getColorTheme(modeAccentColor);
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

      // Desenha a imagem de fundo
      if (img) {
        ctx.save();
        ctx.filter = "brightness(0.6)";
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
        ctx.fillStyle = "#1c1c1e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Overlay escuro semi-transparente para contraste
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradientes de borda escuros
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.5)");
      grad.addColorStop(0.3, "transparent");
      grad.addColorStop(0.7, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cabeçalho do Aegis
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 120px Montserrat, sans-serif";
      ctx.fillText("AEGIS", canvas.width / 2, 200);

      ctx.fillStyle = accentHex;
      ctx.font = "800 38px Montserrat, sans-serif";
      ctx.fillText(periodTitle, canvas.width / 2, 280);

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "600 32px Montserrat, sans-serif";
      ctx.fillText(periodRange, canvas.width / 2, 340);

      // Métrica principal de aproveitamento
      const accuracyText = `${periodStats.accuracy}%`;
      ctx.font = "900 280px Montserrat, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(accuracyText, canvas.width / 2, 660);

      const perfLabel = "APROVEITAMENTO DOS ESTUDOS";
      ctx.font = "800 34px Montserrat, sans-serif";
      ctx.fillStyle = accentHex;
      ctx.fillText(perfLabel, canvas.width / 2, 730);

      const cardColor = "rgba(36, 36, 40, 0.85)";
      const borderColor = "rgba(255, 255, 255, 0.15)";
      const cx = canvas.width / 2;

      // Desenha ícones vetoriais customizados
      const drawIcon = (type: string, x: number, y: number) => {
        ctx.save();
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.translate(x, y);
        ctx.beginPath();
        if (type === "loop") {
          // Ícone de seta circular
          ctx.arc(0, 0, 22, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(15, -15);
          ctx.lineTo(22, 0);
          ctx.lineTo(3, 0);
        } else if (type === "check") {
          ctx.moveTo(-20, 0);
          ctx.lineTo(-5, 18);
          ctx.lineTo(22, -20);
        } else if (type === "cards") {
          // Retângulos de cartões
          ctx.rect(-24, -20, 36, 44);
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(-10, -32, 36, 44);
        } else if (type === "box") {
          // Pasta do baralho
          ctx.moveTo(-24, -20);
          ctx.lineTo(-6, -20);
          ctx.lineTo(0, -10);
          ctx.lineTo(24, -10);
          ctx.lineTo(24, 24);
          ctx.lineTo(-24, 24);
          ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
      };

      const drawFullCard = (
        y: number,
        type: string,
        label: string,
        value: string,
      ) => {
        const cw = 960,
          ch = 240,
          r = 40;
        ctx.save();
        ctx.fillStyle = cardColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(cx - cw / 2, y, cw, ch, r);
        ctx.fill();
        ctx.stroke();
        drawIcon(type, cx - 360, y + ch / 2);
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 85px Montserrat, sans-serif";
        ctx.fillText(value, cx - 280, y + ch / 2 + 10);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "700 32px Montserrat, sans-serif";
        ctx.fillText(label.toUpperCase(), cx - 280, y + ch / 2 + 55);
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
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "700 27px Montserrat, sans-serif";
        ctx.fillText(label.toUpperCase(), x + cw / 2, y + 240);
        ctx.restore();
      };

      drawFullCard(
        880,
        "loop",
        "Revisões realizadas",
        String(periodStats.reviewsCount),
      );
      drawFullCard(
        1160,
        "check",
        "Respostas corretas",
        String(periodStats.successCount),
      );

      drawHalfCard(
        cx - 960 / 2,
        1440,
        "cards",
        "Cartões",
        String(periodStats.totalCards),
      );
      drawHalfCard(
        cx + 20,
        1440,
        "box",
        "Baralhos",
        String(periodStats.decksCount),
      );

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "600 30px Montserrat, sans-serif";
      ctx.fillText("Sistema Aegis - Memorização Ativa", canvas.width / 2, 1850);

      setFileName(
        `relatorio-flashcards-${reportMode === "daily" ? "diario" : reportMode === "weekly" ? "semanal" : "mensal"}-${periodRange
          .toLowerCase()
          .replace(/ \/ | - |, |\/| /g, "-")
          .replace(/-+/g, "-")}`,
      );
    },
    [periodStats, periodTitle, periodRange, reportMode, accentHex],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    // Usando imagem de fundo personalizada solicitada pelo usuário
    img.src = "/images/flashcards-background.jpg";
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
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className={cn("w-4 h-4", theme.text)} />
          <h2 className="font-bold text-muted-foreground">
            Relatório visual (Story)
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
