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
}

export function DroppableBreadcrumb({
  id,
  children,
  onClick,
  isCurrent,
}: DroppableBreadcrumbProps) {
  const theme = getColorTheme(getModuleColor("notes"));
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <BreadcrumbItem ref={setNodeRef}>
      <BreadcrumbLink
        className={cn(
          "cursor-pointer transition-all px-2 py-0.5 rounded-md",
          theme.textDarkHover,
          isCurrent ? cn(theme.text, "font-semibold") : "text-muted-foreground",
          isOver && cn(theme.bg, theme.text),
        )}
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
