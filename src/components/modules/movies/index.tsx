"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Bookmark,
  BookmarkCheck,
  Film,
  Heart,
  HelpCircle,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Star,
  StarHalf,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { MovieCanvasModal } from "./components/MovieCanvasModal";
import { MovieDetailModal } from "./components/MovieDetailModal";
import { MovieFormModal } from "./components/MovieFormModal";
import { MovieSearchModal } from "./components/MovieSearchModal";
import { MoviesGuidePanel } from "./components/MoviesInfoModal";
import type { Movie, MovieTabId } from "./types";

export default function MoviesPage() {
  const { user } = useAuth();
  const { setSettingsOpen } = useNavigation();
  const color = getModuleColor("movies");
  const _theme = getColorTheme(color);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MovieTabId>("all");
  const [preGuideTab, setPreGuideTab] = useState<MovieTabId>("all");
  const [search, setSearch] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<
    Partial<Movie> | undefined
  >();
  const [movieToDelete, setMovieToDelete] = useState<number | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);

  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  const [canvasMovie, setCanvasMovie] = useState<Movie | null>(null);

  const uid = user ? String(user.id) : "";

  const fetchMovies = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const data = await invoke<Movie[]>("movies_list", { userId: uid });
      setMovies(data);
    } catch {
      toast.error("Erro ao carregar catálogo de filmes");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSaveMovie = async (movie: Movie) => {
    try {
      await invoke("movies_upsert", { movie: { ...movie, userId: uid } });
      toast.success(movie.id ? "Filme atualizado!" : "Filme adicionado!");
      setIsFormModalOpen(false);
      setIsSearchModalOpen(false);
      fetchMovies();
    } catch {
      toast.error("Erro ao salvar filme");
    }
  };

  const handleDeleteMovie = async () => {
    if (movieToDelete === null) return;
    try {
      await invoke("movies_delete", { id: movieToDelete, userId: uid });
      toast.success("Filme removido");
      setMovieToDelete(null);
      fetchMovies();
    } catch {
      toast.error("Erro ao remover filme");
    }
  };

  const counts = useMemo(
    () => ({
      all: movies.length,
      watched: movies.filter((m) => m.status === "Watched").length,
      wishlist: movies.filter((m) => m.status === "WantToWatch").length,
      favorites: movies.filter((m) => m.isFavorite).length,
    }),
    [movies],
  );

  const handleToggleFavorite = async (movie: Movie) => {
    try {
      await invoke("movies_toggle_favorite", {
        id: movie.id,
        userId: uid,
        isFavorite: !movie.isFavorite,
      });
      fetchMovies();
    } catch {
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleUpdateRating = async (id: number, stars: number) => {
    try {
      const movie = movies.find((m) => m.id === id);
      if (!movie) return;
      await invoke("movies_upsert", {
        movie: { ...movie, stars, userId: uid },
      });
      fetchMovies();
      // Atualiza o estado do filme detalhado se ele estiver aberto
      setDetailMovie((prev) => (prev ? { ...prev, stars } : null));
    } catch {
      toast.error("Erro ao atualizar nota");
    }
  };

  const filteredMovies = useMemo(() => {
    const q = search.toLowerCase();

    // Filtra primeiro pela aba ativa
    const byTab =
      activeTab === "wishlist"
        ? movies.filter((m) => m.status === "WantToWatch")
        : activeTab === "library"
          ? movies.filter((m) => m.status === "Watched")
          : activeTab === "favorites"
            ? movies.filter((m) => m.isFavorite)
            : movies; // "all": wishlist first, then watched
    const sorted =
      activeTab === "all"
        ? [
            ...byTab.filter((m) => m.status === "WantToWatch"),
            ...byTab.filter((m) => m.status === "Watched"),
          ]
        : byTab;

    // Depois filtra pela busca
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.director ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q) ||
        String(m.year ?? "").includes(q),
    );
  }, [movies, activeTab, search]);

  const TABS = [
    {
      id: "all" as MovieTabId,
      label: "Todos",
      count: counts.all,
      icon: LayoutGrid,
    },
    {
      id: "wishlist" as MovieTabId,
      label: "Quero assistir",
      count: counts.wishlist,
      icon: Bookmark,
    },
    {
      id: "library" as MovieTabId,
      label: "Assistidos",
      count: counts.watched,
      icon: BookmarkCheck,
    },
    {
      id: "favorites" as MovieTabId,
      label: "Favoritos",
      count: counts.favorites,
      icon: Heart,
    },
  ];

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-5 pb-12">
        <CardSkeletonGrid count={6} poster />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 pb-12 text-foreground">
      <ModuleHeader
        moduleId="movies"
        color={getModuleColor("movies")}
        title="Filmes"
        subtitle={`${counts.watched} assistidos · ${counts.wishlist} na lista`}
        icon={Film}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as MovieTabId)}
        onTitleClick={() => {
          if (activeTab !== "guia") {
            setPreGuideTab(activeTab);
            setActiveTab("guia");
          }
        }}
        titleHoverIcon={HelpCircle}
        titleTooltip="Visualizar Guia de Filmes"
        searchValue={activeTab !== "guia" ? search : undefined}
        onSearchChange={activeTab !== "guia" ? setSearch : undefined}
        searchPlaceholder="Buscar por título, diretor, gênero ou ano..."
        actions={[
          {
            id: "add",
            label: "Adicionar",
            icon: Plus,
            tooltip: "Adicionar manualmente",
            onClick: () => {
              setSelectedMovie(undefined);
              setIsFormModalOpen(true);
            },
          },
          {
            id: "search",
            label: "Buscar online",
            icon: Search,
            tooltip: "Buscar filme online (TMDB)",
            primary: true,
            onClick: () => setIsSearchModalOpen(true),
          },
        ]}
      />

      {/* Content */}
      {activeTab === "guia" ? (
        <MoviesGuidePanel onBack={() => setActiveTab(preGuideTab)} />
      ) : filteredMovies.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-10 grayscale">
          <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mb-4">
            <Film className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {search ? "Nenhum resultado" : "Catálogo vazio"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {search
              ? "Nenhum filme corresponde à sua busca."
              : activeTab === "library"
                ? "Marque filmes como assistidos para vê-los aqui."
                : activeTab === "wishlist"
                  ? "Adicione filmes à sua lista."
                  : "Busque ou adicione um filme para começar."}
          </p>
        </div>
      ) : (
        <>
          {/* Seções separadoras apenas na aba "Tudo" quando ambos os grupos existem */}
          {activeTab === "all" && counts.wishlist > 0 && counts.watched > 0 ? (
            <div className="space-y-6">
              <MovieSection
                title={`Quero assistir · ${filteredMovies.filter((m) => m.status === "WantToWatch").length}`}
                movies={filteredMovies.filter(
                  (m) => m.status === "WantToWatch",
                )}
                onView={setDetailMovie}
                onEdit={(movie) => {
                  setSelectedMovie(movie);
                  setIsFormModalOpen(true);
                }}
                onDelete={(id) => setMovieToDelete(id)}
                onToggleFavorite={handleToggleFavorite}
              />
              {filteredMovies.filter((m) => m.status === "Watched").length >
                0 && (
                <>
                  <div className="border-t border-border/50" />
                  <MovieSection
                    title={`Assistidos · ${filteredMovies.filter((m) => m.status === "Watched").length}`}
                    movies={filteredMovies.filter(
                      (m) => m.status === "Watched",
                    )}
                    onView={setDetailMovie}
                    onEdit={(movie) => {
                      setSelectedMovie(movie);
                      setIsFormModalOpen(true);
                    }}
                    onDelete={(id) => setMovieToDelete(id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </>
              )}
            </div>
          ) : (
            <MovieGrid
              movies={filteredMovies}
              onView={setDetailMovie}
              onEdit={(movie) => {
                setSelectedMovie(movie);
                setIsFormModalOpen(true);
              }}
              onDelete={(id) => setMovieToDelete(id)}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </>
      )}

      {/* Modals */}
      <MovieSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(movie) => {
          setSelectedMovie(movie);
          setIsFormModalOpen(true);
        }}
        onOpenSettings={() => {
          setIsSearchModalOpen(false);
          setSettingsOpen(true);
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("open-settings-tab", { detail: "integrations" }),
            );
          }, 300);
        }}
      />

      <MovieFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedMovie(undefined);
        }}
        movie={selectedMovie}
        onSave={handleSaveMovie}
      />

      <MovieDetailModal
        movie={detailMovie}
        onClose={() => setDetailMovie(null)}
        onEdit={(movie) => {
          setDetailMovie(null);
          setSelectedMovie(movie);
          setIsFormModalOpen(true);
        }}
        onUpdateRating={handleUpdateRating}
        onGenerateCanvas={(movie) => {
          setDetailMovie(null);
          setCanvasMovie(movie);
          setIsCanvasModalOpen(true);
        }}
      />

      <MovieCanvasModal
        isOpen={isCanvasModalOpen}
        onClose={() => {
          setIsCanvasModalOpen(false);
          setCanvasMovie(null);
        }}
        movie={canvasMovie}
      />

      {movieToDelete !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteHabit}
          title="Remover filme"
          description="Tem certeza que deseja remover este filme? Esta ação não pode ser desfeita."
          onConfirm={handleDeleteMovie}
          onCancel={() => setMovieToDelete(null)}
        />
      )}
    </div>
  );
}

