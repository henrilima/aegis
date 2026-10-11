"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  Award,
  Check,
  Clock,
  Flame,
  Keyboard,
  RefreshCcw,
  RotateCcw,
  Smile,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import type { Flashcard, FlashcardDeck } from "./types";

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: FlashcardDeck;
  customCards?: Flashcard[];
  onSessionComplete?: () => void;
}

export type StudyMode = "standard" | "inverted" | "sprint" | "type";
export type SrsRating = 1 | 2 | 3 | 4; // 1: Errei, 2: Difícil, 3: Mediano, 4: Fácil

// Renderizador para suporte a Cloze Deletion {{palavra oculta}}
function renderClozeContent(text: string, isRevealed: boolean) {
  if (!text.includes("{{") || !text.includes("}}")) {
    return text;
  }

  const parts = text.split(/(\{\{.*?\}\})/g);
  return parts.map((part, index) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const hiddenTerm = part.slice(2, -2);
      if (isRevealed) {
        return (
          <span
            key={`cloze-${index}-${hiddenTerm}`}
            className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 inline-block mx-0.5"
          >
            {hiddenTerm}
          </span>
        );
      }
      return (
        <span
          key={`cloze-${index}-${hiddenTerm}`}
          className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold border border-border inline-block mx-0.5"
        >
          [...]
        </span>
      );
    }
    return part;
  });
}

// Auxiliares para detectar cartões com formatos especiais interativos
function isSpecialCard(card?: Flashcard): boolean {
  if (!card) return false;
  return (
    card.front.startsWith("[V/F]") ||
    card.front.startsWith("[QUIZ]") ||
    (card.front.includes("{{") && card.front.includes("}}"))
  );
}

