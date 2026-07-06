"use client";

import { useDroppable } from "@dnd-kit/core";
import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface DroppableBreadcrumbProps {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
  isCurrent: boolean;
  /** Cor hex da pasta (opcional) para colorir o texto do breadcrumb */
  color?: string | null;
}

export function DroppableBreadcrumb({
  id,
  children,
  onClick,
  isCurrent,
  color,
}: DroppableBreadcrumbProps) {
  const theme = getColorTheme(getModuleColor("notes"));
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <BreadcrumbItem ref={setNodeRef}>
      <BreadcrumbLink
        className={cn(
          "cursor-pointer transition-all px-2 py-0.5 rounded-md",
          !color && theme.textDarkHover,
          isCurrent && !color && cn(theme.text, "font-semibold"),
          isCurrent && color && "font-semibold",
          !isCurrent && !color && "text-muted-foreground",
          isOver && cn(theme.bg, theme.text),
        )}
        style={color && !isOver ? { color } : {}}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        {children}
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
}
