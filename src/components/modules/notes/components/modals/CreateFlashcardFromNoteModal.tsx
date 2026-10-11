"use client";

import { invoke } from "@tauri-apps/api/core";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface Deck {
  id: number;
  name: string;
  color?: string;
}

interface CreateFlashcardFromNoteModalProps {
  isOpen: boolean;
  initialFront?: string;
  initialBack?: string;
  noteTitle: string;
  onClose: () => void;
}

export function CreateFlashcardFromNoteModal({
  isOpen,
  initialFront = "",
  initialBack = "",
  noteTitle,
  onClose,
}: CreateFlashcardFromNoteModalProps) {
  const { user } = useAuth();
  const color = getModuleColor("flashcards");
  const theme = getColorTheme(color);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  const uid = user ? String(user.id) : "";

  useEffect(() => {
    if (isOpen) {
      setFront(initialFront || noteTitle || "");
      setBack(initialBack || "");
      if (uid) {
        invoke<Deck[]>("flashcards_list_decks", { userId: uid })
          .then((res) => {
            setDecks(res);
            if (res.length > 0) {
              setSelectedDeckId(res[0].id);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, initialFront, initialBack, noteTitle, uid]);

  const handleCreateDeckFromQuery = async (query: string) => {
    if (!query.trim() || !uid) return;
    try {
      const created = await invoke<Deck>("flashcards_create_deck", {
        userId: uid,
        name: query.trim(),
        description: `Criado a partir de ${noteTitle}`,
        color: "#6366F1",
      });
      setDecks((prev) => [...prev, created]);
      setSelectedDeckId(created.id);
      toast.success(`Baralho "${created.name}" criado!`);
    } catch {
      toast.error("Erro ao criar baralho");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId) {
      toast.error("Selecione um baralho de destino");
      return;
    }
    if (!front.trim()) {
      toast.error("A frente (pergunta) do flashcard é obrigatória");
      return;
    }
    if (!back.trim()) {
      toast.error("O verso (resposta) do flashcard é obrigatório");
      return;
    }

    setSaving(true);
    try {
      await invoke("flashcards_add_card", {
        deckId: selectedDeckId,
        front: front.trim(),
        back: back.trim(),
      });
      toast.success("Flashcard adicionado ao seu baralho!");
      onClose();
    } catch {
      toast.error("Erro ao salvar flashcard");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = cn(
    "w-full bg-card border-border rounded-xl text-sm font-medium transition-all placeholder:text-muted-foreground/50",
    theme.borderHover.replace("hover:", "focus:"),
  );
  const labelClass = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Sparkles className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">
              Criar Flashcard da Nota
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transforme seus estudos em memorização espaçada ativa
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5"
      >
        {/* Seletor de Baralho com SearchableSelect Global */}
        <div className="space-y-2">
          <Label className={labelClass}>Baralho de destino</Label>
          <SearchableSelect
            items={decks}
            value={selectedDeckId ?? undefined}
            onChange={(item) => {
              if (typeof item === "object" && item !== null && "id" in item) {
                setSelectedDeckId(item.id);
              }
            }}
            getItemKey={(d) => d.id}
            getItemLabel={(d) => d.name}
            placeholder="Selecione ou busque um baralho..."
            searchPlaceholder="Buscar baralho existente ou digitar novo..."
            emptyMessage="Nenhum baralho encontrado"
            moduleName="flashcards"
            onCreateNew={handleCreateDeckFromQuery}
          />
        </div>

        {/* Frente do Card (Pergunta) */}
        <div className="space-y-2">
          <Label htmlFor="flashcard-front" className={labelClass}>
            Frente (Pergunta / Conceito)
          </Label>
          <Input
            id="flashcard-front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Ex: O que é o princípio da incerteza?"
            className={inputStyle}
            required
          />
        </div>

        {/* Verso do Card (Resposta) */}
        <div className="space-y-2">
          <Label htmlFor="flashcard-back" className={labelClass}>
            Verso (Resposta / Explicação)
          </Label>
          <Textarea
            id="flashcard-back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Ex: É um princípio fundamental da mecânica quântica enunciado por Heisenberg..."
            className={cn(inputStyle, "min-h-30 resize-y py-3")}
            required
          />
        </div>

        {/* Rodapé interno */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !selectedDeckId}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50",
              theme.solid,
              theme.solidHover,
            )}
          >
            {saving ? "Salvando..." : "Adicionar Flashcard"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
