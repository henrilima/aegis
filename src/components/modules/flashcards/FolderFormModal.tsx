"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ColorPicker } from "@/components/global/ColorPicker";
import { IconSelect } from "@/components/global/IconSelect";
import { ModalShell } from "@/components/ui/ModalShell";
import { getModuleColor } from "@/modules.config";
import type { FlashcardFolder } from "./types";

interface FolderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: { name: string; color?: string; icon?: string }) => void;
  folder?: FlashcardFolder;
}

export function FolderFormModal({
  isOpen,
  onClose,
  onSave,
  folder,
}: FolderFormModalProps) {
  const defaultColor = getModuleColor("flashcards");
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("folder");

  const resetData = useCallback(() => {
    setName("");
    setColor("");
    setIcon("folder");
  }, []);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color || "");
      setIcon(folder.icon || "folder");
    } else {
      resetData();
    }
  }, [folder, resetData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, color, icon });
    resetData();
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      className="overflow-visible!"
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {folder ? "Editar pasta" : "Nova pasta"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {folder
              ? "Atualize o nome, cor ou ícone da pasta"
              : "Crie uma nova pasta para organizar seus baralhos"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 p-6 flex flex-col gap-4 overflow-visible"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="folder-name"
            className="text-xs font-semibold text-muted-foreground"
          >
            Nome da pasta
          </label>
          <input
            id="folder-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Medicina, Programação, Concurso..."
            className="w-full h-11 px-4 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-blue-500/30 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Cor da pasta
          </span>
          <ColorPicker
            value={color}
            onChange={(c) => setColor(c)}
            defaultColor={defaultColor}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Ícone da pasta
          </span>
          <IconSelect
            value={icon}
            onChange={(val) => setIcon(val)}
            color={color || defaultColor}
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 h-10 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
          >
            {folder ? "Salvar alterações" : "Criar pasta"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
