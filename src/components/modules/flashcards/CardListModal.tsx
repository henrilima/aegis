"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Edit2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // Estado do formulário e formatos de cartão
  type CardFormat = "standard" | "cloze" | "vf" | "quiz";
  const [cardFormat, setCardFormat] = useState<CardFormat>("standard");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);

  // Estados específicos de V/F e Quiz
  const [vfAnswer, setVfAnswer] = useState<"Verdadeiro" | "Falso">(
    "Verdadeiro",
  );
  const [vfExplanation, setVfExplanation] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState<
    [string, string, string, string]
  >(["", "", "", ""]);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState<number>(0);
  const [quizExplanation, setQuizExplanation] = useState("");

  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  const m = getColorTheme(deck.color || "blue");

  // Ação para envolver seleção do usuário com {{...}} no modo omissão
  const handleWrapClozeSelection = () => {
    const textarea = frontTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = front.substring(start, end);

    if (selectedText.trim().length > 0) {
      const newText = `${front.substring(0, start)}{{${selectedText}}}${front.substring(end)}`;
      setFront(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    } else {
      const placeholder = "{{palavra}}";
      const newText =
        front.substring(0, start) + placeholder + front.substring(end);
      setFront(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2 + "palavra".length);
      }, 0);
    }
  };

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
      setCardFormat("standard");
    }
  }, [isOpen, deck, fetchCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck.id) return;

    let finalFront = front.trim();
    let finalBack = back.trim();

    if (cardFormat === "vf") {
      if (!front.trim()) return;
      finalFront = `[V/F] ${front.trim()}`;
      finalBack = vfExplanation.trim()
        ? `${vfAnswer} — ${vfExplanation.trim()}`
        : vfAnswer;
    } else if (cardFormat === "quiz") {
      if (!quizQuestion.trim() || quizOptions.some((opt) => !opt.trim())) {
        setError("Preencha o enunciado e todas as 4 alternativas do quiz.");
        return;
      }
      finalFront = `[QUIZ] ${quizQuestion.trim()}\nA) ${quizOptions[0].trim()}\nB) ${quizOptions[1].trim()}\nC) ${quizOptions[2].trim()}\nD) ${quizOptions[3].trim()}`;
      const letters = ["A", "B", "C", "D"];
      const correctLetter = letters[quizCorrectIndex];
      const correctText = quizOptions[quizCorrectIndex].trim();
      finalBack = quizExplanation.trim()
        ? `Correta: ${correctLetter}) ${correctText} — ${quizExplanation.trim()}`
        : `Correta: ${correctLetter}) ${correctText}`;
    } else if (cardFormat === "cloze") {
      if (!finalFront) return;
      if (!finalFront.includes("{{") || !finalFront.includes("}}")) {
        setError(
          "O modo omissão precisa conter pelo menos um termo entre {{...}}.",
        );
        return;
      }
      if (!finalBack) {
        finalBack = "Omissão de palavras fixada";
      }
    } else {
      if (!finalFront || !finalBack) return;
    }

    setError(null);
    try {
      if (editingCardId !== null) {
        // Editar cartão existente
        const cardToUpdate = cards.find((c) => c.id === editingCardId);
        if (cardToUpdate) {
          const updated: Flashcard = {
            ...cardToUpdate,
            front: finalFront,
            back: finalBack,
          };
          await invoke("flashcards_update_card", { card: updated });
        }
        setEditingCardId(null);
      } else {
        // Criar novo cartão
        const newCard: Flashcard = {
          deckId: deck.id,
          front: finalFront,
          back: finalBack,
          reviewCount: 0,
          successCount: 0,
          createdAt: new Date().toISOString(),
        };
        await invoke("flashcards_add_card", { card: newCard });
      }
      setFront("");
      setBack("");
      setVfExplanation("");
      setQuizQuestion("");
      setQuizOptions(["", "", "", ""]);
      setQuizExplanation("");
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

    // Detectar formato ao editar
    if (card.front.startsWith("[QUIZ]")) {
      setCardFormat("quiz");
      const lines = card.front.replace("[QUIZ] ", "").split("\n");
      const q = lines[0] || "";
      const optA =
        lines.find((l) => l.startsWith("A) "))?.replace("A) ", "") || "";
      const optB =
        lines.find((l) => l.startsWith("B) "))?.replace("B) ", "") || "";
      const optC =
        lines.find((l) => l.startsWith("C) "))?.replace("C) ", "") || "";
      const optD =
        lines.find((l) => l.startsWith("D) "))?.replace("D) ", "") || "";
      setQuizQuestion(q);
      setQuizOptions([optA, optB, optC, optD]);

      if (card.back.includes("Correta: B)")) setQuizCorrectIndex(1);
      else if (card.back.includes("Correta: C)")) setQuizCorrectIndex(2);
      else if (card.back.includes("Correta: D)")) setQuizCorrectIndex(3);
      else setQuizCorrectIndex(0);

      const exp = card.back.split(" — ")[1] || "";
      setQuizExplanation(exp);
      setFront(card.front);
      setBack(card.back);
    } else if (card.front.startsWith("[V/F]")) {
      setCardFormat("vf");
      setFront(card.front.replace("[V/F] ", ""));
      const isTrue = card.back.startsWith("Verdadeiro");
      setVfAnswer(isTrue ? "Verdadeiro" : "Falso");
      const exp = card.back.split(" — ")[1] || "";
      setVfExplanation(exp);
      setBack(card.back);
    } else if (card.front.includes("{{") && card.front.includes("}}")) {
      setCardFormat("cloze");
      setFront(card.front);
      setBack(card.back);
    } else {
      setCardFormat("standard");
      setFront(card.front);
      setBack(card.back);
    }
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setFront("");
    setBack("");
    setVfExplanation("");
    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setQuizExplanation("");
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
      className="h-[80vh] max-h-175"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Gerenciar cartões: <span className={m.text}>{deck.name}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adicione, edite ou exclua cartões com formatos flexíveis de
            memorização
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
        <div className="w-full md:w-96 border-r border-border/50 p-6 flex flex-col gap-4 bg-card/5 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              {editingCardId !== null ? "Editar cartão" : "Novo cartão"}
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
              Formato ativo
            </span>
          </div>

          {/* Formato do Cartão */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted/30 border border-border rounded-xl">
            {(
              [
                { id: "standard", label: "Padrão" },
                { id: "cloze", label: "Omissão" },
                { id: "vf", label: "V / F" },
                { id: "quiz", label: "Quiz" },
              ] as const
            ).map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setCardFormat(fmt.id)}
                className={cn(
                  "py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center",
                  cardFormat === fmt.id
                    ? `${m.bg} ${m.textSub} ${m.border} border`
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent",
                )}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Formato Padrão ou Omissão */}
            {(cardFormat === "standard" || cardFormat === "cloze") && (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="card-front"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {cardFormat === "cloze"
                        ? "Texto com omissão"
                        : "Frente (pergunta ou termo)"}
                    </label>
                    {cardFormat === "cloze" && (
                      <button
                        type="button"
                        onClick={handleWrapClozeSelection}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors border cursor-pointer",
                          `${m.bg} ${m.textSub} ${m.border}`,
                        )}
                        title="Selecione um trecho de texto e clique para envolver com {{...}}"
                      >
                        Omitir seleção &#123;&#123;...&#125;&#125;
                      </button>
                    )}
                  </div>
                  <textarea
                    ref={frontTextareaRef}
                    id="card-front"
                    required
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder={
                      cardFormat === "cloze"
                        ? "Ex: A capital da França é {{Paris}} e sua moeda é o {{Euro}}."
                        : "O que será mostrado primeiro..."
                    }
                    rows={4}
                    className={cn(
                      "w-full p-3 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none",
                      getFocusBorderClass(deck.color || "blue"),
                    )}
                  />
                  {cardFormat === "cloze" && (
                    <span className="text-[10px] text-muted-foreground">
                      Dica: Selecione a palavra que deseja ocultar e clique em
                      &quot;Omitir seleção&quot;.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="card-back"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {cardFormat === "cloze"
                      ? "Dica ou explicação (opcional)"
                      : "Verso (resposta ou definição)"}
                  </label>
                  <textarea
                    id="card-back"
                    required={cardFormat === "standard"}
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder={
                      cardFormat === "cloze"
                        ? "Nota ou explicação complementar sobre os termos..."
                        : "A resposta para a pergunta do cartão..."
                    }
                    rows={4}
                    className={cn(
                      "w-full p-3 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none",
                      getFocusBorderClass(deck.color || "blue"),
                    )}
                  />
                </div>
              </>
            )}

            {/* Formato Verdadeiro ou Falso */}
            {cardFormat === "vf" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="vf-front"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Afirmação
                  </label>
                  <textarea
                    id="vf-front"
                    required
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder="Ex: A muralha da China é visível da órbita lunar a olho nu."
                    rows={3}
                    className={cn(
                      "w-full p-3 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none",
                      getFocusBorderClass(deck.color || "blue"),
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Resposta correta
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVfAnswer("Verdadeiro")}
                      className={cn(
                        "py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        vfAnswer === "Verdadeiro"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "border-border text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      Verdadeiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setVfAnswer("Falso")}
                      className={cn(
                        "py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        vfAnswer === "Falso"
                          ? "bg-red-500/15 border-red-500/40 text-red-400"
                          : "border-border text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      Falso
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="vf-exp"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Justificativa (opcional)
                  </label>
                  <input
                    id="vf-exp"
                    type="text"
                    value={vfExplanation}
                    onChange={(e) => setVfExplanation(e.target.value)}
                    placeholder="Ex: É um mito popular; a largura média não permite vê-la do espaço sem lentes."
                    className="w-full p-2.5 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Formato Quiz (Múltipla Escolha) */}
            {cardFormat === "quiz" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="quiz-q"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Pergunta ou Enunciado
                  </label>
                  <textarea
                    id="quiz-q"
                    required
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Ex: Qual é o elemento químico mais abundante no universo?"
                    rows={2}
                    className={cn(
                      "w-full p-2.5 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none resize-none",
                      getFocusBorderClass(deck.color || "blue"),
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Alternativas (marque a correta)
                    </span>
                  </div>

                  {(["A", "B", "C", "D"] as const).map((letter, idx) => (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizCorrectIndex(idx)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-bold border shrink-0 transition-all cursor-pointer flex items-center justify-center",
                          quizCorrectIndex === idx
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold"
                            : "border-border text-muted-foreground hover:bg-muted/50",
                        )}
                        title="Marcar como alternativa correta"
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        required
                        value={quizOptions[idx]}
                        onChange={(e) => {
                          const updated = [...quizOptions] as [
                            string,
                            string,
                            string,
                            string,
                          ];
                          updated[idx] = e.target.value;
                          setQuizOptions(updated);
                        }}
                        placeholder={`Alternativa ${letter}...`}
                        className="flex-1 p-2 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="quiz-exp"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Explicação complementar (opcional)
                  </label>
                  <input
                    id="quiz-exp"
                    type="text"
                    value={quizExplanation}
                    onChange={(e) => setQuizExplanation(e.target.value)}
                    placeholder="Ex: O hidrogênio compõe aproximadamente 75% da massa elemental do universo."
                    className="w-full p-2 text-xs bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </>
            )}

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
              <p className="text-[10px] text-neutral-600 max-w-50 mt-1 leading-relaxed">
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
