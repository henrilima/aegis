"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ColorPicker } from "@/components/global/ColorPicker";
import { ModalShell } from "@/components/ui/ModalShell";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { FlashcardDeck } from "./types";

interface DeckFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deck: { name: string; description: string; color: string }) => void;
  deck?: FlashcardDeck;
}

export function DeckFormModal({
  isOpen,
  onClose,
  onSave,
  deck,
}: DeckFormModalProps) {
  const defaultColor = getModuleColor("flashcards");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  const m = getColorTheme(color || defaultColor);

  const resetData = useCallback(() => {
    setName("");
    setDescription("");
    setColor("");
  }, []);

  useEffect(() => {
    if (deck) {
      setName(deck.name);
      setDescription(deck.description);
      setColor(deck.color || "");
    } else {
      resetData();
    }
  }, [deck, resetData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, description, color });
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
            {deck ? "Editar baralho" : "Criar baralho"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {deck
              ? "Atualize as informações do seu baralho"
              : "Crie um novo baralho para começar a estudar"}
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
            htmlFor="deck-name"
            className="text-xs font-semibold text-muted-foreground"
          >
            Nome do baralho
          </label>
          <input
            id="deck-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: verbos em inglês, anatomia humana..."
            className="w-full h-11 px-4 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-blue-500/30 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="deck-description"
            className="text-xs font-semibold text-muted-foreground"
          >
            Descrição (opcional)
          </label>
          <textarea
            id="deck-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Uma breve explicação sobre o assunto do baralho..."
            rows={3}
            className="w-full p-4 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-blue-500/30 focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Cor de identificação
          </span>
          <ColorPicker
            value={color}
            onChange={(c) => setColor(c)}
            defaultColor={defaultColor}
          />
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${m.solid} ${m.solidHover}`}
          >
            {deck ? "Salvar alterações" : "Criar baralho"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
