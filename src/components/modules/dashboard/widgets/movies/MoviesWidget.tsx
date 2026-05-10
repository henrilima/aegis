"use client";

import { Film, Heart, Star } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
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
  const theme = getColorTheme(color);

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
        <div className="flex flex-col items-center justify-center h-full py-6 text-center">
          <Film className="w-8 h-8 text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">
            Nenhum filme adicionado.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentWatched.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground">
                Vistos recentemente
              </p>
              <div className="space-y-1.5">
                {recentWatched.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-2 group cursor-default"
                  >
                    <div className="w-8 h-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                      {movie.thumbnail ? (
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-3 h-3 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none">
                        {movie.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star
                          className={cn("w-2.5 h-2.5 fill-current", theme.text)}
                        />
                        <span
                          className={cn("text-[10px] font-bold", theme.text)}
                        >
                          {movie.stars}
                        </span>
                      </div>
                    </div>
                    {movie.isFavorite && (
                      <Heart
                        className={cn("w-3 h-3 fill-current", theme.text)}
                      />
                    )}
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
                    <p className="text-[8px] font-medium truncate text-center">
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
