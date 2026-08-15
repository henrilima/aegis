import type React from "react";
import { getRankForLevel } from "@/config/achievements.config";
import { RANK_BORDERS } from "@/config/ranks.config";
import { cn } from "@/lib/utils";

interface AvatarRankWrapperProps {
  level: number;
  size?: "sm" | "lg"; // 'sm' para sidebar, 'lg' para página de perfil
  badgePosition?: "bottom" | "right" | "bottom-right"; // posicionamento da insígnia
  showBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AvatarRankWrapper({
  level,
  size = "sm",
  badgePosition = "bottom",
  showBorder = true,
  className,
  children,
}: AvatarRankWrapperProps) {
  const rank = getRankForLevel(level || 1);
  const borderConfig = RANK_BORDERS[rank.name] || RANK_BORDERS.Ferro;

  if (!showBorder) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden flex items-center justify-center rounded-full",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  // Contêiner da badge
  const containerSizeClass =
    badgePosition === "right"
      ? "w-3.5 h-3.5"
      : badgePosition === "bottom-right"
        ? "w-3.5 h-3.5"
        : size === "sm"
          ? "w-4 h-4"
          : "w-6 h-6";

  // Tamanho da gema interna
  const gemSizeClass =
    badgePosition === "right"
      ? "w-2 h-2"
      : badgePosition === "bottom-right"
        ? "w-2 h-2"
        : size === "sm"
          ? "w-2.5 h-2.5"
          : "w-3.5 h-3.5";

  // Posicionamento
  const gemPositionClass =
    badgePosition === "right"
      ? "right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
      : badgePosition === "bottom-right"
        ? "-bottom-0.5 -right-0.5"
        : "-bottom-1 left-1/2 -translate-x-1/2";

  return (
    <div className={cn("relative shrink-0 inline-flex", className)}>
      {/* Contêiner da borda do rank com estilo sólido visível e preenchimento */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 border-solid rounded-full",
          size === "sm" ? "border-2 p-0.5" : "border-4 p-0.75",
          borderConfig.borderColor,
        )}
      >
        <div className="w-full h-full overflow-hidden flex items-center justify-center rounded-full">
          {children}
        </div>
      </div>

      {/* Contêiner da Badge sem borda preta, harmonizado com o tema */}
      <span
        className={cn(
          "absolute rounded-full bg-background border border-border flex items-center justify-center transition-all duration-300 z-20 group-hover/avatar:scale-0 group-hover/avatar:opacity-0",
          containerSizeClass,
          gemPositionClass,
        )}
        title={`Rank: ${rank.name}`}
      >
        {/* Detalhe de Pedra / Gem do Rank */}
        <span
          className={cn(
            "transition-all duration-300 block shrink-0",
            borderConfig.gemColor,
            gemSizeClass,
          )}
          style={{ clipPath: borderConfig.clipPath }}
        />
      </span>
    </div>
  );
}
