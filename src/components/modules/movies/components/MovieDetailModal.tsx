"use client";

import {
  Calendar,
  Film,
  Heart,
  Pencil,
  Share2,
  Star,
  StarHalf,
  User,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Movie } from "../types";

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onEdit: (m: Movie) => void;
  onUpdateRating: (id: number, stars: number) => void;
  onGenerateCanvas?: (m: Movie) => void;
}

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
              className={cn(
                "absolute inset-0 w-6 h-6 transition-all",
                isFullActive
                  ? "fill-rose-500 text-rose-500"
                  : "fill-muted-foreground/20 text-muted-foreground/20",
              )}
            />
            {isHalfActive && (
              <StarHalf className="absolute inset-0 w-6 h-6 fill-rose-500 text-rose-500" />
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
        <span className="ml-2 self-center text-xs text-rose-500 font-bold">
          {rating} ★
        </span>
      )}
    </div>
  );
}

export function MovieDetailModal({
  movie,
  onClose,
  onEdit,
  onUpdateRating,
  onGenerateCanvas,
}: MovieDetailModalProps) {
  const color = getModuleColor("movies");
  const theme = getColorTheme(color);
  useEffect(() => {
    if (!movie) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [movie, onClose]);
  if (!movie) return null;

  const isWatched = movie.status === "Watched";

  return (
    <ModalShell isOpen={!!movie} onClose={onClose} size="xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Film className={cn("w-4 h-4", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground line-clamp-1">
              {movie.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isWatched ? "Assistido" : "Na lista"}
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
          {/* Coluna Esquerda: Poster (Menor) */}
          <div className="md:col-span-3 p-6 border-b md:border-b-0 md:border-r border-border/40 flex flex-col items-center gap-6">
            <div className="w-full aspect-2/3 rounded-xl overflow-hidden bg-muted border border-border/50 max-w-[160px]">
              {movie.thumbnail ? (
                <img
                  src={movie.thumbnail}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-10 h-10 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {isWatched && (
              <div className="w-full space-y-2.5 flex flex-col items-center">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Avaliação
                </p>
                <StarPicker
                  rating={movie.stars}
                  onSelect={(n) => movie.id && onUpdateRating(movie.id, n)}
                />
              </div>
            )}
          </div>

          {/* Coluna Direita: Dados, Avaliação e Resenha */}
          <div className="md:col-span-9 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-xl text-foreground leading-tight">
                  {movie.title}
                </h3>
                {movie.director && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5 font-medium">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{movie.director}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.year && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/50 font-medium">
                    <Calendar className="w-3 h-3" />
                    {movie.year}
                  </span>
                )}
                {movie.category && (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/50 font-medium">
                    {movie.category}
                  </span>
                )}
                <span
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-lg font-bold border",
                    isWatched
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-sky-500/10 text-sky-500 border-sky-500/20",
                  )}
                >
                  {isWatched ? "Assistido" : "Quero ver"}
                </span>
                {!!movie.isFavorite && (
                  <span
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold",
                      theme.bg,
                      theme.text,
                      theme.border,
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-3 h-3",
                        theme.text.replace("text-", "fill-"),
                      )}
                    />{" "}
                    Favorito
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 space-y-2.5 border-t border-border/40">
              <p className="text-[11px] font-bold text-muted-foreground">
                Resenha
              </p>
              {movie.review ? (
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                  {movie.review}
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
        {isWatched && onGenerateCanvas && (
          <button
            type="button"
            onClick={() => onGenerateCanvas(movie)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Gerar story
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onEdit(movie);
            onClose();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer active:scale-95",
            theme.solid,
            theme.solidHover,
          )}
        >
          <Pencil className="w-4 h-4" />
          Editar obra
        </button>
      </div>
    </ModalShell>
  );
}
