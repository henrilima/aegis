"use client";

import { BookOpen, Heart, Pencil, Star, StarHalf, User, X } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook } from "../types";
import { calculateProgress } from "../utils";

interface BookDetailModalProps {
  book: ReadingBook | null;
  onClose: () => void;
  onEdit: (b: ReadingBook) => void;
  onUpdateRating: (id: number, stars: number) => void;
}

const STATUS_LABEL: Record<string, string> = {
  Reading: "Lendo",
  Completed: "Lido",
  WantToRead: "Quero ler",
  Dropped: "Interrompido",
};

const colorName = getModuleColor("reading");
const themeStyles = getColorTheme(colorName);

const STATUS_COLOR: Record<string, string> = {
  Reading: cn(themeStyles.bg, themeStyles.text, themeStyles.border),
  Completed:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  WantToRead: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  Dropped: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

function StarPicker({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (n: number) => void;
}) {
  return (
    <div className="flex gap-1 py-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const isFullActive = rating >= n;
        const isHalfActive = rating >= n - 0.5 && rating < n;
        return (
          <div key={n} className="relative w-6 h-6 cursor-pointer group">
            <Star
              fill="currentColor"
              className={cn(
                "absolute inset-0 w-6 h-6 transition-all",
                isFullActive ? themeStyles.text : "text-muted-foreground/20",
              )}
            />
            {isHalfActive && (
              <StarHalf
                fill="currentColor"
                className={cn("absolute inset-0 w-6 h-6", themeStyles.text)}
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(rating === n - 0.5 ? 0 : n - 0.5)}
              className="absolute left-0 top-0 w-1/2 h-full z-10"
            />
            <button
              type="button"
              onClick={() => onSelect(rating === n ? 0 : n)}
              className="absolute right-0 top-0 w-1/2 h-full z-10"
            />
          </div>
        );
      })}
      {rating > 0 && (
        <span
          className={cn("ml-2 self-center text-xs font-bold", themeStyles.text)}
        >
          {rating} ★
        </span>
      )}
    </div>
  );
}

export function BookDetailModal({
  book,
  onClose,
  onEdit,
  onUpdateRating,
}: BookDetailModalProps) {
  if (!book) return null;
  const progress = calculateProgress(book.currentPage, book.totalPages);
  const isReadingOrCompleted =
    book.status === "Reading" || book.status === "Completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-background border border-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl border",
                themeStyles.bg,
                themeStyles.border,
              )}
            >
              <BookOpen className={cn("w-4 h-4", themeStyles.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground line-clamp-1">
                {book.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {STATUS_LABEL[book.status] ?? book.status}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Coluna Esquerda: Capa (Menor) e Progresso */}
            <div className="md:col-span-3 p-6 border-b md:border-b-0 md:border-r border-border/40 space-y-6 flex flex-col items-center">
              <div className="w-full aspect-2/3 rounded-xl overflow-hidden bg-muted border border-border/50 max-w-[160px]">
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              {/* Progresso e Páginas - Agora apenas isso aqui na esquerda */}
              {isReadingOrCompleted && (
                <div className="w-full bg-muted/30 p-4 rounded-xl border border-border/50 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground">
                        Progresso
                      </p>
                      <p className="text-xs font-bold text-foreground">
                        {book.currentPage}{" "}
                        <span className="text-muted-foreground font-medium">
                          / {book.totalPages} pág.
                        </span>
                      </p>
                    </div>
                    <span
                      className={cn("font-black text-xs", themeStyles.text)}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        book.status === "Completed"
                          ? "bg-emerald-500"
                          : themeStyles.solid,
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita: Dados, Avaliação e Resenha */}
            <div className="md:col-span-9 p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xl text-foreground leading-tight">
                    {book.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5 font-medium">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{book.author}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {book.category && book.category !== "Geral" && (
                    <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/50 font-bold">
                      {book.category}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-lg font-bold border",
                      STATUS_COLOR[book.status] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[book.status] ?? book.status}
                  </span>
                  {!!book.isFavorite && (
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1.5 font-bold">
                      <Heart className="w-3 h-3 fill-rose-500" /> Favorito
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Avaliação
                </p>
                <StarPicker
                  rating={book.stars}
                  onSelect={(n) => book.id && onUpdateRating(book.id, n)}
                />
              </div>

              <div className="pt-2 space-y-2.5 border-t border-border/40">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Resenha
                </p>
                {book.review ? (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                    {book.review}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic font-medium">
                    Nenhuma resenha escrita ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-border/50 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 transition-all cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit(book);
              onClose();
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer active:scale-95",
              themeStyles.solid,
              themeStyles.solidHover,
            )}
          >
            <Pencil className="w-4 h-4" />
            Editar obra
          </button>
        </div>
      </div>
    </div>
  );
}