// Extrai respostas válidas para validação no modo digitação
function checkTypedMatch(
  typed: string,
  card?: Flashcard,
  isInv: boolean = false,
): { isMatch: boolean; expectedLabel: string } {
  if (!card) return { isMatch: false, expectedLabel: "" };
  const cleanInput = typed.trim().toLowerCase();

  // V/F
  if (card.front.startsWith("[V/F]")) {
    const isTrue = card.back.startsWith("Verdadeiro");
    const expectedLabel = isTrue ? "Verdadeiro (V)" : "Falso (F)";
    const matchesTrue = ["v", "verdadeiro", "true", "t"].includes(cleanInput);
    const matchesFalse = ["f", "falso", "false"].includes(cleanInput);
    const isMatch = isTrue ? matchesTrue : matchesFalse;
    return { isMatch, expectedLabel };
  }

  // QUIZ
  if (card.front.startsWith("[QUIZ]")) {
    const match = card.back.match(/Correta:\s*([A-D])\)\s*([^—\n]+)/i);
    const correctLetter = match ? match[1].toLowerCase() : "";
    const correctText = match ? match[2].trim().toLowerCase() : "";
    const expectedLabel = match
      ? `${match[1].toUpperCase()}) ${match[2].trim()}`
      : card.back;
    const isMatch = cleanInput === correctLetter || cleanInput === correctText;
    return { isMatch, expectedLabel };
  }

  // Omissão (Cloze)
  if (card.front.includes("{{") && card.front.includes("}}")) {
    const matches = Array.from(card.front.matchAll(/\{\{(.*?)\}\}/g)).map((m) =>
      m[1].trim(),
    );
    const expectedLabel = matches.join(", ");
    const isMatch =
      matches.some((term) => term.toLowerCase() === cleanInput) ||
      cleanInput === matches.map((m) => m.toLowerCase()).join(" ");
    return { isMatch, expectedLabel };
  }

  // Cartão padrão
  const expected = isInv ? card.front.trim() : card.back.trim();
  const isMatch = cleanInput === expected.toLowerCase();
  return { isMatch, expectedLabel: expected };
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

  // Referência para controlar a transição de abertura do modal
  const prevIsOpenRef = useRef(false);

  // Configurações da Sessão
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode>("standard");
  const [filterOnlyErrors, setFilterOnlyErrors] = useState(false);
  const [limitOption, setLimitOption] = useState<string>("all");
  const [customLimitInput, setCustomLimitInput] = useState<string>("15");
  const [orderOption, setOrderOption] = useState<"shuffle" | "chrono">(
    "shuffle",
  );

  // Estado da sessão de estudos
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Estatísticas do algoritmo de repetição espaçada (SRS)
  const [srsRatings, setSrsRatings] = useState<{
    errei: number;
    dificil: number;
    mediano: number;
    facil: number;
  }>({
    errei: 0,
    dificil: 0,
    mediano: 0,
    facil: 0,
  });

  // Estado do Modo Digitação
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Cronômetro do Modo Sprint (60s)
  const [timeLeft, setTimeLeft] = useState(60);

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
    const isJustOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (isJustOpened && (deck?.id || customCards)) {
      startSession();
    }
  }, [isOpen, deck?.id, customCards, startSession]);

  // Efeito do cronômetro do Modo Sprint
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (
      !isConfiguring &&
      !isFinished &&
      studyMode === "sprint" &&
      timeLeft > 0
    ) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            if (onSessionComplete) onSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConfiguring, isFinished, studyMode, timeLeft, onSessionComplete]);

  const handleStartStudy = () => {
    let processed = [...rawCards];

    if (filterOnlyErrors) {
      processed = processed.filter((card) => {
        if (!card.lastReviewed || card.reviewCount === 0) return true;
        const rate = (card.successCount / card.reviewCount) * 100;
        return rate < 50;
      });
      if (processed.length === 0) {
        toast.info(
          "Nenhum cartão crítico com taxa de acerto baixa encontrado! Exibindo todos os cartões.",
        );
        processed = [...rawCards];
      }
    }

    if (orderOption === "shuffle") {
      processed = shuffleArray(processed);
    } else {
      processed.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    if (limitOption === "custom") {
      const parsed = parseInt(customLimitInput, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        processed = processed.slice(0, parsed);
      }
    } else if (limitOption !== "all") {
      const limit = parseInt(limitOption, 10);
      processed = processed.slice(0, limit);
    }

    setCards(processed);
    setCurrentIndex(0);
    setCorrectCount(0);
    setSrsRatings({ errei: 0, dificil: 0, mediano: 0, facil: 0 });
    setSelectedChoice(null);
    setIsFlipped(false);
    setIsFinished(false);
    setTypedAnswer("");
    setIsAnswerChecked(false);
    setTimeLeft(60);
    setIsConfiguring(false);
  };

  const handleFlip = () => {
    if (isFinished) return;
    setIsFlipped(!isFlipped);
  };

  const handleVerifyTypedAnswer = () => {
    setIsAnswerChecked(true);
    setIsFlipped(true);
  };

  const handleAnswer = useCallback(
    async (rating: SrsRating) => {
      const currentCard = cards[currentIndex];
      if (!currentCard || !currentCard.id) return;

      const isSuccess = rating > 1;

      try {
        await invoke("flashcards_record_review", {
          id: currentCard.id,
          success: isSuccess,
          reviewedAt: new Date().toISOString(),
        });

        // Atualiza distribuição SRS e contagem de acertos
        setSrsRatings((prev) => {
          if (rating === 1) return { ...prev, errei: prev.errei + 1 };
          if (rating === 2) return { ...prev, dificil: prev.dificil + 1 };
          if (rating === 3) return { ...prev, mediano: prev.mediano + 1 };
          return { ...prev, facil: prev.facil + 1 };
        });

        if (isSuccess) {
          setCorrectCount((prev) => prev + 1);
        }

        // Se errou (rating 1), re-adiciona ao final da lista para repetição imediata
        if (rating === 1) {
          setCards((prev) => [...prev, currentCard]);
        }

        if (currentIndex + 1 < cards.length || rating === 1) {
          setIsFlipped(false);
          setSelectedChoice(null);
          setTypedAnswer("");
          setIsAnswerChecked(false);
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
    },
    [cards, currentIndex, onSessionComplete],
  );

  // Atalhos de teclado (Espaço para virar, 1-4 para avaliar no SRS)
  useEffect(() => {
    if (!isOpen || isConfiguring || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.code === "Space" && !isInputFocused) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      if (isFlipped && !isInputFocused) {
        if (e.key === "1") {
          e.preventDefault();
          handleAnswer(1);
        } else if (e.key === "2") {
          e.preventDefault();
          handleAnswer(2);
        } else if (e.key === "3") {
          e.preventDefault();
          handleAnswer(3);
        } else if (e.key === "4") {
          e.preventDefault();
          handleAnswer(4);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isConfiguring, isFinished, isFlipped, handleAnswer]);

  const handleRestart = () => {
    setIsConfiguring(true);
    setIsFinished(false);
    setSelectedChoice(null);
    setTypedAnswer("");
    setIsAnswerChecked(false);
    setSrsRatings({ errei: 0, dificil: 0, mediano: 0, facil: 0 });
  };

  const totalReviews =
    srsRatings.errei +
    srsRatings.dificil +
    srsRatings.mediano +
    srsRatings.facil;
  const retentionRate =
    totalReviews > 0
      ? Math.round(
          ((srsRatings.dificil + srsRatings.mediano + srsRatings.facil) /
            totalReviews) *
            100,
        )
      : 0;

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

  // Comparação de texto para o Modo Digitação
  const isCardSpecial = isSpecialCard(cards[currentIndex]);
  const effectiveInverted = studyMode === "inverted" && !isCardSpecial;
  const typedResult = checkTypedMatch(
    typedAnswer,
    cards[currentIndex],
    effectiveInverted,
  );
  const isExactMatch = typedResult.isMatch;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20 shrink-0 select-none">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Estudando:{" "}
            <span className={m.text}>
              {deck?.name || "Revisão Diária Global"}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {studyMode === "sprint"
              ? "Modo Sprint — 60 Segundos"
              : studyMode === "inverted"
                ? "Modo Invertido (Verso → Frente)"
                : studyMode === "type"
                  ? "Modo Digitação (Testar precisão de resposta)"
                  : "Memorização ativa com repetição espaçada"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
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
          /* Configurações Pré-Estudo */
          <div className="grow flex flex-col gap-6 py-2 animate-in fade-in zoom-in-95 duration-300 select-none">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-foreground">
                Modo e Configurações de Estudo
              </h3>
              <p className="text-xs text-muted-foreground">
                Escolha o modo de aprendizado e personalize a ordem
              </p>
            </div>

            {/* Modo de Estudo */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Modo de estudo
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-background p-1.5 rounded-xl border border-border">
                {[
                  {
                    key: "standard" as const,
                    label: "Tradicional",
                    desc: "Frente → Verso",
                    icon: Zap,
                  },
                  {
                    key: "type" as const,
                    label: "Digitação",
                    desc: "Digitar resposta",
                    icon: Keyboard,
                  },
                  {
                    key: "inverted" as const,
                    label: "Invertido",
                    desc: "Verso → Frente",
                    icon: RotateCcw,
                  },
                  {
                    key: "sprint" as const,
                    label: "Sprint 60s",
                    desc: "Contra o tempo",
                    icon: Clock,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setStudyMode(opt.key)}
                      className={cn(
                        "p-3 rounded-lg text-left flex flex-col gap-1 transition-all cursor-pointer border border-transparent",
                        studyMode === opt.key
                          ? `${m.bg} ${m.textSub} ${m.border}`
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </div>
                      <span className="text-[10px] opacity-75">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro Foco em Erros */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/40">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    Foco em Erros / Cartões Críticos
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Filtrar apenas cartões com aproveitamento inferior a 50%
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilterOnlyErrors(!filterOnlyErrors)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                  filterOnlyErrors
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                    : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground",
                )}
              >
                {filterOnlyErrors ? "Ativado" : "Desativado"}
              </button>
            </div>

            {/* Quantidade de Cartões */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Quantidade de cartões
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-background p-1.5 rounded-xl border border-border">
                {[
                  { key: "5", label: "5" },
                  { key: "10", label: "10" },
                  { key: "20", label: "20" },
                  { key: "30", label: "30" },
                  { key: "all", label: "Todos" },
                  { key: "custom", label: "Outro" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLimitOption(opt.key)}
                    className={cn(
                      "py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center",
                      limitOption === opt.key
                        ? `${m.bg} ${m.textSub} ${m.border}`
                        : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/30",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {limitOption === "custom" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Digite a quantidade exata:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={rawCards.length || 999}
                    value={customLimitInput}
                    onChange={(e) => setCustomLimitInput(e.target.value)}
                    className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: 15"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    (de {rawCards.length} disponíveis)
                  </span>
                </div>
              )}
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
          /* Resumo Final */
          <div className="grow flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in-95 duration-300 select-none">
            <div className="relative mb-6">
              <div className="p-6 rounded-2xl bg-card/40 border border-border">
                {studyMode === "sprint" ? (
                  <Clock className="w-14 h-14 text-blue-400 animate-bounce" />
                ) : retentionRate >= 60 ? (
                  <Award className={`w-14 h-14 ${m.text}`} />
                ) : (
                  <Smile className="w-14 h-14 text-yellow-500/80" />
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground">
              {studyMode === "sprint"
                ? timeLeft === 0
                  ? "Tempo Esgotado!"
                  : "Sprint Concluído!"
                : "Estudo Concluído!"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
              {studyMode === "sprint"
                ? timeLeft === 0
                  ? `O tempo de 60 segundos acabou! Você respondeu ${correctCount} cartões corretamente.`
                  : `Parabéns! Você concluiu todos os cartões com ${timeLeft}s restantes (${correctCount} corretos)!`
                : "Você concluiu a revisão de todos os cartões agendados."}
            </p>

            <div className="w-full max-w-sm bg-card/30 border border-border rounded-2xl p-6 flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Cartões revisados</span>
                <span className="text-foreground font-bold">
                  {currentIndex + 1}
                </span>
              </div>
              <div className="h-px bg-border/40" />
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Taxa de retenção</span>
                <span
                  className={cn(
                    "font-bold",
                    retentionRate >= 70 ? "text-emerald-400" : "text-amber-400",
                  )}
                >
                  {retentionRate}%
                </span>
              </div>
              <div className="h-px bg-border/40" />

              {/* Distribuição SRS */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground text-left">
                  Distribuição de respostas
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <div className="text-[10px] font-bold">Errei</div>
                    <div className="text-sm font-bold mt-0.5">
                      {srsRatings.errei}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <div className="text-[10px] font-bold">Difícil</div>
                    <div className="text-sm font-bold mt-0.5">
                      {srsRatings.dificil}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <div className="text-[10px] font-bold">Mediano</div>
                    <div className="text-sm font-bold mt-0.5">
                      {srsRatings.mediano}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <div className="text-[10px] font-bold">Fácil</div>
                    <div className="text-sm font-bold mt-0.5">
                      {srsRatings.facil}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground max-w-xs leading-relaxed italic mb-8">
              &quot;{getMotivationalMessage(retentionRate)}&quot;
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
          /* Sessão Ativa de Estudo */
          <div className="flex-1 flex flex-col gap-5 select-none animate-in fade-in duration-300">
            {/* Header de Progresso & Cronômetro Sprint */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                {studyMode === "sprint" ? (
                  <span className="text-blue-400 flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3 animate-spin" /> Tempo restante:{" "}
                    {timeLeft}s
                  </span>
                ) : (
                  <span>Progresso da sessão</span>
                )}
                <span>
                  {currentIndex + 1} de {cards.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted border border-border/10 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    studyMode === "sprint" ? "bg-blue-500" : m.solid,
                  )}
                  style={{
                    width:
                      studyMode === "sprint"
                        ? `${(timeLeft / 60) * 100}%`
                        : `${((currentIndex + 1) / cards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Container 3D do Cartão */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <button
                type="button"
                onClick={handleFlip}
                className="w-full max-w-xl min-h-90 h-auto relative cursor-pointer group text-left block focus:outline-none bg-transparent p-0 border-0"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="w-full h-full relative transition-transform duration-500 min-h-90"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "none",
                  }}
                >
                  {/* Frente do Cartão */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full rounded-2xl border bg-card/95 p-6 sm:p-7 flex flex-col justify-between transition-colors overflow-y-auto",
                      m.borderHover,
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {cards[currentIndex]?.front.startsWith("[V/F]") && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                            V / F
                          </span>
                        )}
                        {cards[currentIndex]?.front.startsWith("[QUIZ]") && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                            Quiz
                          </span>
                        )}
                        {cards[currentIndex]?.front.includes("{{") &&
                          cards[currentIndex]?.front.includes("}}") && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                              Omissão
                            </span>
                          )}
                        <span>
                          {effectiveInverted
                            ? "Verso (Definição)"
                            : "Frente (Pergunta)"}
                        </span>
                      </div>
                      <span className="text-muted-foreground/60 flex items-center gap-1">
                        <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] border border-border">
                          Espaço
                        </kbd>{" "}
                        virar
                      </span>
                    </div>

                    <div className="my-auto py-2 text-center">
                      <div className="text-sm font-semibold text-foreground whitespace-pre-line leading-relaxed">
                        {cards[currentIndex]?.front.startsWith("[V/F]") ? (
                          <div className="flex flex-col gap-4 text-left">
                            <p className="font-semibold text-foreground text-center sm:text-left text-base">
                              {cards[currentIndex]?.front.replace("[V/F] ", "")}
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChoice("Verdadeiro");
                                }}
                                className={cn(
                                  "py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5",
                                  selectedChoice === "Verdadeiro"
                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/30"
                                    : "bg-card/60 border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                )}
                              >
                                Verdadeiro
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChoice("Falso");
                                }}
                                className={cn(
                                  "py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5",
                                  selectedChoice === "Falso"
                                    ? "bg-red-500/20 border-red-500/50 text-red-400 ring-2 ring-red-500/30"
                                    : "bg-card/60 border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                )}
                              >
                                Falso
                              </button>
                            </div>
                          </div>
                        ) : cards[currentIndex]?.front.startsWith("[QUIZ]") ? (
                          <div className="flex flex-col gap-3 text-left">
                            <p className="font-semibold text-foreground text-base leading-snug">
                              {
                                cards[currentIndex]?.front
                                  .replace("[QUIZ] ", "")
                                  .split("\n")[0]
                              }
                            </p>
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {cards[currentIndex]?.front
                                .replace("[QUIZ] ", "")
                                .split("\n")
                                .slice(1)
                                .map((opt) => {
                                  const letter = opt.trim().slice(0, 2); // "A)" ...
                                  const isSelected =
                                    selectedChoice === letter ||
                                    selectedChoice === opt.trim();
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedChoice(letter);
                                      }}
                                      className={cn(
                                        "p-3 rounded-xl border text-xs text-left transition-all cursor-pointer font-medium leading-relaxed",
                                        isSelected
                                          ? "bg-blue-500/20 border-blue-500/50 text-blue-400 ring-2 ring-blue-500/30"
                                          : "bg-card/60 border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        ) : (
                          renderClozeContent(
                            effectiveInverted
                              ? cards[currentIndex]?.back || ""
                              : cards[currentIndex]?.front || "",
                            false,
                          )
                        )}
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-muted-foreground pt-1">
                      Toque fora das opções ou pressione Espaço para revelar
                    </div>
                  </div>

                  {/* Verso do Cartão */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full rounded-2xl border bg-card/95 p-6 sm:p-7 flex flex-col justify-between transition-colors overflow-y-auto",
                      m.borderHover,
                    )}
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                      <span>
                        {effectiveInverted
                          ? "Frente (Termo)"
                          : "Verso (Resposta)"}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Resposta revelada
                      </span>
                    </div>

                    <div className="my-auto py-2 text-center">
                      <div className="text-sm font-semibold text-foreground whitespace-pre-line leading-relaxed">
                        {cards[currentIndex]?.front.startsWith("[V/F]") ? (
                          <div className="flex flex-col gap-3 text-left">
                            {selectedChoice && (
                              <div
                                className={cn(
                                  "p-2.5 rounded-xl border flex items-center justify-between text-xs",
                                  cards[currentIndex]?.back.startsWith(
                                    selectedChoice,
                                  )
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400",
                                )}
                              >
                                <span className="font-semibold">
                                  Sua escolha: {selectedChoice}
                                </span>
                                <span>
                                  {cards[currentIndex]?.back.startsWith(
                                    selectedChoice,
                                  )
                                    ? "✓ Correto"
                                    : "✕ Incorreto"}
                                </span>
                              </div>
                            )}
                            <div className="p-3.5 rounded-xl bg-card/70 border border-border">
                              <span className="text-xs text-muted-foreground block mb-1">
                                Gabarito:
                              </span>
                              <p className="font-semibold text-foreground text-sm">
                                {cards[currentIndex]?.back}
                              </p>
                            </div>
                          </div>
                        ) : cards[currentIndex]?.front.startsWith("[QUIZ]") ? (
                          <div className="flex flex-col gap-3 text-left">
                            {selectedChoice && (
                              <div
                                className={cn(
                                  "p-2.5 rounded-xl border flex items-center justify-between text-xs",
                                  cards[currentIndex]?.back.includes(
                                    `Correta: ${selectedChoice}`,
                                  )
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-400",
                                )}
                              >
                                <span className="font-semibold">
                                  Sua escolha: {selectedChoice}
                                </span>
                                <span>
                                  {cards[currentIndex]?.back.includes(
                                    `Correta: ${selectedChoice}`,
                                  )
                                    ? "✓ Correto"
                                    : "✕ Incorreto"}
                                </span>
                              </div>
                            )}
                            <div className="p-3.5 rounded-xl bg-card/70 border border-border">
                              <span className="text-xs text-muted-foreground block mb-1">
                                Gabarito:
                              </span>
                              <p className="font-semibold text-foreground text-sm">
                                {cards[currentIndex]?.back}
                              </p>
                            </div>
                          </div>
                        ) : cards[currentIndex]?.front.includes("{{") &&
                          cards[currentIndex]?.front.includes("}}") ? (
                          <div className="flex flex-col gap-3 text-left">
                            <div className="p-3.5 rounded-xl bg-card/70 border border-border">
                              <span className="text-xs text-muted-foreground block mb-1.5 font-normal">
                                Frase completa:
                              </span>
                              <div className="leading-relaxed text-sm">
                                {renderClozeContent(
                                  cards[currentIndex]?.front || "",
                                  true,
                                )}
                              </div>
                            </div>
                            {cards[currentIndex]?.back &&
                              cards[currentIndex]?.back !==
                                "Omissão de palavras fixada" && (
                                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground block mb-0.5">
                                    Nota/Dica:
                                  </span>
                                  {cards[currentIndex]?.back}
                                </div>
                              )}
                          </div>
                        ) : (
                          renderClozeContent(
                            effectiveInverted
                              ? cards[currentIndex]?.front || ""
                              : cards[currentIndex]?.back || "",
                            true,
                          )
                        )}
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-muted-foreground pt-1">
                      Avalie sua retenção com as teclas 1, 2, 3 ou 4
                    </div>
                  </div>
                </div>
              </button>

              {/* Campo do Modo Digitação */}
              {studyMode === "type" && (
                <div className="w-full max-w-xl mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        cards[currentIndex]?.front.startsWith("[V/F]")
                          ? "Digite 'V' para Verdadeiro ou 'F' para Falso..."
                          : cards[currentIndex]?.front.startsWith("[QUIZ]")
                            ? "Digite a letra correta (A, B, C ou D)..."
                            : cards[currentIndex]?.front.includes("{{") &&
                                cards[currentIndex]?.front.includes("}}")
                              ? "Digite as palavras omitidas..."
                              : "Digite sua resposta aqui..."
                      }
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isAnswerChecked) {
                          handleVerifyTypedAnswer();
                        }
                      }}
                      disabled={isAnswerChecked}
                      className="flex-1 bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                    />
                    {!isAnswerChecked ? (
                      <button
                        type="button"
                        onClick={handleVerifyTypedAnswer}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
                      >
                        Verificar
                      </button>
                    ) : null}
                  </div>

                  {isAnswerChecked && (
                    <div
                      className={cn(
                        "p-3 rounded-xl border flex flex-col gap-1 text-xs animate-in fade-in duration-200",
                        isExactMatch
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExactMatch ? (
                            <Check className="w-4 h-4 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span className="font-semibold">
                            {isExactMatch
                              ? "Resposta exata! Excelente."
                              : "Resposta diferente."}
                          </span>
                        </div>
                        <span className="text-[11px] opacity-80">
                          Esperado: {typedResult.expectedLabel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botões SRS de Avaliação (4 níveis: Errei, Difícil, Mediano, Fácil) */}
            <div className="grid grid-cols-4 gap-2 shrink-0">
              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(1)}
                className="py-2.5 px-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                title="Atalho: Tecla 1"
              >
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-red-500/20 text-[9px]">1</kbd>
                  Errei
                </span>
                <span className="text-[9px] opacity-75 font-normal">
                  Revisar
                </span>
              </button>

              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(2)}
                className="py-2.5 px-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                title="Atalho: Tecla 2"
              >
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-amber-500/20 text-[9px]">
                    2
                  </kbd>
                  Difícil
                </span>
                <span className="text-[9px] opacity-75 font-normal">1 dia</span>
              </button>

              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(3)}
                className="py-2.5 px-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                title="Atalho: Tecla 3"
              >
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-sky-500/20 text-[9px]">3</kbd>
                  Mediano
                </span>
                <span className="text-[9px] opacity-75 font-normal">
                  3 dias
                </span>
              </button>

              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(4)}
                className="py-2.5 px-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                title="Atalho: Tecla 4"
              >
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-emerald-500/20 text-[9px]">
                    4
                  </kbd>
                  Fácil
                </span>
                <span className="text-[9px] opacity-75 font-normal">
                  7 dias
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
