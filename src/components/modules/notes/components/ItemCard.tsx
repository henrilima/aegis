"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Edit2,
  FileText,
  Folder,
  MoreVertical,
  Palette,
  Pin,
  Trash2,
} from "lucide-react";
import { resolveColor, resolveTaskStyles } from "@/colors.config";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FileSystemItem } from "../types";
import { ColorPicker } from "./ColorPicker";

export type ViewMode = "grid" | "list";

// Remove marcações de markdown para preview
function stripMarkdown(text: string) {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`{1,3}([^`\n]+)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

interface ItemCardProps {
  item: FileSystemItem;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onColorChange?: (color: string) => void;
  searchQuery?: string;
  viewMode?: ViewMode;
}

export function ItemCard({
  item,
  onNavigate,
  onEdit,
  onDelete,
  onRename,
  onTogglePin,
  onColorChange,
  searchQuery,
  viewMode = "grid",
}: ItemCardProps) {
  const moduleColor = getModuleColor("notes");
  const theme = getColorTheme(moduleColor);
  const isFolder = item.isDir;
  const isPinned = !isFolder && item.note?.pinned;

  // Resolve a cor: pasta usa item.color, nota usa item.note.color
  const rawColor = isFolder ? item.color : item.note?.color;
  const colorHex = rawColor ? resolveColor(rawColor) : null;
  const _noteStyles =
    !isFolder && item.note ? resolveTaskStyles(item.note.color) : null;

  const noteTitle =
    !isFolder && item.note ? item.name?.trim() || "Sem título" : item.name;

  const isDefaultTitle = !isFolder && item.note && !item.name?.trim();

  const preview =
    !isFolder && item.note
      ? stripMarkdown(item.note.content)?.trim() || "Sem conteúdo"
      : null;

  const isDefaultContent =
    !isFolder && item.note && !stripMarkdown(item.note.content)?.trim();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.path });
  const {
    role: _draggableRole,
    tabIndex: _draggableTabIndex,
    ...draggableAttributes
  } = attributes;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item.path,
    disabled: !isFolder,
  });

  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  // Picker de cor (inline, dentro dos menus)
  const colorPickerNode = onColorChange ? (
    <ColorPicker inline value={rawColor ?? ""} onChange={onColorChange} />
  ) : null;

  // Items comuns de menu — compartilhados entre dropdown e context
  const commonMenuItems = (variant: "dropdown" | "context") => {
    const Item = variant === "dropdown" ? DropdownMenuItem : ContextMenuItem;
    const Sub = variant === "dropdown" ? DropdownMenuSub : ContextMenuSub;
    const SubTrigger =
      variant === "dropdown" ? DropdownMenuSubTrigger : ContextMenuSubTrigger;
    const SubContent =
      variant === "dropdown" ? DropdownMenuSubContent : ContextMenuSubContent;

    return (
      <>
        <Item
          className="hover:bg-accent/50 cursor-pointer rounded-lg m-1"
          onClick={isFolder ? onNavigate : onEdit}
        >
          {isFolder ? (
            <Folder className="w-4 h-4 mr-2" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isFolder ? "Abrir pasta" : "Editar nota"}
        </Item>

        <Item
          className="hover:bg-accent/50 cursor-pointer rounded-lg m-1"
          onClick={onRename}
        >
          <Edit2 className="w-4 h-4 mr-2" /> Renomear
        </Item>

        {!isFolder && (
          <Item
            className={cn(
              "hover:bg-accent/50 cursor-pointer rounded-lg m-1",
              isPinned && theme.text,
            )}
            onClick={onTogglePin}
          >
            <Pin
              className="w-4 h-4 mr-2"
              fill={isPinned ? "currentColor" : "none"}
            />
            {isPinned ? "Desfixar" : "Fixar nota"}
          </Item>
        )}

        {onColorChange && (
          <Sub>
            <SubTrigger className="hover:bg-accent/50 cursor-pointer rounded-lg m-1">
              <Palette className="w-4 h-4 mr-2" /> Cor
              {colorHex && (
                <span
                  className="ml-auto w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
              )}
            </SubTrigger>
            <SubContent className="bg-card border-border text-foreground rounded-xl p-0">
              {colorPickerNode}
            </SubContent>
          </Sub>
        )}

        <div className="h-px bg-neutral-800 my-1 mx-2" />
        <Item
          className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg m-1"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Excluir
        </Item>
      </>
    );
  };

  // ===========================
  // MODO LISTA
  // ===========================
  if (viewMode === "list") {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            ref={(node) => {
              setNodeRef(node);
              setDropRef(node);
            }}
            style={{
              ...dragStyle,
              ...(colorHex ? { backgroundColor: `${colorHex}12` } : {}),
            }}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent transition-all select-none cursor-pointer hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring w-full text-left",
              isOver && cn(theme.bg, theme.border.replace("/20", "/40")),
              isDragging && "opacity-30 scale-[0.98] grayscale",
            )}
            onClick={onNavigate}
            {...listeners}
            {...attributes}
          >
            {/* Ícone — apenas colorido sem background */}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 shrink-0 transition-colors",
                isFolder ? theme.text : "text-muted-foreground",
                isOver && "scale-110",
              )}
              style={colorHex ? { color: colorHex } : {}}
            >
              {isFolder ? (
                <Folder
                  className="w-5 h-5"
                  fill="currentColor"
                  fillOpacity={0.2}
                />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>

            {/* Nome + preview */}
            <div className="flex-1 min-w-0 pointer-events-none">
              <p
                className={cn(
                  "font-semibold text-sm truncate leading-tight",
                  isDefaultTitle
                    ? "text-muted-foreground/50 italic font-medium"
                    : "text-foreground",
                )}
                style={colorHex && !isDefaultTitle ? { color: colorHex } : {}}
              >
                {noteTitle}
              </p>
              {preview && (
                <p
                  className={cn(
                    "text-[10px] truncate leading-tight mt-0.5",
                    isDefaultContent
                      ? "text-muted-foreground/30 italic"
                      : "text-muted-foreground",
                  )}
                >
                  {preview}
                </p>
              )}
            </div>

            {/* Pin */}
            {isPinned && (
              <div
                className={cn(
                  "p-1 rounded-md shrink-0 pointer-events-none",
                  !colorHex && theme.solid,
                )}
                style={colorHex ? { backgroundColor: colorHex } : {}}
              >
                <Pin className="w-2.5 h-2.5 text-white" fill="currentColor" />
              </div>
            )}

            {/* Ações */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
                  {commonMenuItems("dropdown")}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-card border-border text-foreground min-w-[170px] rounded-xl">
          {commonMenuItems("context")}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {/* biome-ignore lint/a11y/useSemanticElements: nested interactive drop-down button trigger requires using a div container */}
        <div
          role="button"
          tabIndex={0}
          ref={(node) => {
            setNodeRef(node);
            setDropRef(node);
          }}
          style={dragStyle}
          className={cn(
            "group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring",
            colorHex
              ? "border-transparent hover:border-border/40"
              : "border-border/30 hover:border-border/60",
            isOver &&
              cn(
                theme.border.replace("/20", "/50"),
                "ring-2",
                theme.border.replace("/20", "/20"),
              ),
            isDragging && "opacity-30 scale-95 grayscale",
          )}
          onClick={onNavigate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onNavigate();
            }
          }}
          {...listeners}
          {...draggableAttributes}
        >
          {/*  Área de cabeçalho  */}
          <div
            className={cn(
              "relative flex items-center justify-center h-[72px] transition-all duration-200 group-hover:brightness-105",
              // Fundo padrão (sem cor definida)
              !colorHex && isFolder && cn(theme.bg, "opacity-70"),
              !colorHex && !isFolder && "bg-muted/30",
            )}
            style={colorHex ? { backgroundColor: `${colorHex}22` } : {}}
          >
            {/* Pin badge */}
            {isPinned && (
              <div
                className={cn(
                  "absolute top-2 left-2 p-1 rounded-lg",
                  !colorHex && theme.solid,
                )}
                style={colorHex ? { backgroundColor: colorHex } : {}}
              >
                <Pin className="w-2.5 h-2.5 text-white" fill="currentColor" />
              </div>
            )}

            {/* Ícone central — sem background, apenas colorido */}
            <div
              className={cn(
                "flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                isFolder
                  ? theme.text
                  : "text-muted-foreground group-hover:text-foreground",
              )}
              style={colorHex ? { color: colorHex } : {}}
            >
              {isFolder ? (
                <Folder
                  className="w-10 h-10"
                  fill="currentColor"
                  fillOpacity={0.25}
                />
              ) : (
                <FileText className="w-10 h-10" />
              )}
            </div>

            {/* Botão de ações (3 pontos) — para o clique não propagar para onNavigate */}
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-y-[-2px] group-hover:translate-y-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      colorHex
                        ? "bg-black/20 hover:bg-black/40 text-white/80 hover:text-white"
                        : "bg-background/60 hover:bg-background/90 text-muted-foreground hover:text-foreground",
                    )}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border text-foreground min-w-[170px] rounded-xl">
                  {commonMenuItems("dropdown")}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/*  Área de conteúdo  */}
          <div
            className="flex flex-col gap-1 px-3 py-2.5 bg-card/80 pointer-events-none"
            style={
              colorHex
                ? { borderTop: `1px solid ${colorHex}20` }
                : { borderTop: "1px solid hsl(var(--border) / 0.2)" }
            }
          >
            {/* Título */}
            <p
              className={cn(
                "font-semibold text-sm truncate leading-snug",
                isDefaultTitle
                  ? "text-muted-foreground/50 italic font-medium"
                  : "text-foreground",
              )}
              style={colorHex && !isDefaultTitle ? { color: colorHex } : {}}
            >
              {noteTitle}
            </p>

            {/* Preview de conteúdo */}
            {preview && (
              <p
                className={cn(
                  "text-[10px] line-clamp-2 leading-relaxed",
                  isDefaultContent
                    ? "text-muted-foreground/30 italic"
                    : "text-muted-foreground/80",
                )}
              >
                {preview}
              </p>
            )}

            {/* Preview de busca */}
            {searchQuery && !isFolder && item.note?.content && !preview && (
              <p className="text-[10px] text-muted-foreground line-clamp-2 w-full leading-tight">
                {item.note.content}
              </p>
            )}

            {/* Rodapé: data */}
            {!isFolder && item.note?.createdAt && (
              <p className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                {new Date(item.note.createdAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-card border-border text-foreground min-w-[170px] rounded-xl">
        {commonMenuItems("context")}
      </ContextMenuContent>
    </ContextMenu>
  );
}
