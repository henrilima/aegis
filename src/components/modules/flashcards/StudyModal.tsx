"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Award, RefreshCcw, Smile, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import type { Flashcard, FlashcardDeck } from "./types";

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: FlashcardDeck;
  customCards?: Flashcard[]; // Lista de cartões personalizada para Revisão Diária Global
  onSessionComplete?: () => void;
}

export function StudyModal({
  isOpen,
  onClose,
  deck,
  customCards,
  onSessionComplete,
}: StudyModalProps) {
  const [rawCards, setRawCards] = useState<Flashcard[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de configuração pré-estudo
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [limitOption, setLimitOption] = useState<string>("all");
  const [orderOption, setOrderOption] = useState<"shuffle" | "chrono">(
    "shuffle",
  );

  // Estado da sessão
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const m = getColorTheme(deck?.color || "indigo");

  // Embaralhamento Fisher-Yates
  const shuffleArray = (array: Flashcard[]): Flashcard[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startSession = useCallback(async () => {
    // Se cartões personalizados foram fornecidos (ex: Fila de Revisão Global)
    if (customCards) {
      if (customCards.length === 0) {
        setError("Não há cartões devidos para revisão hoje!");
      } else {
        setRawCards(customCards);
        setIsConfiguring(true);
        setIsFinished(false);
      }
      return;
    }

    if (!deck?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await invoke<Flashcard[]>("flashcards_list_cards", {
        deckId: deck.id,
      });
      if (res.length === 0) {
        setError("Adicione cartões a este baralho antes de iniciar o estudo.");
      } else {
        setRawCards(res);
        setIsConfiguring(true);
        setIsFinished(false);
      }
    } catch (err) {
      console.error("[StudyModal] Erro ao carregar cartões para estudo:", err);
      setError("Falha ao preparar a sessão de estudos.");
    } finally {
      setLoading(false);
    }
  }, [deck?.id, customCards]);

  useEffect(() => {
    if (isOpen && (deck?.id || customCards)) {
      startSession();
    }
  }, [isOpen, deck, customCards, startSession]);

  const handleStartStudy = () => {
    let processed = [...rawCards];
    if (orderOption === "shuffle") {
      processed = shuffleArray(processed);
    } else {
      // Cronológico (mais antigo primeiro)
      processed.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    if (limitOption !== "all") {
      const limit = parseInt(limitOption, 10);
      processed = processed.slice(0, limit);
    }

    setCards(processed);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsConfiguring(false);
  };

  const handleFlip = () => {
    if (isFinished) return;
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (success: boolean) => {
    const currentCard = cards[currentIndex];
    if (!currentCard || !currentCard.id) return;

    try {
      // Registra a revisão no SQLite do Tauri
      await invoke("flashcards_record_review", {
        id: currentCard.id,
        success,
        reviewedAt: new Date().toISOString(),
      });

      if (success) {
        setCorrectCount((prev) => prev + 1);
      }

      // Fluxo para o próximo cartão
      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        // Aguarda a animação de flip terminar para mostrar o próximo cartão
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 200);
      } else {
        setIsFinished(true);
        if (onSessionComplete) onSessionComplete();
      }
    } catch (err) {
      console.error("[StudyModal] Erro ao registrar revisão:", err);
    }
  };

  const handleRestart = () => {
    setIsConfiguring(true);
    setIsFinished(false);
  };

  const successRate =
    cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

  const getMotivationalMessage = (rate: number) => {
    if (rate === 100)
      return "Desempenho perfeito! Você dominou completamente este assunto!";
    if (rate >= 80) return "Excelente! Sua memorização está incrível!";
    if (rate >= 60)
      return "Muito bom! Continue revisando para fixar ainda mais.";
    if (rate >= 40)
      return "Bom progresso! A repetição levará você à perfeição.";
    return "Não desanime! Cada erro é um passo mais próximo do aprendizado.";
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="md">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Estudando:{" "}
            <span className={m.text}>
              {deck?.name || "Revisão Diária Global"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Memorização ativa com repetição espaçada
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {loading ? (
          <div className="flex-1 py-16 flex items-center justify-center text-xs text-muted-foreground">
            Preparando cartões...
          </div>
        ) : error ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-foreground max-w-xs">
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : isConfiguring ? (
          /* Pre-Study Configuration Screen */
          <div className="grow flex flex-col gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-foreground">
                Configurações de Estudo
              </h3>
              <p className="text-xs text-muted-foreground">
                Personalize os cartões e a ordem antes de iniciar sua sessão
              </p>
            </div>

            {/* Quantidade de Cartões */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Quantidade de cartões
              </span>
              <div className="grid grid-cols-4 gap-2 bg-background p-1.5 rounded-xl border border-border">
                {[
                  { key: "5", label: "5" },
                  { key: "10", label: "10" },
                  { key: "20", label: "20" },
                  { key: "30", label: "30" },
                  { key: "40", label: "40" },
                  { key: "50", label: "50" },
                  { key: "60", label: "60" },
                  { key: "70", label: "70" },
                  { key: "80", label: "80" },
                  { key: "90", label: "90" },
                  { key: "100", label: "100" },
                  { key: "all", label: "Todos" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLimitOption(opt.key)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                      limitOption === opt.key
                        ? `${m.bg} ${m.textSub} ${m.border}`
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/30",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordem de Exibição */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Ordem de exibição
              </span>
              <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-xl border border-border">
                {(
                  [
                    { key: "shuffle", label: "Embaralhar cartões" },
                    { key: "chrono", label: "Ordem de criação" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setOrderOption(opt.key)}
                    className={cn(
                      "py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border border-transparent",
                      orderOption === opt.key
                        ? `${m.bg} ${m.textSub} ${m.border}`
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Informação do resumo */}
            <div
              className={cn(
                "rounded-xl p-4 flex flex-col gap-1.5 mt-2 border",
                m.bg,
                m.border,
              )}
            >
              <span className={cn("text-xs font-bold", m.textSub)}>
                Resumo da sessão
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você revisará{" "}
                <span className="font-bold text-foreground">
                  {limitOption === "all"
                    ? rawCards.length
                    : Math.min(parseInt(limitOption, 10), rawCards.length)}
                </span>{" "}
                cartões no total, exibidos em ordem{" "}
                <span className="font-bold text-foreground">
                  {orderOption === "shuffle"
                    ? "aleatória"
                    : "cronológica de criação"}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartStudy}
              className={cn(
                "w-full py-3 px-4 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer mt-auto",
                m.solid,
                m.solidHover,
              )}
            >
              Iniciar estudos
            </button>
          </div>
        ) : isFinished ? (
          /* Summary Screen */
          <div className="grow flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-neutral-500/5 blur-3xl rounded-full scale-150" />
              <div className="relative p-6 rounded-2xl bg-card/40 border border-border">
                {successRate >= 60 ? (
                  <Award className={`w-14 h-14 ${m.text}`} />
                ) : (
                  <Smile className="w-14 h-14 text-yellow-500/80" />
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground">
              Estudo concluído!
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
              Você concluiu a revisão de todos os cartões deste baralho.
            </p>

            {/* Score circle-like panel */}
            <div className="w-full max-w-xs bg-card/30 border border-border rounded-2xl p-6 flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Total de cartões</span>
                <span className="text-foreground">{cards.length}</span>
              </div>
              <div className="h-px bg-border/40" />
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Acertos</span>
                <span className="text-emerald-400 font-bold">
                  {correctCount}
                </span>
              </div>
              <div className="h-px bg-border/40" />
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Taxa de aproveitamento</span>
                <span
                  className={`font-bold ${successRate >= 60 ? "text-emerald-400" : "text-yellow-500"}`}
                >
                  {successRate}%
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground max-w-xs leading-relaxed italic mb-8">
              "{getMotivationalMessage(successRate)}"
            </p>

            <div className="flex gap-3 w-full max-w-xs mt-auto">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer",
                  m.solid,
                  m.solidHover,
                )}
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          /* Active Review Screen */
          <div className="flex-1 flex flex-col gap-6 select-none animate-in fade-in duration-300">
            {/* Progress Header */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                <span>Progresso</span>
                <span>
                  {currentIndex + 1} de {cards.length}
                </span>
              </div>
              {/* Linear Progress Bar */}
              <div className="w-full h-1.5 bg-muted border border-border/10 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn("h-full transition-all duration-300", m.solid)}
                  style={{
                    width: `${((currentIndex + 1) / cards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div className="flex-1 flex items-center justify-center py-4">
              <button
                type="button"
                onClick={handleFlip}
                className="w-full max-w-md h-64 relative cursor-pointer group text-left block focus:outline-none"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="w-full h-full relative transition-transform duration-500"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "none",
                  }}
                >
                  {/* Card Front */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 border rounded-2xl transition-all text-center",
                      "bg-card/45 border-border group-hover:border-border/80 text-foreground",
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground mb-4">
                      Frente
                    </span>
                    <p
                      className={cn(
                        "text-base whitespace-pre-wrap wrap-break-word leading-relaxed max-w-full overflow-y-auto max-h-[140px] custom-scrollbar",
                        "text-foreground font-semibold",
                      )}
                    >
                      {cards[currentIndex]?.front}
                    </p>
                    <span className="text-[9px] text-neutral-600 mt-auto flex items-center gap-1">
                      <RefreshCcw className="w-2.5 h-2.5" />
                      Clique para virar o cartão
                    </span>
                  </div>

                  {/* Card Back */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 border rounded-2xl transition-all text-center",
                      "bg-card/45 border-border text-foreground",
                    )}
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground mb-4">
                      Verso
                    </span>
                    <p
                      className={cn(
                        "text-base whitespace-pre-wrap wrap-break-word leading-relaxed max-w-full overflow-y-auto max-h-[140px] custom-scrollbar",
                        "text-foreground/90 font-semibold",
                      )}
                    >
                      {cards[currentIndex]?.back}
                    </p>
                    <span className="text-[9px] text-neutral-600 mt-auto">
                      Como foi o seu desempenho?
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Answer Buttons: Shows only if Flipped */}
            <div className="h-14 shrink-0 flex items-center justify-center">
              {isFlipped ? (
                <div className="flex gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button
                    type="button"
                    onClick={() => handleAnswer(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Errei
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Acertei
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFlip}
                  className="w-full max-w-md py-3 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Virar cartão para responder
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
