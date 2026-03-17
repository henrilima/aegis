"use client";

import type { LucideIcon } from "lucide-react";
import type React from "react";
import { Card } from "@/components/ui/card";
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
}

export function BaseWidget({
  title,
  icon: Icon,
  iconColor,
  route,
  children,
  className,
  isEditMode = false,
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
        "group flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden relative @container",
        !isEditMode &&
          "transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800/60 cursor-pointer",
        isEditMode &&
          "cursor-move border-emerald-500 bg-neutral-900 ring-1 ring-emerald-500/20",
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 group-hover:border-neutral-600 transition-colors",
              isEditMode && "border-emerald-500/30",
            )}
          >
            <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm font-bold text-neutral-300 truncate">
            {title}
          </h3>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 w-full p-4 pt-2 overflow-auto custom-scrollbar min-h-0",
          isEditMode && "pointer-events-none select-none", // Desativa interações internas no modo de edição
        )}
      >
        <div className="h-full w-full flex flex-col">{children}</div>
      </div>
    </Card>
  );
}
