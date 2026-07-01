"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, FileText, Folder } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FileSystemItem, Note } from "../types";
import { DroppableBreadcrumb } from "./DroppableBreadcrumb";
import { ItemCard } from "./ItemCard";

interface FileManagerProps {
  onNoteClick: (note: Note, edit?: boolean) => void;
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
  const color = getModuleColor("notes");
  const theme = getColorTheme(color);
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
      const res = await invoke<FileSystemItem[]>("note_list_note_items", {
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
          !item.isDir && (item.note?.content || "").toLowerCase().includes(q);
        return nameMatch || contentMatch;
      }
      const itemParent = item.path.split(/[\\/]/).slice(0, -1).join("/");
      const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/$/, "");
      return norm(currentPath) === norm(itemParent);
    });
    return filtered.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
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
      await invoke("note_create_note_folder", { path });
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
      if (deleteConfirmTarget.isDir) {
        await invoke("note_delete_note_folder", {
          path: deleteConfirmTarget.path,
        });
      } else {
        await invoke("note_delete_note", {
          id: deleteConfirmTarget.note?.id,
          userId: user?.id,
        });
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
      let newName = renameValue.trim();

      // Para arquivos, preserva a extensão original e o prefixo `{id}_`
      if (!renameTarget.isDir) {
        const oldFileName = renameTarget.path.split(/[\\/]/).pop() || "";

        // Extrai o prefixo se ele corresponder ao padrão ID_ (ex: "1_")
        const prefixMatch = oldFileName.match(/^(\d+_)/);
        const prefix = prefixMatch ? prefixMatch[1] : "";

        const dotIndex = oldFileName.lastIndexOf(".");
        const originalExt = dotIndex >= 0 ? oldFileName.slice(dotIndex) : "";
        if (originalExt && !newName.endsWith(originalExt)) {
          newName = newName + originalExt;
        }

        // Adiciona o prefixo no início do novo nome se já não o tiver
        if (prefix && !newName.startsWith(prefix)) {
          newName = prefix + newName;
        }
      }

      const newPath = parent ? `${parent}/${newName}` : newName;
      await invoke("note_move_note_item", {
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
      await invoke("note_move_note_item", { sourcePath, destPath });
      fetchItems();
      toast.success("Item movido");
    } catch {
      toast.error("Erro ao mover item");
    }
  };

  const handleTogglePin = async (item: FileSystemItem) => {
    if (item.isDir || !item.note) return;
    try {
      await invoke("note_update_note_pinned", {
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
                    item.isDir
                      ? setCurrentPath(item.path)
                      : item.note && onNoteClick(item.note, false)
                  }
                  onEdit={() => item.note && onNoteClick(item.note, true)}
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
            <div
              className={cn(
                "p-4 bg-neutral-800 border rounded-2xl opacity-80 cursor-grabbing flex flex-col items-center gap-2 scale-90",
                theme.border.replace("20", "50"),
              )}
            >
              {activeItem.isDir ? (
                <Folder
                  className={cn("w-10 h-10", theme.text)}
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
                className={cn(
                  "bg-neutral-800 border-border",
                  theme.borderHover.replace("hover:", "focus:"),
                )}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderOpen(false)}>
                Cancelar
              </Button>
              <Button
                className={cn(
                  "text-white font-bold",
                  theme.solid,
                  theme.solidHover,
                )}
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
                Renomear {renameTarget?.isDir ? "Pasta" : "Nota"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Novo nome"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className={cn(
                  "bg-neutral-800 border-border",
                  theme.borderHover.replace("hover:", "focus:"),
                )}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRenameTarget(null)}>
                Cancelar
              </Button>
              <Button
                className={cn(
                  "text-white font-bold",
                  theme.solid,
                  theme.solidHover,
                )}
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
              deleteConfirmTarget.isDir ? "Excluir pasta?" : "Excluir nota?"
            }
            description={
              deleteConfirmTarget.isDir
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
