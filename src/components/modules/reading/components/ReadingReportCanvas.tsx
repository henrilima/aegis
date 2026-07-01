"use client";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HEX_COLORS } from "@/colors.config";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { formatMinutes } from "../utils";

interface PeriodStats {
  pages: number;
  minutes: number;
  sessions: number;
  booksFinished: number;
}

interface ReadingReportCanvasProps {
  periodStats: PeriodStats;
  goalPages: number;
  goalMinutes: number;
  periodTitle: string;
  periodRange: string;
  reportMode: "daily" | "weekly" | "monthly";
  accentColor?: string;
}

export function ReadingReportCanvas({
  periodStats,
  goalPages,
  periodTitle,
  periodRange,
  reportMode,
  accentColor = getModuleColor("reading"),
}: ReadingReportCanvasProps) {
  const accentHex =
    HEX_COLORS[accentColor as keyof typeof HEX_COLORS] || accentColor;
  const theme = getColorTheme(accentColor);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileName, setFileName] = useState("");

  const drawReport = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img?: HTMLImageElement,
    ) => {
      // Configura as dimensões do canvas para alta resolução (formato story)
      canvas.width = 1080;
      canvas.height = 1920;

      // Se houver uma imagem de fundo, desenha ela com efeito de escala e filtro
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

      // Overlay escuro semi-transparente para reduzir o contraste do fundo
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aplica um gradiente para escurecer as bordas superior e inferior (melhor legibilidade)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0,0,0,0.5)");
      grad.addColorStop(0.3, "transparent");
      grad.addColorStop(0.7, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Renderiza o cabeçalho do relatório (Título Aegis e Período)
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

      // Renderiza a métrica principal (total de páginas lidas)
      const pagesText = String(periodStats.pages);
      let fSize = 280;
      ctx.font = `900 ${fSize}px Montserrat, sans-serif`;
      // Ajusta o tamanho da fonte caso o texto seja muito grande
      while (ctx.measureText(pagesText).width > 980 && fSize > 100) {
        fSize -= 10;
        ctx.font = `900 ${fSize}px Montserrat, sans-serif`;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(pagesText, canvas.width / 2, 660);

      // Define o label de performance baseado na meta ou modo do relatório
      const perfLabel =
        goalPages > 0
          ? `PERFORMANCE: ${Math.round((periodStats.pages / goalPages) * 100)}% DA META`
          : reportMode === "daily"
            ? "PÁGINAS DO DIA"
            : reportMode === "weekly"
              ? "PÁGINAS DA SEMANA"
              : "PÁGINAS DO MÊS";

      let pFontSize = 34;
      ctx.font = `800 ${pFontSize}px Montserrat, sans-serif`;
      while (ctx.measureText(perfLabel).width > 960 && pFontSize > 20) {
        pFontSize -= 2;
        ctx.font = `800 ${pFontSize}px Montserrat, sans-serif`;
      }
      ctx.fillStyle = accentHex;
      ctx.fillText(perfLabel, canvas.width / 2, 730);

      const cardColor = "rgba(36, 36, 40, 0.85)";
      const borderColor = "rgba(255, 255, 255, 0.15)";
      const cx = canvas.width / 2;

      // Função auxiliar para desenhar ícones customizados no canvas
      const drawIcon = (type: string, x: number, y: number) => {
        ctx.save();
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.translate(x, y);
        ctx.beginPath();
        // Desenha o ícone correspondente ao tipo solicitado
        if (type === "clock") {
          ctx.arc(0, 0, 25, 0, Math.PI * 2);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -15);
          ctx.moveTo(0, 0);
          ctx.lineTo(12, 0);
        } else if (type === "book") {
          ctx.rect(-22, -28, 44, 56);
          ctx.moveTo(0, -28);
          ctx.lineTo(0, 28);
        } else if (type === "check") {
          ctx.moveTo(-20, 0);
          ctx.lineTo(-5, 18);
          ctx.lineTo(22, -20);
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
        ctx.textAlign = "right";
        ctx.fillStyle = accentHex;
        ctx.font = "800 32px Montserrat, sans-serif";
        ctx.fillText(sub.toUpperCase(), cx + 400, y + ch / 2 + 55);
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

      const timeLabel = formatMinutes(periodStats.minutes);

      drawFullCard(880, "clock", "Tempo de leitura", timeLabel, "");
      drawFullCard(
        1160,
        "check",
        "Livros concluídos",
        String(periodStats.booksFinished),
        "",
      );

      drawHalfCard(
        cx - 960 / 2,
        1440,
        "book",
        "Sessões",
        String(periodStats.sessions),
      );
      drawHalfCard(
        cx + 20,
        1440,
        "star",
        "Pág / Sessão",
        periodStats.sessions > 0
          ? String(Math.round(periodStats.pages / periodStats.sessions))
          : "0",
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
        `relatorio-leitura-${reportMode === "daily" ? "diario" : reportMode === "weekly" ? "semanal" : "mensal"}-${periodRange
          .toLowerCase()
          .replace(/ \/ | - |, |\/| /g, "-")
          .replace(/-+/g, "-")}`,
      );
    },
    [periodStats, goalPages, periodTitle, periodRange, reportMode, accentHex],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.src = "/images/readings-background.jpg";
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
