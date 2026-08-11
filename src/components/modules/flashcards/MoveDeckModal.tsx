"use client";

import { Folder, Home, X } from "lucide-react";
import { useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FlashcardDeck, FlashcardFolder } from "./types";

interface MoveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetFolderId: number | null) => void;
  deck: FlashcardDeck | null;
  folders: FlashcardFolder[];
}

export function MoveDeckModal({
  isOpen,
  onClose,
  onMove,
  deck,
  folders,
}: MoveDeckModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    deck?.folderId ?? null,
  );

  const mModule = getColorTheme(getModuleColor("flashcards"));

  if (!deck) return null;

  const handleConfirm = () => {
    onMove(selectedFolderId);
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20">
        <div>
          <h2 className="text-lg font-bold text-foreground">Mover baralho</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecione a pasta de destino para &quot;{deck.name}&quot;
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

      <div className="p-6 flex flex-col gap-3 max-h-80 overflow-y-auto">
        <button
          type="button"
          onClick={() => setSelectedFolderId(null)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all",
            selectedFolderId === null
              ? `${mModule.border} ${mModule.bg} text-foreground font-medium`
              : "border-border/60 hover:bg-muted/40 text-muted-foreground",
          )}
        >
          <Home className={cn("w-4 h-4", mModule.text)} />
          <span>Nível raiz (sem pasta)</span>
        </button>

        {folders.map((folder) => {
          const mFolder = getColorTheme(
            folder.color || getModuleColor("flashcards"),
          );
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id ?? null)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all",
                selectedFolderId === folder.id
                  ? `${mFolder.border} ${mFolder.bg} text-foreground font-medium`
                  : "border-border/60 hover:bg-muted/40 text-muted-foreground",
              )}
            >
              <Folder className={cn("w-4 h-4", mFolder.text)} />
              <span>{folder.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 p-4 border-t border-border/50 bg-card/20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 h-10 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-5 h-10 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
        >
          Confirmar movimento
        </button>
      </div>
    </ModalShell>
  );
}
