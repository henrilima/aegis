"use client";

import { Brain } from "lucide-react";
import type {
  Flashcard,
  FlashcardDeck,
} from "@/components/modules/flashcards/types";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BaseWidget } from "../BaseWidget";

interface RichDeck extends FlashcardDeck {
  cards: Flashcard[];
}

interface FlashcardsWidgetProps {
  decks: RichDeck[];
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

// Determina se um cartão está devido para revisão (replica o algoritmo do módulo)
function isCardDue(card: Flashcard): boolean {
  if (!card.lastReviewed) return true;
  const diffDays = Math.floor(
    Math.abs(Date.now() - new Date(card.lastReviewed).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const dueDays = Math.round(
    1 +
      card.successCount *
        2 *
        (card.successCount / Math.max(1, card.reviewCount)),
  );
  return diffDays >= dueDays;
}

/**
 * Widget de Flashcards para a dashboard — exibe estatísticas de cartões e baralhos
 */
export function FlashcardsWidget({
  decks,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: FlashcardsWidgetProps) {
  const color = getModuleColor("flashcards");
  const theme = getColorTheme(color);

  // Fallback para evitar crash enquanto os dados carregam
  const safeDecks = decks ?? [];
  const allCards = safeDecks.flatMap((d) => d.cards);
  const totalCards = allCards.length;
  const totalDecks = decks.length;

  // Cartões devidos hoje (para revisão)
  const dueCards = allCards.filter(isCardDue).length;

  // Taxa de acerto global
  const totalReviews = allCards.reduce((a, c) => a + c.reviewCount, 0);
  const totalSuccess = allCards.reduce((a, c) => a + c.successCount, 0);
  const accuracy =
    totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 0;

  // Baralhos com cartões devidos
  const decksWithDue = decks.filter((d) => d.cards.some(isCardDue));

  return (
    <BaseWidget
      title="Flashcards"
      icon={Brain}
      color={color}
      route="flashcards"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="flex flex-col gap-[4cqw] @sm:gap-4">
        {/* KPIs principais */}
        <div className="flex items-center gap-[6cqw] @sm:gap-6">
          <div className="flex-1 text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {dueCards}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">
              Para revisar
            </p>
          </div>
          <div className="w-px h-8 bg-muted" />
          <div className="flex-1 text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {totalCards}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">
              Cartões
            </p>
          </div>
          <div className="w-px h-8 bg-muted" />
          <div className="flex-1 text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {accuracy > 0 ? `${accuracy}%` : "-"}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1">
              Acertos
            </p>
          </div>
        </div>

        {/* Baralhos com revisões pendentes */}
        {decksWithDue.length > 0 ? (
          <div className="flex flex-col gap-2">
            {decksWithDue.slice(0, 3).map((deck) => {
              const due = deck.cards.filter(isCardDue).length;
              const total = deck.cards.length;
              const _pct = total > 0 ? Math.round((due / total) * 100) : 0;

              // Cor personalizada do baralho
              const deckColor = getColorTheme(deck.color || color);

              return (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "shrink-0 w-2 h-2 rounded-full",
                        deckColor.solid,
                      )}
                    />
                    <span className="text-xs font-bold text-foreground truncate">
                      {deck.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                      due > 0
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                    )}
                  >
                    <span>{due > 0 ? `${due} pendentes` : "Em dia"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : totalDecks === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/10">
            <Brain className="w-5 h-5 text-muted-foreground/30 mb-1.5 stroke-[1.5]" />
            <p className="text-[11px] font-medium text-muted-foreground/60">
              Nenhum baralho criado
            </p>
          </div>
        ) : (
          // Sem pendências
          <div className="flex items-center justify-center py-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-[11px] font-bold text-emerald-500">
              Tudo em dia! {totalCards} cartões revisados.
            </p>
          </div>
        )}

        {/* Barra de progresso: cartões devidos vs total */}
        {totalCards > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">
                <span className={theme.text}>{totalCards - dueCards}</span> de{" "}
                <span className={theme.text}>{totalCards} em dia</span>
              </span>
              <span className={theme.text}>
                {Math.round(((totalCards - dueCards) / totalCards) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  dueCards === 0 ? "bg-emerald-500" : theme.solid,
                )}
                style={{
                  width: `${Math.round(((totalCards - dueCards) / totalCards) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
