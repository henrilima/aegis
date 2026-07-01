"use client";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { Download, Film, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/context/AuthContext";
import { useAvatar } from "@/hooks/useAvatar";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Movie } from "../types";

interface MovieCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
}

export function MovieCanvasModal({
  isOpen,
  onClose,
  movie,
}: MovieCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = getModuleColor("movies");
  const theme = getColorTheme(color);
  const { user } = useAuth();
  const { avatarSrc } = useAvatar(user?.id);
  const [isDrawing, setIsDrawing] = useState(true);

  // Helper seguro de roundRect para contornar problemas de dependências
  const drawRoundRect = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) => {
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
      }
    },
    [],
  );

  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number,
      filled: boolean,
      half?: boolean,
    ) => {
      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.24, -r * 0.32);
      ctx.lineTo(r * 0.95, -r * 0.32);
      ctx.lineTo(r * 0.38, r * 0.16);
      ctx.lineTo(r * 0.59, r * 0.9);
      ctx.lineTo(0, r * 0.48);
      ctx.lineTo(-r * 0.59, r * 0.9);
      ctx.lineTo(-r * 0.38, r * 0.16);
      ctx.lineTo(-r * 0.95, -r * 0.32);
      ctx.lineTo(-r * 0.24, -r * 0.32);
      ctx.closePath();

      if (filled) {
        ctx.fillStyle = "#fbbf24"; // Amber 400
        ctx.fill();
      } else if (half) {
        // Desenha meia estrela usando recorte (clipping)
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.rect(-r, -r, r, r * 2);
        ctx.clip();

        // Redesenha a estrela para preencher a metade esquerda
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.24, -r * 0.32);
        ctx.lineTo(r * 0.95, -r * 0.32);
        ctx.lineTo(r * 0.38, r * 0.16);
        ctx.lineTo(r * 0.59, r * 0.9);
        ctx.lineTo(0, r * 0.48);
        ctx.lineTo(-r * 0.59, r * 0.9);
        ctx.lineTo(-r * 0.38, r * 0.16);
        ctx.lineTo(-r * 0.95, -r * 0.32);
        ctx.lineTo(-r * 0.24, -r * 0.32);
        ctx.closePath();
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  const drawCanvas = useCallback(
    (
      bgImg?: HTMLImageElement,
      posterImg?: HTMLImageElement,
      avatarImg?: HTMLImageElement,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas || !movie) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setIsDrawing(true);

      canvas.width = 1080;
      canvas.height = 1920;

      // 1. Desenha a imagem de fundo
      if (bgImg?.complete && bgImg.naturalWidth > 0) {
        ctx.save();
        ctx.filter = "brightness(0.35)"; // Fundo ligeiramente mais escuro para melhor contraste
        const ca = canvas.width / canvas.height;
        const ia = bgImg.width / bgImg.height;
        let dW = canvas.width;
        let dH = canvas.height;
        let oX = 0;
        let oY = 0;
        if (ia > ca) {
          dW = canvas.height * ia;
          oX = (canvas.width - dW) / 2;
        } else {
          dH = canvas.width / ia;
          oY = (canvas.height - dH) / 2;
        }
        ctx.drawImage(bgImg, oX, oY, dW, dH);
        ctx.restore();
      } else {
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Adiciona desfoque suave e camada cinemática escura
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
      grad.addColorStop(0.2, "rgba(0, 0, 0, 0.1)");
      grad.addColorStop(0.8, "rgba(0, 0, 0, 0.15)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Renderiza a marca e subtítulo do Aegis
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 120px Montserrat, sans-serif";
      ctx.fillText("AEGIS", canvas.width / 2, 200);

      ctx.fillStyle = "#e11d48"; // Cor de destaque Rose-600
      ctx.font = "800 38px Montserrat, sans-serif";
      ctx.fillText("MEMÓRIA CINEMATOGRÁFICA", canvas.width / 2, 280);
      ctx.restore();

      // 3. Desenha a capa do filme (Poster)
      const pw = 580;
      const ph = 850;
      const px = (canvas.width - pw) / 2;
      const py = 340;
      const pr = 36;

      // Desenha a sombra do poster para profundidade
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.82)";
      ctx.shadowBlur = 55;
      ctx.shadowOffsetY = 24;
      ctx.fillStyle = "#16161a";
      ctx.beginPath();
      drawRoundRect(ctx, px, py, pw, ph, pr);
      ctx.fill();
      ctx.restore();

      // Desenha o poster real dentro do quadro
      if (posterImg?.complete && posterImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        drawRoundRect(ctx, px, py, pw, ph, pr);
        ctx.clip();
        ctx.drawImage(posterImg, px, py, pw, ph);
        ctx.restore();
      } else {
        // Capa padrão (fallback)
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 6;
        ctx.strokeRect(px + 40, py + 40, pw - 80, ph - 80);
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.font = "400 90px sans-serif";
        ctx.fillText("🎬", canvas.width / 2, py + ph / 2 + 10);
        ctx.restore();
      }

      // Desenha contorno elegante sobre o poster
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      drawRoundRect(ctx, px, py, pw, ph, pr);
      ctx.stroke();
      ctx.restore();

      // 4. Calcula o tamanho e formata o texto do card
      const cx = canvas.width / 2;
      const cy = 1290;
      const cw = 960;
      const cr = 44;

      // Lógica de quebra de linha do título
      const wrapText = (txt: string, maxW: number): string[] => {
        const words = txt.split(" ");
        const res: string[] = [];
        let curr = words[0] || "";

        for (let i = 1; i < words.length; i++) {
          const w = words[i];
          const width = ctx.measureText(`${curr} ${w}`).width;
          if (width < maxW) {
            curr += ` ${w}`;
          } else {
            res.push(curr);
            curr = w;
          }
        }
        if (curr) res.push(curr);
        return res;
      };

      ctx.save();
      let fontSize = 52;
      ctx.font = `800 ${fontSize}px Montserrat, sans-serif`;
      let lines = wrapText(movie?.title || "", 840);

      // Reduz dinamicamente a fonte se o título for muito longo
      while (
        (lines.length > 2 ||
          (lines.length === 2 && ctx.measureText(lines[1]).width > 840)) &&
        fontSize > 34
      ) {
        fontSize -= 2;
        ctx.font = `800 ${fontSize}px Montserrat, sans-serif`;
        lines = wrapText(movie?.title || "", 840);
      }

      // Trunca com reticências caso passe de 2 linhas
      if (lines.length > 2) {
        let secondLine = lines[1];
        while (
          ctx.measureText(`${secondLine}...`).width > 840 &&
          secondLine.length > 0
        ) {
          secondLine = secondLine.slice(0, -1);
        }
        lines = [lines[0], `${secondLine.trim()}...`];
      }
      ctx.restore();

      // Cálculos de altura dinâmica do card
      const titleHeight = lines.length === 1 ? fontSize : fontSize * 2 + 12;
      const directorHeight = movie?.director ? 24 + 30 : 0;
      const starsHeight = 24 + 56;
      const userProfileHeight = 24 + 56;
      const ch =
        110 +
        titleHeight +
        directorHeight +
        starsHeight +
        userProfileHeight +
        44;

      // Desenha o card translúcido
      ctx.save();
      const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + ch);
      cardGrad.addColorStop(0, "rgba(20, 20, 25, 0.88)");
      cardGrad.addColorStop(1, "rgba(10, 10, 14, 0.96)");
      ctx.fillStyle = cardGrad;

      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.11)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      drawRoundRect(ctx, cx - cw / 2, cy, cw, ch, cr);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 5. Desenha detalhes do filme no card
      // Badge de subtítulo (ano e categoria)
      const details = [
        movie?.year ? String(movie.year) : "",
        movie?.category ? movie.category.toUpperCase() : "",
      ]
        .filter(Boolean)
        .join("  ·  ");

      if (details) {
        ctx.save();
        ctx.font = "800 19px Montserrat, sans-serif";
        const textWidth = ctx.measureText(details).width;
        const badgeW = textWidth + 44;
        const badgeH = 42;
        const badgeX = cx - badgeW / 2;
        const badgeY = cy + 42;

        // Fundo translúcido da pílula
        ctx.fillStyle = "rgba(225, 29, 72, 0.12)";
        ctx.strokeStyle = "rgba(225, 29, 72, 0.26)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 21);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f43f5e";
        ctx.textAlign = "center";
        ctx.fillText(details, cx, badgeY + 27);
        ctx.restore();
      }

      // Desenha título centralizado verticalmente
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      const titleCenterY = cy + 110 + titleHeight / 2;
      const titleLineHeight = fontSize + 12;

      ctx.font = `800 ${fontSize}px Montserrat, sans-serif`;
      if (lines.length === 1) {
        ctx.fillText(lines[0], cx, titleCenterY + fontSize / 3.2);
      } else {
        const firstLineY = titleCenterY - titleLineHeight / 2 + fontSize / 3.2;
        ctx.fillText(lines[0], cx, firstLineY);
        ctx.fillText(lines[1], cx, firstLineY + titleLineHeight);
      }
      ctx.restore();

      if (movie?.director) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
        ctx.font = "600 28px Montserrat, sans-serif";
        ctx.fillText(
          `Direção: ${movie.director}`,
          cx,
          cy + 110 + titleHeight + 48,
        );
        ctx.restore();
      }

      const rating = movie?.stars ?? 0;
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const starRadius = 28;
      const starSpacing = 68;
      const startX = cx - (4 * starSpacing) / 2;
      const starY = cy + 110 + titleHeight + directorHeight + 24 + 28;

      for (let i = 0; i < 5; i++) {
        const starX = startX + i * starSpacing;
        const isFilled = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;
        drawStar(ctx, starX, starY, starRadius, isFilled, isHalf);
      }

      // 5.5 Desenha seção do perfil do usuário
      const userY =
        cy + 110 + titleHeight + directorHeight + starsHeight + 24 + 28;
      const avatarR = 28;

      ctx.save();
      ctx.font = "700 24px Montserrat, sans-serif";
      const displayUsername = user?.username || "Usuário Aegis";
      const usernameW = ctx.measureText(displayUsername).width;

      const blockW = 56 + 16 + usernameW;
      const blockStartX = cx - blockW / 2;
      const avatarX = blockStartX + 28;
      ctx.restore();

      // Desenha imagem de avatar ou inicial padrão
      if (avatarImg?.complete && avatarImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, userY, avatarR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          avatarImg,
          avatarX - avatarR,
          userY - avatarR,
          avatarR * 2,
          avatarR * 2,
        );
        ctx.restore();
      } else {
        // Desenha avatar padrão elegante
        ctx.save();
        ctx.fillStyle = "rgba(225, 29, 72, 0.2)";
        ctx.strokeStyle = "rgba(225, 29, 72, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(avatarX, userY, avatarR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 26px Montserrat, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const initial = (user?.username || "A").charAt(0).toUpperCase();
        ctx.fillText(initial, avatarX, userY + 2);
        ctx.restore();
      }

      // Desenha contorno fino do avatar
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(avatarX, userY, avatarR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Desenha nome do usuário e rótulo
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "800 16px Montserrat, sans-serif";
      ctx.fillText("CRÍTICO(A) AEGIS", avatarX + 40, userY - 14);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 24px Montserrat, sans-serif";
      ctx.fillText(displayUsername, avatarX + 40, userY + 12);
      ctx.restore();

      // 6. Desenha créditos no rodapé
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.32)";
      ctx.font = "700 18px Montserrat, sans-serif";
      ctx.fillText(
        "Sistema Aegis - Software para Desktop",
        canvas.width / 2,
        cy + ch + 90,
      );
      ctx.restore();

      setIsDrawing(false);
    },
    [movie, user, drawRoundRect, drawStar],
  );

  useEffect(() => {
    if (!isOpen || !movie) return;

    setIsDrawing(true);

    let loadedCount = 0;
    const needPoster = !!movie?.thumbnail;
    const needAvatar = !!avatarSrc;
    const totalToLoad = 1 + (needPoster ? 1 : 0) + (needAvatar ? 1 : 0);

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        drawCanvas(
          bgImg,
          needPoster ? posterImg : undefined,
          needAvatar ? avatarImg : undefined,
        );
      }
    };

    // Carrega imagem de fundo cinemática
    const bgImg = new Image();
    bgImg.onload = handleLoad;
    bgImg.onerror = handleLoad;
    bgImg.src = "/images/films_background.jpg";

    const posterImg = new Image();
    posterImg.crossOrigin = "anonymous";
    posterImg.onload = handleLoad;
    posterImg.onerror = () => {
      console.warn(
        "Failed to load TMDB poster, drawing canvas with fallback poster",
      );
      loadedCount++;
      if (loadedCount === totalToLoad) {
        drawCanvas(bgImg, undefined, needAvatar ? avatarImg : undefined);
      }
    };

    if (movie?.thumbnail) {
      const separator = movie.thumbnail.includes("?") ? "&" : "?";
      posterImg.src = `${movie.thumbnail}${separator}aegis-cors=${Date.now()}`;
    }

    const avatarImg = new Image();
    avatarImg.onload = handleLoad;
    avatarImg.onerror = () => {
      console.warn(
        "Failed to load user avatar, drawing canvas with default avatar",
      );
      loadedCount++;
      if (loadedCount === totalToLoad) {
        drawCanvas(bgImg, needPoster ? posterImg : undefined, undefined);
      }
    };

    if (avatarSrc) {
      avatarImg.src = avatarSrc;
    }
  }, [isOpen, movie, avatarSrc, drawCanvas]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !movie) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0),
      );

      const fileSafeTitle = (movie?.title || "filme")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const path = await save({
        filters: [{ name: "Imagens", extensions: ["png"] }],
        defaultPath: `aegis-filme-${fileSafeTitle}.png`,
      });

      if (path) {
        await writeFile(path, binaryData);
        toast.success("Canva de filme salvo com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao salvar canva do filme:", err);
      toast.error("Falha ao salvar a imagem.");
    }
  };

  if (!movie) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Film className={cn("w-4 h-4", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Canva de Compartilhamento
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerar Story do filme assistido
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-background/20 flex flex-col md:flex-row gap-6 items-center md:items-stretch justify-center custom-scrollbar">
        {/* Preview Panel */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div className="relative aspect-9/16 w-full max-w-[285px] rounded-2xl border border-border/60 overflow-hidden bg-black">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{ imageRendering: "crisp-edges" }}
            />
            {isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Film className="w-8 h-8 text-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-muted-foreground">
                    Desenhando canva...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Tips Panel */}
        <div className="w-full md:w-[280px] shrink-0 flex flex-col justify-between py-2 border-t md:border-t-0 md:border-l border-border/40 p-0 md:pl-6 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Dicas de Compartilhamento
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O canva foi estruturado nas dimensões 1080x1920 (proporção 9:16),
              sendo ideal para publicação instantânea no Stories do Instagram,
              WhatsApp ou TikTok.
            </p>
            <div className="p-3.5 rounded-xl border border-border/40 bg-card/40 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-rose-500">
                Elementos Incluídos
              </span>
              <ul className="text-[11px] text-muted-foreground space-y-1 font-medium list-disc pl-3">
                <li>Papel de parede cinematic Aegis</li>
                <li>Capa da obra com frame e drop shadow</li>
                <li>Título, direção, ano e categoria</li>
                <li>Avaliação por estrelas douradas</li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            disabled={isDrawing}
            onClick={handleDownload}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              theme.solid,
              theme.solidHover,
            )}
          >
            <Download className="w-4 h-4" />
            Baixar Canva (.png)
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
