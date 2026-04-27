"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowLeft,
  Edit2,
  FileText,
  Folder,
  MoreVertical,
  Pin,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { FileSystemItem, Note } from "../types";

interface FileManagerProps {
  onNoteClick: (note: Note) => void;
  onNewNote?: (path: string) => void;
  refreshTrigger: number;
  searchQuery: string;
  externalFolderTrigger?: boolean;
  onFolderModalClose?: () => void;
}

export function FileManager({
  onNoteClick,
  refreshTrigger,
  searchQuery,
  externalFolderTrigger,
  onFolderModalClose,
}: FileManagerProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("");
  const [activeItem, setActiveItem] = useState<FileSystemItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<FileSystemItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmTarget, setDeleteConfirmTarget] =
    useState<FileSystemItem | null>(null);

  const uid = user ? String(user.id) : "";

  useEffect(() => {
    if (externalFolderTrigger) setIsNewFolderOpen(true);
  }, [externalFolderTrigger]);

  const fetchItems = useCallback(async () => {
    if (!uid) return;
    const _ = refreshTrigger;
    try {
      const res = await invoke<FileSystemItem[]>("list_note_items", {
        userId: uid,
      });
      setItems(res);
    } catch {
      toast.error("Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [uid, refreshTrigger]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const currentItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const contentMatch =
          !item.is_dir && (item.note?.content || "").toLowerCase().includes(q);
        return nameMatch || contentMatch;
      }
      const itemParent = item.path.split(/[\\/]/).slice(0, -1).join("/");
      const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/$/, "");
      return norm(currentPath) === norm(itemParent);
    });
    return filtered.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, currentPath, searchQuery]);

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split(/[\\/]/).filter(Boolean);
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [currentPath]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const path = currentPath
        ? `${currentPath}/${newFolderName.trim()}`
        : newFolderName.trim();
      await invoke("create_note_folder", { path });
      setNewFolderName("");
      setIsNewFolderOpen(false);
      onFolderModalClose?.();
      fetchItems();
      toast.success("Pasta criada");
    } catch {
      toast.error("Erro ao criar pasta");
    }
  };

  const handleDelete = (item: FileSystemItem) => {
    setDeleteConfirmTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      if (deleteConfirmTarget.is_dir) {
        await invoke("delete_note_folder", { path: deleteConfirmTarget.path });
      } else {
        await invoke("delete_note", { id: deleteConfirmTarget.note?.id });
      }
      setDeleteConfirmTarget(null);
      fetchItems();
      toast.success("Excluído com sucesso");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const parent = renameTarget.path.split(/[\\/]/).slice(0, -1).join("/");
      const newPath = parent
        ? `${parent}/${renameValue.trim()}`
        : renameValue.trim();
      await invoke("move_note_item", {
        sourcePath: renameTarget.path,
        destPath: newPath,
      });
      setRenameTarget(null);
      fetchItems();
      toast.success("Renomeado com sucesso");
    } catch {
      toast.error("Erro ao renomear");
    }
  };

  const handleMove = async (sourcePath: string, destPath: string) => {
    if (sourcePath === destPath) return;
    try {
      await invoke("move_note_item", { sourcePath, destPath });
      fetchItems();
      toast.success("Item movido");
    } catch {
      toast.error("Erro ao mover item");
    }
  };

  const handleTogglePin = async (item: FileSystemItem) => {
    if (item.is_dir || !item.note) return;
    try {
      await invoke("update_note_pinned", {
        id: item.note.id,
        pinned: !item.note.pinned,
      });
      fetchItems();
      toast.success(item.note.pinned ? "Nota desfixada" : "Nota fixada");
    } catch {
      toast.error("Erro ao alterar fixação");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i.path === event.active.id);
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (over && active.id !== over.id) {
      const sourcePath = active.id as string;
      const targetId = over.id as string;
      if (targetId === "root") handleMove(sourcePath, "");
      else if (targetId.startsWith("bc:"))
        handleMove(sourcePath, targetId.replace("bc:", ""));
      else handleMove(sourcePath, targetId);
    }
  };

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center animate-pulse text-muted-foreground">
        <Folder className="w-5 h-5 mr-2" /> Carregando...
      </div>
    );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {currentPath && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const parts = currentPath.split(/[\\/]/).filter(Boolean);
                parts.pop();
                setCurrentPath(parts.join("/"));
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Breadcrumb>
            <BreadcrumbList>
              <DroppableBreadcrumb
                id="root"
                onClick={() => setCurrentPath("")}
                isCurrent={!currentPath}
              >
                Início
              </DroppableBreadcrumb>
              {breadcrumbs.map((bc, i) => (
                <div key={bc.path} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <DroppableBreadcrumb
                    id={`bc:${bc.path}`}
                    onClick={() => setCurrentPath(bc.path)}
                    isCurrent={i === breadcrumbs.length - 1}
                  >
                    {bc.name}
                  </DroppableBreadcrumb>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="rounded-2xl border border-border bg-card/10 p-4">
          {currentItems.length === 0 ? (
            <EmptyState
              icon={searchQuery ? FileText : Folder}
              title={
                searchQuery ? "Nenhum resultado encontrado" : "Pasta vazia"
              }
              description={
                searchQuery
                  ? `Nenhum item corresponde a "${searchQuery}".`
                  : "Crie sua primeira nota ou pasta aqui para começar a organizar."
              }
              className="py-16"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentItems.map((item) => (
                <ItemCard
                  key={item.path}
                  item={item}
                  onNavigate={() =>
                    item.is_dir
                      ? setCurrentPath(item.path)
                      : item.note && onNoteClick(item.note)
                  }
                  onDelete={() => handleDelete(item)}
                  onRename={() => {
                    setRenameTarget(item);
                    setRenameValue(item.name);
                  }}
                  onTogglePin={() => handleTogglePin(item)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>

        <DragOverlay adjustScale={true}>
          {activeItem ? (
            <div className="p-4 bg-neutral-800 border border-orange-500/50 rounded-2xl opacity-80 cursor-grabbing flex flex-col items-center gap-2 scale-90">
              {activeItem.is_dir ? (
                <Folder
                  className="w-10 h-10 text-orange-600 dark:text-orange-400"
                  fill="currentColor"
                  fillOpacity={0.1}
                />
              ) : (
                <FileText className="w-10 h-10 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold truncate max-w-[100px]">
                {activeItem.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>

        <Dialog
          open={isNewFolderOpen}
          onOpenChange={(open) => {
            setIsNewFolderOpen(open);
            if (!open) onFolderModalClose?.();
          }}
        >
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Nova Pasta</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-neutral-800 border-border focus:border-orange-500"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-black"
                onClick={handleCreateFolder}
              >
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
        >
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>
                Renomear {renameTarget?.is_dir ? "Pasta" : "Nota"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Novo nome"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="bg-neutral-800 border-border focus:border-orange-500"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRenameTarget(null)}>
                Cancelar
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-black"
                onClick={handleRename}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {deleteConfirmTarget && (
          <ConfirmModal
            title={
              deleteConfirmTarget.is_dir ? "Excluir pasta?" : "Excluir nota?"
            }
            description={
              deleteConfirmTarget.is_dir
                ? "Esta ação removerá a pasta e todos os arquivos contidos nela permanentemente."
                : "Esta nota será removida permanentemente de sua biblioteca."
            }
            confirmLabel="Excluir"
            variant="danger"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirmTarget(null)}
          />
        )}
      </div>
    </DndContext>
  );
}

interface ItemCardProps {
  item: FileSystemItem;
  onNavigate: () => void;
  onDelete: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  searchQuery?: string;
}

function ItemCard({
  item,
  onNavigate,
  onDelete,
  onRename,
  onTogglePin,
  searchQuery,
}: ItemCardProps) {
  const isFolder = item.is_dir;
  const isPinned = !isFolder && item.note?.pinned;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.path });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: item.path,
    disabled: !isFolder,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

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
              "bg-orange-500/10 border-orange-500/40 ring-1 ring-orange-500/30",
            isDragging && "opacity-30 scale-95 grayscale",
          )}
          {...listeners}
          {...attributes}
        >
          {/* Main Action Button (Overlay) */}
          <button
            type="button"
            className="absolute inset-0 z-0 w-full h-full cursor-pointer rounded-2xl border-none bg-transparent"
            onClick={onNavigate}
            aria-label={`Abrir ${item.name}`}
          />
          <div className="relative z-10 w-full flex flex-col items-center gap-2 pointer-events-none">
            {isPinned && (
              <div className="absolute top-[-8px] left-[-8px] p-1 bg-orange-500 rounded-lg z-10 scale-90">
                <Pin className="w-2.5 h-2.5 text-black" fill="currentColor" />
              </div>
            )}
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 bg-muted/50 rounded-xl transition-all duration-300 group-hover:scale-105",
                isFolder
                  ? "text-orange-600 dark:text-orange-400 group-hover:text-orange-300"
                  : "text-muted-foreground group-hover:text-foreground",
                isOver && "scale-110",
              )}
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
            <div className="text-center min-w-0 font-semibold text-foreground truncate group-hover:text-orange-600 dark:text-orange-400 transition-colors text-sm w-full">
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
                    onRename();
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Renomear
                </DropdownMenuItem>
                {!isFolder && (
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-accent/50 cursor-pointer rounded-lg m-1",
                      isPinned && "text-orange-600 dark:text-orange-400",
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

interface DroppableBreadcrumbProps {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
  isCurrent: boolean;
}

function DroppableBreadcrumb({
  id,
  children,
  onClick,
  isCurrent,
}: DroppableBreadcrumbProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <BreadcrumbItem ref={setNodeRef}>
      <BreadcrumbLink
        className={cn(
          "cursor-pointer hover:text-orange-600 dark:text-orange-400 transition-all px-2 py-0.5 rounded-md",
          isCurrent ? "text-orange-500 font-semibold" : "text-muted-foreground",
          isOver && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
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
