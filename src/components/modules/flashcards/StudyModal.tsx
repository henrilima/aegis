"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  AlertCircle,
  Award,
  Clock,
  Flame,
  RefreshCcw,
  RotateCcw,
  Smile,
  X,
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

export type StudyMode = "standard" | "inverted" | "sprint";

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

    // Aplicar filtro de foco em erros/críticos se ativado
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
    setIsFlipped(false);
    setIsFinished(false);
    setTimeLeft(60);
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
      await invoke("flashcards_record_review", {
        id: currentCard.id,
        success,
        reviewedAt: new Date().toISOString(),
      });

      if (success) {
        setCorrectCount((prev) => prev + 1);
      }

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
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
            {studyMode === "sprint"
              ? "Modo Sprint — 60 Segundos"
              : studyMode === "inverted"
                ? "Modo Invertido (Verso → Frente)"
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
          <div className="grow flex flex-col gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-foreground">
                Modo e Configurações de Estudo
              </h3>
              <p className="text-xs text-muted-foreground">
                Escolha o modo de jogo e personalize a ordem antes de começar
              </p>
            </div>

            {/* Modo de Estudo */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Modo de estudo
              </span>
              <div className="grid grid-cols-3 gap-2 bg-background p-1.5 rounded-xl border border-border">
                {[
                  {
                    key: "standard" as const,
                    label: "Tradicional",
                    desc: "Frente → Verso",
                    icon: Zap,
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
          <div className="grow flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-6">
              <div className="p-6 rounded-2xl bg-card/40 border border-border">
                {studyMode === "sprint" ? (
                  <Clock className="w-14 h-14 text-blue-400 animate-bounce" />
                ) : successRate >= 60 ? (
                  <Award className={`w-14 h-14 ${m.text}`} />
                ) : (
                  <Smile className="w-14 h-14 text-yellow-500/80" />
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground">
              {studyMode === "sprint"
                ? "Tempo Esgotado / Sprint Concluído!"
                : "Estudo Concluído!"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
              {studyMode === "sprint"
                ? `Você respondeu ${correctCount} cartões corretamente em 60 segundos!`
                : "Você concluiu a revisão de todos os cartões agendados."}
            </p>

            <div className="w-full max-w-xs bg-card/30 border border-border rounded-2xl p-6 flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Cartões revisados</span>
                <span className="text-foreground">{currentIndex + 1}</span>
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
                <span>Taxa de precisão</span>
                <span
                  className={`font-bold ${successRate >= 60 ? "text-emerald-400" : "text-yellow-500"}`}
                >
                  {successRate}%
                </span>
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground max-w-xs leading-relaxed italic mb-8">
              &quot;{getMotivationalMessage(successRate)}&quot;
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
          <div className="flex-1 flex flex-col gap-6 select-none animate-in fade-in duration-300">
            {/* Header de Progresso & Cronômetro Sprint */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                {studyMode === "sprint" ? (
                  <span className="text-blue-400 flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3 animate-spin" /> Tempo restante:{" "}
                    {timeLeft}s
                  </span>
                ) : (
                  <span>Progresso</span>
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
                  {/* Frente do Cartão */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full rounded-2xl border bg-card/90 p-8 flex flex-col justify-between transition-colors",
                      m.borderHover,
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                      <span>
                        {studyMode === "inverted"
                          ? "Verso (Definição)"
                          : "Frente"}
                      </span>
                      <span className="text-muted-foreground/60">
                        Clique para virar
                      </span>
                    </div>
                    <div className="my-auto text-center">
                      <p className="text-base font-semibold text-foreground whitespace-pre-line leading-relaxed">
                        {studyMode === "inverted"
                          ? cards[currentIndex]?.back
                          : cards[currentIndex]?.front}
                      </p>
                    </div>
                    <div className="text-center text-[10px] text-muted-foreground">
                      Toque no cartão para revelar a{" "}
                      {studyMode === "inverted" ? "pergunta" : "resposta"}
                    </div>
                  </div>

                  {/* Verso do Cartão */}
                  <div
                    className={cn(
                      "absolute inset-0 w-full h-full rounded-2xl border bg-card/90 p-8 flex flex-col justify-between transition-colors",
                      m.borderHover,
                    )}
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                      <span>
                        {studyMode === "inverted" ? "Frente (Termo)" : "Verso"}
                      </span>
                      <span className="text-muted-foreground/60">
                        Responda abaixo
                      </span>
                    </div>
                    <div className="my-auto text-center">
                      <p className="text-base font-semibold text-foreground whitespace-pre-line leading-relaxed">
                        {studyMode === "inverted"
                          ? cards[currentIndex]?.front
                          : cards[currentIndex]?.back}
                      </p>
                    </div>
                    <div className="text-center text-[10px] text-muted-foreground">
                      Avalie sua lembrança para registrar no sistema
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Botoes de Ação / Resposta */}
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(false)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                Errei
              </button>
              <button
                type="button"
                disabled={!isFlipped}
                onClick={() => handleAnswer(true)}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              >
                Acertei
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
