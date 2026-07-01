"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Edit2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import type { Flashcard, FlashcardDeck } from "./types";

interface CardListModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: FlashcardDeck;
  onCardsChanged?: () => void;
}

const getFocusBorderClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "focus:border-blue-500/50",
    sky: "focus:border-sky-500/50",
    cyan: "focus:border-cyan-500/50",
    indigo: "focus:border-indigo-500/50",
    violet: "focus:border-violet-500/50",
    purple: "focus:border-purple-500/50",
    fuchsia: "focus:border-fuchsia-500/50",
    pink: "focus:border-pink-500/50",
    rose: "focus:border-rose-500/50",
    red: "focus:border-red-500/50",
    orange: "focus:border-orange-500/50",
    amber: "focus:border-amber-500/50",
    yellow: "focus:border-yellow-500/50",
    lime: "focus:border-lime-500/50",
    green: "focus:border-green-500/50",
    emerald: "focus:border-emerald-500/50",
    teal: "focus:border-teal-500/50",
    slate: "focus:border-slate-500/50",
    zinc: "focus:border-zinc-500/50",
    neutral: "focus:border-neutral-500/50",
    stone: "focus:border-stone-500/50",
    coffee: "focus:border-amber-800/50",
    carbon: "focus:border-zinc-500/50",
  };
  return map[color] || "focus:border-blue-500/50";
};

const getEditHoverClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "hover:text-blue-500 hover:bg-blue-600/10",
    sky: "hover:text-sky-500 hover:bg-sky-600/10",
    cyan: "hover:text-cyan-500 hover:bg-cyan-600/10",
    indigo: "hover:text-indigo-500 hover:bg-indigo-600/10",
    violet: "hover:text-violet-500 hover:bg-violet-600/10",
    purple: "hover:text-purple-500 hover:bg-purple-600/10",
    fuchsia: "hover:text-fuchsia-500 hover:bg-fuchsia-600/10",
    pink: "hover:text-pink-500 hover:bg-pink-600/10",
    rose: "hover:text-rose-500 hover:bg-rose-600/10",
    red: "hover:text-red-500 hover:bg-red-600/10",
    orange: "hover:text-orange-500 hover:bg-orange-600/10",
    amber: "hover:text-amber-500 hover:bg-amber-600/10",
    yellow: "hover:text-yellow-500 hover:bg-yellow-600/10",
    lime: "hover:text-lime-500 hover:bg-lime-600/10",
    green: "hover:text-green-500 hover:bg-green-600/10",
    emerald: "hover:text-emerald-500 hover:bg-emerald-600/10",
    teal: "hover:text-teal-500 hover:bg-teal-600/10",
    slate: "hover:text-slate-500 hover:bg-slate-600/10",
    zinc: "hover:text-zinc-500 hover:bg-zinc-600/10",
    neutral: "hover:text-neutral-500 hover:bg-neutral-600/10",
    stone: "hover:text-stone-500 hover:bg-stone-600/10",
    coffee: "hover:text-amber-800 hover:bg-amber-900/10",
    carbon: "hover:text-zinc-500 hover:bg-zinc-600/10",
  };
  return map[color] || "hover:text-blue-500 hover:bg-blue-600/10";
};

