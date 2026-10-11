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
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs text-foreground font-bold">Sem filmes</p>
          <p className="text-[10px] text-muted-foreground font-medium max-w-45 mt-0.5">
            Adicione filmes e séries que deseja assistir ou já assistiu para
            acompanhá-los aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentWatched.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground px-1 pb-1">
                Vistos recentemente
              </p>
              <div className="divide-y divide-border/30">
                {recentWatched.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between py-2 px-2 rounded-xl transition-colors hover:bg-muted/40 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-9 rounded-lg overflow-hidden bg-muted border border-border/40 shrink-0">
                        {movie.thumbnail ? (
                          <img
                            src={movie.thumbnail}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-500">
                            <Film className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                        <span className="text-xs font-bold text-foreground truncate">
                          {movie.title}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Filme assistido
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.2 rounded-full border text-[9px] font-bold shrink-0 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                        <Star className="w-2.5 h-2.5 fill-current text-rose-500" />
                        <span>{movie.stars}</span>
                      </div>
                      {movie.isFavorite && (
                        <span className="text-[10px] font-bold text-rose-500">
                          Favorito
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {wishlist.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <p className="text-[10px] font-bold text-muted-foreground px-1">
                Na lista para ver
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar px-1">
                {wishlist.map((movie) => (
                  <div key={movie.id} className="w-12 shrink-0 space-y-1 group">
                    <div className="aspect-2/3 rounded-lg overflow-hidden bg-muted border border-border/40">
                      {movie.thumbnail ? (
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-3.5 h-3.5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] font-medium truncate text-left">
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
