"use client";

import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Folder, Home } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface DroppableBreadcrumbCrumb {
  id: number | null;
  name: string;
}

interface DroppableBreadcrumbProps {
  breadcrumbs: DroppableBreadcrumbCrumb[];
  currentFolderId: number | null;
  onNavigate: (folderId: number | null) => void;
}

function BreadcrumbCrumbItem({
  crumb,
  isLast,
  isCurrent,
  onNavigate,
}: {
  crumb: DroppableBreadcrumbCrumb;
  isLast: boolean;
  isCurrent: boolean;
  onNavigate: (id: number | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `breadcrumb-${crumb.id ?? "root"}`,
    data: { folderId: crumb.id },
  });

  const moduleColor = getModuleColor("flashcards");
  const m = getColorTheme(moduleColor);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        ref={setNodeRef}
        onClick={() => onNavigate(crumb.id)}
        className={cn(
          "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold select-none",
          isOver
            ? `${m.bg} ${m.text} ${m.border} font-bold scale-105 shadow-sm`
            : isCurrent
              ? `${m.bg} ${m.text} font-bold`
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        )}
      >
        {crumb.id === null ? (
          <Home className={cn("w-3.5 h-3.5", m.text)} />
        ) : (
          <Folder className={cn("w-3.5 h-3.5", m.text)} />
        )}
        <span>{crumb.name}</span>
      </button>

      {!isLast && (
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      )}
    </div>
  );
}

export function DroppableBreadcrumb({
  breadcrumbs,
  currentFolderId,
  onNavigate,
}: DroppableBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap text-xs font-semibold py-1 border-b border-border/40 pb-3">
      {breadcrumbs.map((crumb, idx) => (
        <BreadcrumbCrumbItem
          key={crumb.id ?? "root"}
          crumb={crumb}
          isLast={idx === breadcrumbs.length - 1}
          isCurrent={currentFolderId === crumb.id}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