export function CardListModal({
  isOpen,
  onClose,
  deck,
  onCardsChanged,
}: CardListModalProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);

  const m = getColorTheme(deck.color || "blue");

  const fetchCards = useCallback(async () => {
    if (!deck.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invoke<Flashcard[]>("flashcards_list_cards", {
        deckId: deck.id,
      });
      setCards(res);
    } catch (err) {
      console.error("[CardListModal] Erro ao carregar cartões:", err);
      setError("Falha ao carregar os cartões do baralho.");
    } finally {
      setLoading(false);
    }
  }, [deck.id]);

  useEffect(() => {
    if (isOpen && deck.id) {
      fetchCards();
      setFront("");
      setBack("");
      setEditingCardId(null);
    }
  }, [isOpen, deck, fetchCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deck.id) return;

    setError(null);
    try {
      if (editingCardId !== null) {
        // Edit card
        const cardToUpdate = cards.find((c) => c.id === editingCardId);
        if (cardToUpdate) {
          const updated: Flashcard = {
            ...cardToUpdate,
            front: front.trim(),
            back: back.trim(),
          };
          await invoke("flashcards_update_card", { card: updated });
        }
        setEditingCardId(null);
      } else {
        // Create new card
        const newCard: Flashcard = {
          deckId: deck.id,
          front: front.trim(),
          back: back.trim(),
          reviewCount: 0,
          successCount: 0,
          createdAt: new Date().toISOString(),
        };
        await invoke("flashcards_add_card", { card: newCard });
      }
      setFront("");
      setBack("");
      fetchCards();
      if (onCardsChanged) onCardsChanged();
    } catch (err) {
      console.error("[CardListModal] Erro ao salvar cartão:", err);
      setError("Falha ao salvar o cartão. Tente novamente.");
    }
  };

  const handleEditInit = (card: Flashcard) => {
    if (!card.id) return;
    setEditingCardId(card.id);
    setFront(card.front);
    setBack(card.back);
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setFront("");
    setBack("");
  };

  const handleDeleteCard = async (id: number) => {
    setError(null);
    try {
      await invoke("flashcards_delete_card", { id });
      fetchCards();
      if (onCardsChanged) onCardsChanged();
    } catch (err) {
      console.error("[CardListModal] Erro ao deletar cartão:", err);
      setError("Falha ao remover o cartão.");
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="h-[80vh] max-h-[700px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Gerenciar cartões: <span className={m.text}>{deck.name}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adicione, edite ou exclua cartões de memorização deste baralho
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

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Form */}
        <div className="w-full md:w-[350px] border-r border-border/50 p-6 flex flex-col gap-4 bg-card/5 shrink-0 overflow-y-auto">
          <h3 className="text-sm font-bold text-foreground">
            {editingCardId !== null ? "Editar cartão" : "Novo cartão"}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="card-front"
                className="text-xs font-semibold text-muted-foreground"
              >
                Frente (pergunta ou termo)
              </label>
              <textarea
                id="card-front"
                required
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="O que será mostrado primeiro..."
                rows={5}
                className={cn(
                  "w-full p-3 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none",
                  getFocusBorderClass(deck.color || "blue"),
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="card-back"
                className="text-xs font-semibold text-muted-foreground"
              >
                Verso (resposta ou definição)
              </label>
              <textarea
                id="card-back"
                required
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="A resposta para a pergunta do cartão..."
                rows={5}
                className={cn(
                  "w-full p-3 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none",
                  getFocusBorderClass(deck.color || "blue"),
                )}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              {editingCardId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={!front.trim() || !back.trim()}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5",
                  m.solid,
                  m.solidHover,
                )}
              >
                {editingCardId !== null ? (
                  "Salvar"
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lado direito: Lista de cartões existentes */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-sm font-bold text-foreground">
              Lista de cartões
            </h3>
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-md border border-border/55">
              {cards.length} {cards.length === 1 ? "cartão" : "cartões"}
            </span>
          </div>

          {loading && cards.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Carregando cartões...
            </div>
          ) : cards.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-6 text-center bg-card/5">
              <p className="text-xs font-bold text-muted-foreground">
                Nenhum cartão cadastrado
              </p>
              <p className="text-[10px] text-neutral-600 max-w-[200px] mt-1 leading-relaxed">
                Use o formulário ao lado para adicionar o primeiro cartão a este
                baralho.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {cards.map((card) => {
                const successRate =
                  card.reviewCount > 0
                    ? Math.round((card.successCount / card.reviewCount) * 100)
                    : 0;

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-border bg-card/30 flex justify-between items-start gap-4 hover:border-border/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Frente
                        </span>
                        <p className="text-xs font-medium text-foreground whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {card.front}
                        </p>
                      </div>

                      <div className="h-px bg-border/40 my-1" />

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Verso
                        </span>
                        <p className="text-xs font-medium text-foreground/80 whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {card.back}
                        </p>
                      </div>

                      {card.reviewCount > 0 && (
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500 font-semibold">
                          <span>Revisado: {card.reviewCount}x</span>
                          <span>Acertos: {successRate}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditInit(card)}
                        className={cn(
                          "p-1.5 text-muted-foreground rounded-lg transition-colors cursor-pointer",
                          getEditHoverClass(deck.color || "blue"),
                        )}
                        title="Editar cartão"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => card.id && handleDeleteCard(card.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-600/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
