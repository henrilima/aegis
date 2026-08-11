"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Edit2,
  FolderInput,
  GripVertical,
  MoreVertical,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { getSystemIcon } from "@/components/global/IconSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Flashcard, FlashcardDeck } from "../types";

const getGroupHoverTextClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "group-hover:text-blue-400",
    sky: "group-hover:text-sky-400",
    cyan: "group-hover:text-cyan-400",
    indigo: "group-hover:text-indigo-400",
    violet: "group-hover:text-violet-400",
    purple: "group-hover:text-purple-400",
    fuchsia: "group-hover:text-fuchsia-400",
    pink: "group-hover:text-pink-400",
    rose: "group-hover:text-rose-400",
    red: "group-hover:text-red-400",
    orange: "group-hover:text-orange-400",
    amber: "group-hover:text-amber-400",
    yellow: "group-hover:text-yellow-400",
    lime: "group-hover:text-lime-400",
    green: "group-hover:text-green-400",
    emerald: "group-hover:text-emerald-400",
    teal: "group-hover:text-teal-400",
    slate: "group-hover:text-slate-400",
    zinc: "group-hover:text-zinc-400",
    neutral: "group-hover:text-neutral-400",
    stone: "group-hover:text-stone-400",
    coffee: "group-hover:text-amber-800",
    carbon: "group-hover:text-zinc-400",
  };
  return map[color] || "group-hover:text-blue-400";
};

// Helper para determinar se um cartão está devido
function isCardDue(card: Flashcard): boolean {
  if (!card.lastReviewed) return true;
  const lastDate = new Date(card.lastReviewed);
  const nowDate = new Date();
  const diffTime = Math.abs(nowDate.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dueDays = Math.round(
    1 +
      card.successCount *
        2 *
        (card.successCount / Math.max(1, card.reviewCount)),
  );
  return diffDays >= dueDays;
}

interface DraggableDeckCardProps {
  deck: FlashcardDeck & { cards: Flashcard[] };
  onStudy: () => void;
  onManageCards: () => void;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DraggableDeckCard({
  deck,
  onStudy,
  onManageCards,
  onMove,
  onEdit,
  onDelete,
}: DraggableDeckCardProps) {
  const deckId = deck.id ?? 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `deck-${deckId}`,
      data: { deckId },
    });

  const dragStyle = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 1,
      }
    : undefined;

  const mDeck = getColorTheme(deck.color || getModuleColor("flashcards"));
  const totalCards = deck.cards.length;

  let totalReviews = 0;
  let totalSuccess = 0;
  for (const card of deck.cards) {
    totalReviews += card.reviewCount;
    totalSuccess += card.successCount;
  }
  const accuracy =
    totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 0;

  const dueCardsCount = deck.cards.filter(isCardDue).length;
  const DeckIcon = getSystemIcon(deck.icon);

  return (
    <div ref={setNodeRef} style={dragStyle} {...attributes} {...listeners}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative rounded-2xl border border-border bg-card hover:border-border/80 p-5 flex flex-col gap-4 transition-all duration-300 group cursor-grab active:cursor-grabbing",
          isDragging && "opacity-40 border-blue-500 ring-2 ring-blue-500/30",
        )}
      >
        {/* Background icon marca d'água */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <DeckIcon
            className={cn(
              "absolute -bottom-6 -right-6 w-24 h-24 opacity-[0.15] dark:opacity-[0.24] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.22] dark:group-hover:opacity-[0.32] rotate-12",
              mDeck.text,
            )}
          />
        </div>

        {/* Título do baralho, grip e ações */}
        <div className="flex justify-between items-start relative z-10">
          <div className="min-w-0 flex-1 flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0 group-hover:text-muted-foreground transition-colors" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "font-bold text-base text-foreground truncate transition-colors",
                    getGroupHoverTextClass(
                      deck.color || getModuleColor("flashcards"),
                    ),
                  )}
                >
                  {deck.name}
                </h3>
                {dueCardsCount > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0",
                      mDeck.bg,
                      mDeck.text,
                    )}
                  >
                    {dueCardsCount} hoje
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium line-clamp-2 mt-1 min-h-8 leading-relaxed">
                {deck.description || "Sem descrição disponível."}
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-2 relative z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44 bg-card border border-border rounded-xl p-1.5 text-foreground z-50">
                <DropdownMenuItem
                  disabled={totalCards === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudy();
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-muted/50",
                    totalCards === 0 &&
                      "opacity-40 cursor-not-allowed text-muted-foreground",
                  )}
                >
                  <Play className="w-3.5 h-3.5 text-muted-foreground" />
                  Estudar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageCards();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-muted/50 text-foreground"
                >
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  Gerenciar cartões
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-muted/50 text-foreground"
                >
                  <FolderInput className="w-3.5 h-3.5 text-muted-foreground" />
                  Mover para pasta
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40 my-1 mx-1" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors hover:bg-muted/50 text-foreground"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Editar baralho
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-red-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Estatísticas do baralho */}
        <div className="grid grid-cols-2 gap-3 bg-background/50 border border-border/50 rounded-xl p-3 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground">
              Cartões
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5">
              {totalCards}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground">
              Aproveitamento
            </span>
            <span
              className={`text-sm font-bold mt-0.5 ${totalReviews > 0 ? "text-emerald-400" : "text-muted-foreground"}`}
            >
              {totalReviews > 0 ? `${accuracy}%` : "—"}
            </span>
          </div>
        </div>

        {/* Ações principais */}
        <div className="flex gap-2.5 mt-auto relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageCards();
            }}
            className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Gerenciar
          </button>
          <button
            type="button"
            disabled={totalCards === 0}
            onClick={(e) => {
              e.stopPropagation();
              onStudy();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-white ${
              totalCards === 0
                ? "bg-muted text-muted-foreground border border-border/30 opacity-50 cursor-not-allowed"
                : `${mDeck.solid} ${mDeck.solidHover}`
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Estudar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
