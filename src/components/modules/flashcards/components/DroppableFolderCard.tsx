"use client";

import { useDroppable } from "@dnd-kit/core";
import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { getSystemIcon } from "@/components/global/IconSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FlashcardFolder } from "../types";

const getGroupHoverTextClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "group-hover:text-blue-400",
    sky: "group-hover:text-sky-400",
    cyan: "group-hover:text-cyan-400",
    indigo: "group-hover:text-indigo-400",
    violet: "group-hover:text-violet-400",
    purple: "group-hover:text-purple-400",
    fuchsia: "group-hover:text-fuchsia-400",
    pink: "group-hover:text-pink-400",
    rose: "group-hover:text-rose-400",
    red: "group-hover:text-red-400",
    orange: "group-hover:text-orange-400",
    amber: "group-hover:text-amber-400",
    yellow: "group-hover:text-yellow-400",
    lime: "group-hover:text-lime-400",
    green: "group-hover:text-green-400",
    emerald: "group-hover:text-emerald-400",
    teal: "group-hover:text-teal-400",
    slate: "group-hover:text-slate-400",
    zinc: "group-hover:text-zinc-400",
    neutral: "group-hover:text-neutral-400",
    stone: "group-hover:text-stone-400",
    coffee: "group-hover:text-amber-800",
    carbon: "group-hover:text-zinc-400",
  };
  return map[color] || "group-hover:text-blue-400";
};

interface DroppableFolderCardProps {
  folder: FlashcardFolder;
  deckCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DroppableFolderCard({
  folder,
  deckCount,
  onOpen,
  onEdit,
  onDelete,
}: DroppableFolderCardProps) {
  const folderId = folder.id ?? 0;
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folderId}`,
    data: { folderId },
  });

  const FolderIcon = getSystemIcon(folder.icon || "folder");
  const moduleColor = folder.color || getModuleColor("flashcards");
  const mFolder = getColorTheme(moduleColor);

  return (
    // biome-ignore lint/a11y/useSemanticElements: nested interactive drop-down button trigger requires using a div container
    <div
      ref={setNodeRef}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "relative rounded-xl border bg-card/80 hover:bg-card p-3.5 flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer select-none text-left w-full",
        isOver
          ? `${mFolder.border} ${mFolder.bg} ring-2 ring-blue-500/30 scale-[1.02]`
          : `border-border ${mFolder.borderHover}`,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "p-2 rounded-lg border shrink-0 transition-colors",
            isOver
              ? `${mFolder.bg} ${mFolder.text} ${mFolder.border}`
              : `${mFolder.bg} ${mFolder.text}`,
          )}
        >
          <FolderIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              "font-semibold text-sm text-foreground transition-colors truncate",
              getGroupHoverTextClass(moduleColor),
            )}
          >
            {folder.name}
          </h4>
          <span className="text-[11px] text-muted-foreground font-medium">
            {deckCount} {deckCount === 1 ? "baralho" : "baralhos"}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-card border border-border rounded-xl p-1.5 text-foreground z-50">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted/50"
            >
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              Editar pasta
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/40 my-1 mx-1" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer text-red-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir pasta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
