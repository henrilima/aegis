import type React from "react";
import { getRankForLevel } from "@/config/achievements.config";
import { RANK_BORDERS } from "@/config/ranks.config";
import { cn } from "@/lib/utils";

interface AvatarRankWrapperProps {
  level: number;
  rounded?: "full" | "xl";
  size?: "sm" | "lg"; // 'sm' para sidebar, 'lg' para página de perfil
  badgePosition?: "bottom" | "right" | "bottom-right"; // posicionamento da insígnia
  showBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AvatarRankWrapper({
  level,
  rounded = "full",
  size = "sm",
  badgePosition = "bottom",
  showBorder = true,
  className,
  children,
}: AvatarRankWrapperProps) {
  const rank = getRankForLevel(level);
  const borderConfig = RANK_BORDERS[rank.name];

  if (!borderConfig || !showBorder) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-xl";

  // Contêiner da badge
  const containerSizeClass =
    badgePosition === "right"
      ? "w-[13px] h-[13px]"
      : badgePosition === "bottom-right"
        ? "w-[13px] h-[13px]"
        : size === "sm"
          ? "w-[16px] h-[16px]"
          : "w-[24px] h-[24px]";

  // Tamanho da gema interna
  const gemSizeClass =
    badgePosition === "right"
      ? "w-[8px] h-[8px]"
      : badgePosition === "bottom-right"
        ? "w-[8px] h-[8px]"
        : size === "sm"
          ? "w-[10px] h-[10px]"
          : "w-[15px] h-[15px]";

  // Posicionamento
  const gemPositionClass =
    badgePosition === "right"
      ? "right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
      : badgePosition === "bottom-right"
        ? "bottom-1 right-1 translate-x-1/2 translate-y-1/2"
        : "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2";

  const borderThickness = size === "sm" ? "border-2" : "border-[5px]";

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        borderThickness,
        borderConfig.borderColor,
        roundedClass,
        className,
      )}
    >
      <div className={cn("w-full h-full overflow-hidden", roundedClass)}>
        {children}
      </div>

      {/* Contêiner da Badge (Círculo cinza claro) */}
      <span
        className={cn(
          "absolute rounded-full bg-[#e7e7e7] flex items-center justify-center transition-all duration-300 z-20 group-hover/avatar:scale-0 group-hover/avatar:opacity-0 shadow-[0_2px_6px_rgba(0,0,0,0.15)] border border-black/5",
          containerSizeClass,
          gemPositionClass,
        )}
        title={`Rank: ${rank.name}`}
      >
        {/* Detalhe de Pedra / Gem do Rank */}
        <span
          className={cn(
            "transition-all duration-300 block",
            borderConfig.gemColor,
            gemSizeClass,
          )}
          style={{ clipPath: borderConfig.clipPath }}
        />
      </span>
    </div>
  );
}
