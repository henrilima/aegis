"use client";

import type { LucideIcon } from "lucide-react";
import { Settings, Zap } from "lucide-react";
import type React from "react";
import { Card } from "@/components/ui/card";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { type AppRoute, useNavigation } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";

interface BaseWidgetProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  route?: AppRoute;
  children: React.ReactNode;
  className?: string;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function BaseWidget({
  title,
  icon: Icon,
  iconColor,
  route,
  children,
  className,
  isEditMode = false,
  isInteractive = false,
  onToggleInteractive,
}: BaseWidgetProps) {
  const { navigate } = useNavigation();

  const handleClick = (e: React.MouseEvent) => {
    // Impedir navegação durante o modo de edição
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (route) navigate(route);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden relative @container",
        !isEditMode &&
          "transition-all duration-200 hover:border-border hover:bg-accent/50/60 cursor-pointer",
        isEditMode &&
          "cursor-move border-emerald-500 bg-card ring-1 ring-emerald-500/20",
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-lg bg-accent border border-accent group-hover:border-border/50 transition-colors",
              isEditMode && "border-accent/30",
            )}
          >
            <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground truncate">
            {title}
          </h3>
        </div>

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
                "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
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
      </div>
      <div
        className={cn(
          "flex-1 w-full p-4 pt-2 overflow-auto custom-scrollbar min-h-0",
          isEditMode && "pointer-events-none select-none",
          isInteractive && "relative", // Pode ser útil para estilos específicos
        )}
      >
        <div className="h-full w-full flex flex-col">{children}</div>
      </div>
    </Card>
  );
}
