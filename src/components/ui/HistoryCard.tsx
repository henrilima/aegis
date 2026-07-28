"use client";

import { type HTMLMotionProps, motion } from "framer-motion";
import { HEX_COLORS, resolveColorFromTag } from "@/config/colors.config";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    },
  },
};

export interface HistoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cor direta do tema (ex: "violet", "blue") ou ID do módulo (ex: "studies", "sleep") */
  color?: string;
  /** Lista ou string de tags para resolver cores dinamicamente caso a cor não seja passada diretamente */
  tags?: string | string[];
  /** Flag para desabilitar a animação framer-motion se necessário (padrão: true) */
  animate?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente global de cartão de histórico.
 * Suporta detecção dinâmica de tema de cor via prop `color` ou através de tags (ex: "verde", "rosa", "sky").
 * Aplica automaticamente a cor do módulo correspondente e borda de hover em 50% de opacidade.
 */
export function HistoryCard({
  color,
  tags,
  animate = true,
  children,
  className,
  ...props
}: HistoryCardProps) {
  const tagColor = resolveColorFromTag(tags);

  let resolvedColorName: string | null = null;
  if (color) {
    if (color in HEX_COLORS) {
      resolvedColorName = color;
    } else {
      resolvedColorName = getModuleColor(color);
    }
  }

  const effectiveColorName = tagColor || resolvedColorName || "blue";
  const theme = getColorTheme(effectiveColorName);

  const containerClasses = cn(
    "group bg-card/60 border border-border/50 rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-card",
    theme.borderHover,
    className,
  );

  if (animate) {
    return (
      <motion.div
        variants={itemVariants}
        className={containerClasses}
        {...(props as HTMLMotionProps<"div">)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
}
