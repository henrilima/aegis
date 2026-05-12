"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Edit2,
  FileText,
  Folder,
  MoreVertical,
  Pin,
  Trash2,
} from "lucide-react";
import { resolveTaskStyles } from "@/colors.config";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FileSystemItem } from "../types";

interface ItemCardProps {
  item: FileSystemItem;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  searchQuery?: string;
}

export function ItemCard({
  item,
  onNavigate,
  onEdit,
  onDelete,
  onRename,
  onTogglePin,
  searchQuery,
}: ItemCardProps) {
  const moduleColor = getModuleColor("notes");
  const theme = getColorTheme(moduleColor);
  const isFolder = item.isDir;
  const isPinned = !isFolder && item.note?.pinned;

  const noteStyles =
    !isFolder && item.note ? resolveTaskStyles(item.note.color) : null;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.path });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item.path,
    disabled: !isFolder,
  });
  const style = transform
    ? ({
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        borderColor: isOver ? undefined : noteStyles?.borderColor,
        backgroundColor: isOver
          ? undefined
          : noteStyles
            ? `${noteStyles.baseColor}05`
            : undefined,
      } as React.CSSProperties)
    : ({
        borderColor: isOver ? undefined : noteStyles?.borderColor,
        backgroundColor: isOver
          ? undefined
          : noteStyles
            ? `${noteStyles.baseColor}05`
            : undefined,
      } as React.CSSProperties);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={(node) => {
            setNodeRef(node);
            setDropRef(node);
          }}
          style={style}
          className={cn(
            "group relative flex flex-col items-center p-4 gap-2 transition-all rounded-2xl border border-transparent select-none hover:bg-muted/50",
            isOver &&
              cn(
                theme.bg,
                theme.border.replace("/20", "/40"),
                "ring-1",
                theme.border.replace("/20", "/30"),
              ),
            isDragging && "opacity-30 scale-95 grayscale",
            noteStyles && "hover:border-border/40",
          )}
          {...listeners}
          {...attributes}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 w-full h-full cursor-pointer rounded-2xl border-none bg-transparent"
            onClick={onNavigate}
            aria-label={`Abrir ${item.name}`}
          />
          <div className="relative z-10 w-full flex flex-col items-center gap-2 pointer-events-none">
            {isPinned && (
              <div
                className={cn(
                  "absolute top-[-8px] left-[-8px] p-1 rounded-lg z-10 scale-90 shadow-sm",
                  noteStyles ? "" : theme.solid,
                )}
                style={
                  noteStyles ? { backgroundColor: noteStyles.iconColor } : {}
                }
              >
                <Pin className="w-2.5 h-2.5 text-white" fill="currentColor" />
              </div>
            )}
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 bg-muted/50 rounded-xl transition-all duration-300 group-hover:scale-105",
                isFolder
                  ? cn(
                      theme.text,
                      theme.textDarkHover.replace("hover:", "group-hover:"),
                    )
                  : "text-muted-foreground group-hover:text-foreground",
                isOver && "scale-110",
              )}
              style={
                noteStyles
                  ? {
                      backgroundColor: noteStyles.badgeBg,
                      color: noteStyles.iconColor,
                    }
                  : {}
              }
            >
              {isFolder ? (
                <Folder
                  className="w-10 h-10"
                  fill="currentColor"
                  fillOpacity={0.1}
                />
              ) : (
                <FileText className="w-10 h-10" />
              )}
            </div>
            <div
              className={cn(
                "text-center min-w-0 font-semibold text-foreground truncate transition-colors text-sm w-full",
                !noteStyles &&
                  theme.textDarkHover.replace("hover:", "group-hover:"),
              )}
              style={noteStyles ? { color: noteStyles.iconColor } : {}}
            >
              {item.name}
            </div>
            {searchQuery && !isFolder && item.note?.content && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 w-full text-center px-1 leading-tight h-5">
                {item.note.content}
              </p>
            )}
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border text-foreground min-w-[170px] rounded-xl">
                <DropdownMenuItem
                  className="hover:bg-accent/50 cursor-pointer rounded-lg m-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    isFolder ? onNavigate() : onEdit();
                  }}
                >
                  {isFolder ? (
                    <Folder className="w-4 h-4 mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  {isFolder ? "Abrir pasta" : "Editar nota"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="hover:bg-accent/50 cursor-pointer rounded-lg m-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename();
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Renomear
                </DropdownMenuItem>
                {!isFolder && (
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-accent/50 cursor-pointer rounded-lg m-1",
                      isPinned && theme.text,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin();
                    }}
                  >
                    <Pin
                      className="w-4 h-4 mr-2"
                      fill={isPinned ? "currentColor" : "none"}
                    />{" "}
                    {isPinned ? "Desfixar" : "Fixar nota"}
                  </DropdownMenuItem>
                )}
                <div className="h-px bg-neutral-800 my-1 mx-2" />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg m-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-card border-border text-foreground min-w-[170px] rounded-xl">
        <ContextMenuItem
          className="hover:bg-accent/50 rounded-lg m-1"
          onClick={isFolder ? onNavigate : onEdit}
        >
          {isFolder ? (
            <Folder className="w-4 h-4 mr-2" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isFolder ? "Abrir pasta" : "Editar nota"}
        </ContextMenuItem>

        <ContextMenuItem
          className="hover:bg-accent/50 rounded-lg m-1"
          onClick={onRename}
        >
          <Edit2 className="w-4 h-4 mr-2" /> Renomear
        </ContextMenuItem>
        {!isFolder && (
          <ContextMenuItem
            className="hover:bg-accent/50 rounded-lg m-1"
            onClick={onTogglePin}
          >
            <Pin className="w-4 h-4 mr-2" />{" "}
            {isPinned ? "Desfixar" : "Fixar nota"}
          </ContextMenuItem>
        )}
        <div className="h-px bg-neutral-800 my-1 mx-2" />
        <ContextMenuItem
          className="text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg m-1"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
