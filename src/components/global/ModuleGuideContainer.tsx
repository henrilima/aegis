"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ModuleColorProvider } from "@/components/global/ModuleInfoParts";
import type { ThemeColorKey } from "@/lib/utils";
import { cn, getColorTheme } from "@/lib/utils";

interface ModuleGuideContainerProps {
  color: ThemeColorKey;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
}

export function ModuleGuideContainer({
  color,
  icon: Icon,
  title,
  subtitle,
  children,
  onBack,
}: ModuleGuideContainerProps) {
  const theme = getColorTheme(color);

  return (
    <ModuleColorProvider color={color}>
      <div className="w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all cursor-pointer mr-1 flex items-center justify-center shadow-none"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {!onBack && (
            <div
              className={cn("p-2.5 rounded-xl border", theme.bg, theme.border)}
            >
              {Icon ? (
                <Icon className={cn("w-5 h-5", theme.text)} />
              ) : (
                <div className={cn("w-5 h-5 rounded-full", theme.solid)} />
              )}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-foreground leading-none">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </ModuleColorProvider>
  );
}
