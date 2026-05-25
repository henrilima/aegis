"use client";

import { Film, Star } from "lucide-react";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Movie } from "../../../movies/types";
import { BaseWidget } from "../BaseWidget";

interface MoviesWidgetProps {
  movies: Movie[];
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function MoviesWidget({
  movies,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: MoviesWidgetProps) {
  const color = getModuleColor("movies");
  const _theme = getColorTheme(color);

  const recentWatched = movies
    .filter((m) => m.status === "Watched")
    .slice(0, 3);

  const wishlist = movies.filter((m) => m.status === "WantToWatch").slice(0, 3);

  const hasData = recentWatched.length > 0 || wishlist.length > 0;

  return (
    <BaseWidget
      title="Cinema"
      icon={Film}
      color={color}
      route="movies"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      {!hasData ? (
        <div className="flex flex-col items-start justify-center h-full py-6">
          <Film className="w-8 h-8 text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhum filme adicionado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentWatched.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground px-1">
                Vistos recentemente
              </p>
              <div className="space-y-1.5">
                {recentWatched.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 shrink-0">
                        {movie.thumbnail ? (
                          <img
                            src={movie.thumbnail}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-500">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">
                          {movie.title}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                          Filme Assistido
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-rose-600 dark:text-rose-500 fill-rose-600 dark:fill-rose-500" />
                        <span className="text-xs font-bold leading-none text-rose-600 dark:text-rose-450">
                          {movie.stars}
                        </span>
                      </div>
                      {movie.isFavorite ? (
                        <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-500 block mt-1">
                          Favorito
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
                          Avaliado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wishlist.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground">
                Na lista para ver
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {wishlist.map((movie) => (
                  <div key={movie.id} className="w-12 shrink-0 space-y-1 group">
                    <div className="aspect-2/3 rounded-md overflow-hidden bg-muted border border-border/50">
                      {movie.thumbnail ? (
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-4 h-4 text-muted-foreground/20" />
                        </div>
                      )}
                    </div>
                    <p className="text-[8px] font-medium truncate text-left">
                      {movie.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