// Seção com etiqueta (usada na aba "Tudo")
function MovieSection({
  title,
  movies,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  title: string;
  movies: Movie[];
  onView: (m: Movie) => void;
  onEdit: (m: Movie) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (m: Movie) => void;
}) {
  if (movies.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <MovieGrid
        movies={movies}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}

// Grid
function MovieGrid({
  movies,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  movies: Movie[];
  onView: (m: Movie) => void;
  onEdit: (m: Movie) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (m: Movie) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

// Card
function MovieCard({
  movie,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  movie: Movie;
  onView: (m: Movie) => void;
  onEdit: (m: Movie) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (m: Movie) => void;
}) {
  const theme = getColorTheme(getModuleColor("movies"));
  const isWatched = movie.status === "Watched";
  const isFav = !!movie.isFavorite;

  return (
    // biome-ignore lint/a11y/useSemanticElements: Card has nested action buttons
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex flex-row bg-card border border-border rounded-xl overflow-hidden transition-all cursor-pointer h-37.5",
        theme.borderHover,
      )}
      onClick={() => onView(movie)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(movie);
        }
      }}
    >
      {/* Poster */}
      <div className="w-25 shrink-0 relative overflow-hidden bg-muted border-r border-border/50">
        {movie.thumbnail ? (
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Overlay de ações no poster */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(movie);
            }}
            className={cn(
              "w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer",
              theme.solidHover,
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (movie.id) onDelete(movie.id);
            }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3.5 flex flex-col min-w-0 relative">
        <div className="flex justify-between items-start gap-2">
          <h3
            className={cn(
              "font-bold text-sm text-foreground line-clamp-1 leading-snug transition-colors flex-1",
              theme.textDarkHover,
            )}
          >
            {movie.title}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(movie);
            }}
            className={cn(
              "shrink-0 transition-all cursor-pointer",
              isFav
                ? theme.text
                : cn("text-muted-foreground/30", theme.textDarkHover),
            )}
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold mt-1">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded bg-muted border border-border/50",
              isWatched ? cn(theme.text, theme.border, theme.bg) : "",
            )}
          >
            {isWatched ? "Assistido" : "Na lista"}
          </span>
          {movie.year && <span>{movie.year}</span>}
          {movie.category && (
            <span className="truncate max-w-25">{movie.category}</span>
          )}
        </div>

        {movie.review ? (
          <p className="mt-2 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
            {movie.review}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground/30 italic">
            Sem resenha ainda...
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          {isWatched && movie.stars > 0 ? (
            <StarRow rating={movie.stars} theme={theme} />
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

// Star display
function StarRow({
  rating,
  theme,
}: {
  rating: number;
  theme: ReturnType<typeof getColorTheme>;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        if (n <= full)
          return (
            <Star key={n} className={cn("w-3 h-3 fill-current", theme.text)} />
          );
        if (n === full + 1 && hasHalf)
          return (
            <StarHalf
              key={n}
              className={cn("w-3 h-3 fill-current", theme.text)}
            />
          );
        return (
          <Star
            key={n}
            className="w-3 h-3 fill-muted-foreground/20 text-muted-foreground/20"
          />
        );
      })}
    </div>
  );
}
