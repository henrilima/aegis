"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight, GripVertical, Settings, Zap } from "lucide-react";
import type React from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { cn, getColorTheme, type ThemeColorKey } from "@/lib/utils";

interface BaseWidgetProps {
  title: string;
  icon: LucideIcon;
  color?: ThemeColorKey;
  route?: AppRoute;
  searchParams?: string;
  children: React.ReactNode;
  className?: string;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function BaseWidget({
  title,
  icon: Icon,
  color = "blue",
  route,
  searchParams,
  children,
  className,
  isEditMode = false,
  isInteractive = false,
  onToggleInteractive,
}: BaseWidgetProps) {
  const { navigate } = useNavigation();
  const theme = getColorTheme(color);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (route) navigate(route, searchParams);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Navegação global do widget tratada via clique
    // biome-ignore lint/a11y/noStaticElementInteractions: Widget inteiro é clicável por design, mas sem cursor pointer
    <div
      className={cn(
        "group relative flex flex-col bg-card border border-border/70 rounded-2xl overflow-hidden transition-all duration-300 hover:border-border @container h-full outline-none cursor-default",
        isEditMode && "border-emerald-500 ring-1 ring-emerald-500/20",
        className,
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="p-[4cqw] @sm:p-4 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-[3cqw] @sm:gap-3.5">
          <div
            className={cn(
              "p-[2cqw] @sm:p-2 rounded-lg border transition-colors",
              theme.bg,
              theme.border,
            )}
          >
            <Icon
              className={cn(
                "w-[4.5cqw] h-[4.5cqw] @sm:w-5 @sm:h-5",
                theme.text,
              )}
            />
          </div>
          <div>
            <h3 className="text-[3.5cqw] @sm:text-sm font-bold text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-[2.5cqw] @sm:text-[10px] text-muted-foreground font-medium mt-0.5">
              Módulo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleInteractive && !isEditMode && (
            <ToolTip
              content={
                isInteractive
                  ? "Desativar modo interativo"
                  : "Ativar modo interativo"
              }
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleInteractive();
                }}
                className={cn(
                  "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer relative z-30",
                  isInteractive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {isInteractive ? (
                  <Zap className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Settings className="w-3.5 h-3.5" />
                )}
              </button>
            </ToolTip>
          )}
          {isEditMode ? (
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 cursor-move relative z-30">
              <GripVertical className="w-4 h-4" />
            </div>
          ) : (
            <ChevronRight className="w-[3.5cqw] h-[3.5cqw] @sm:w-4 @sm:h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-pointer" />
          )}
        </div>
      </div>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click propagation interception does not require keyboard actions */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Click propagation interception does not require a widget role */}
      <div
        className={cn(
          "flex-1 w-full p-[4cqw] @sm:p-4 pt-0 @sm:pt-0 overflow-auto custom-scrollbar min-h-0 relative z-20",
          isEditMode && "pointer-events-none select-none",
        )}
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
          }
        }}
      >
        <div className="h-full w-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}
