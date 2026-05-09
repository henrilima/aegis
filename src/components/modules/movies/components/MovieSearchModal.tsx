"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Film,
  Key,
  Loader2,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Movie } from "../types";

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (movie: Partial<Movie>) => void;
  onOpenSettings?: () => void;
}

interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
const TMDB_IMG_FULL = "https://image.tmdb.org/t/p/w500";

export function MovieSearchModal({
  isOpen,
  onClose,
  onSelect,
  onOpenSettings,
}: MovieSearchModalProps) {
  const theme = getColorTheme(getModuleColor("movies"));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [searched, setSearched] = useState(false);
  const [hasTmdbKey, setHasTmdbKey] = useState<boolean | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Foca o campo de busca ao abrir o modal (se a chave estiver ok)
  useEffect(() => {
    if (isOpen && hasTmdbKey === true && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, hasTmdbKey]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setSearched(false);
    invoke<string>("get_tmdb_api_key")
      .then((key) => setHasTmdbKey(!!key))
      .catch(() => setHasTmdbKey(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    setResults([]);

    try {
      const raw = await invoke<{
        source: string;
        data: { results: TmdbMovie[] };
      }>("movies_search", { query });
      const movies = (raw.data.results ?? []).filter((r) => !!r.title);
      setResults(movies);
      setSearched(true);
      if (movies.length === 0) toast.info("Nenhum filme encontrado no TMDb.");
    } catch (error) {
      const msg = String(error);
      if (msg.includes("tmdb_no_key")) {
        setHasTmdbKey(false);
      } else if (msg.includes("tmdb_invalid_key")) {
        toast.error(
          "Chave TMDb inválida. Atualize nas Configurações → Integrações.",
        );
        setHasTmdbKey(false);
      } else {
        toast.error("Erro ao pesquisar. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (m: TmdbMovie) => {
    const year = m.release_date
      ? new Date(m.release_date).getFullYear()
      : undefined;
    onSelect({
      title: m.title,
      year,
      thumbnail: m.poster_path ? `${TMDB_IMG_FULL}${m.poster_path}` : undefined,
      category: "Filme",
      status: "WantToWatch",
      stars: 0,
      review: "",
    });
  };

  if (!isOpen) return null;

  // No key: show the full setup guide
  if (hasTmdbKey === false) {
    return (
      <ModalShell isOpen={isOpen} onClose={onClose} size="md">
        <div
          className={cn(
            "flex flex-col h-full bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden",
            "border-t-2",
            theme.border.split(" ")[0].replace("/20", ""),
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Key className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Configurar TMDb
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Necessário para buscar filmes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Why */}
            <div className="p-4 rounded-xl bg-[#0d253f]/15 border border-[#01b4e4]/20 flex items-start gap-3">
              <Film className="w-5 h-5 text-[#01b4e4] shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                O Aegis usa o{" "}
                <strong className="text-foreground">
                  The Movie Database (TMDb)
                </strong>{" "}
                para buscar filmes com dados em{" "}
                <strong className="text-foreground">português</strong>, posters,
                sinopse e avaliações. A conta e a chave são{" "}
                <strong className="text-foreground">gratuitas</strong>.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Passo a passo
              </p>
              <ol className="space-y-3">
                {[
                  {
                    label: "Criar conta",
                    desc: (
                      <>
                        Acesse{" "}
                        <a
                          href="https://www.themoviedb.org/signup"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#01b4e4] underline underline-offset-2 hover:opacity-80 transition-opacity"
                        >
                          themoviedb.org/signup
                        </a>{" "}
                        e registre-se gratuitamente.
                      </>
                    ),
                  },
                  {
                    label: "Ir para o Perfil",
                    desc: "Clique no seu avatar (canto superior direito) → Configurações.",
                  },
                  {
                    label: "Seção de API",
                    desc: 'No menu lateral esquerdo, clique em "API".',
                  },
                  {
                    label: "Acessar a chave",
                    desc: 'Clique em "Access your API key details here" e dê scroll até o final da página.',
                  },
                  {
                    label: "Copiar",
                    desc: 'Copie o valor de "Chave da API" e cole nas Configurações → Integrações.',
                  },
                ].map((step, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static steps
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#01b4e4]/15 text-[#01b4e4] text-[9px] font-black flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-foreground">
                        {step.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#01b4e4]/10 border border-[#01b4e4]/20 text-[#01b4e4] text-[12px] font-bold hover:bg-[#01b4e4]/20 transition-all w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir configurações de API do TMDb
            </a>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/50 shrink-0 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 transition-all cursor-pointer"
            >
              Agora não
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Settings className="w-4 h-4" />
                Ir para Integrações
              </button>
            )}
          </div>
        </div>
      </ModalShell>
    );
  }

  if (hasTmdbKey === null) {
    return (
      <ModalShell isOpen={isOpen} onClose={onClose} size="md">
        <div className="w-full p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="md">
      <div
        className={cn(
          "flex flex-col h-full bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden",
          "border-t-2",
          theme.border.split(" ")[0].replace("/20", ""),
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
            >
              <Search className={cn("w-4 h-4", theme.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Buscar Filme
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  TMDb · PT-BR
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-4 shrink-0">
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Ex: Oppenheimer, Duna, Batman..."
              className={cn(
                "h-10 bg-card border-border text-sm font-medium placeholder:text-muted-foreground/40 rounded-xl transition-all",
                theme.borderHover.replace(
                  "hover:",
                  "focus-visible:ring-1 focus-visible:ring-",
                ),
              )}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className={cn(
                "px-4 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center min-w-[80px]",
                loading
                  ? cn(theme.solid, "opacity-50 cursor-not-allowed")
                  : cn(theme.solid, theme.solidHover),
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Buscar"
              )}
            </button>
          </div>
        </div>

        {/* Results count */}
        {searched && results.length > 0 && (
          <div className="px-6 pb-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              TMDb · {results.length} resultado{results.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar space-y-1">
          {results.length > 0 ? (
            results.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => handleSelect(movie)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl group transition-all text-left border border-transparent cursor-pointer",
                  theme.bgHover,
                  theme.borderHover,
                )}
              >
                {/* Poster */}
                <div className="w-10 h-14 bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50">
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_IMG}${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      "font-bold text-sm text-foreground transition-colors truncate",
                      theme.text.replace("text-", "group-hover:text-"),
                    )}
                  >
                    {movie.title}
                  </h4>
                  {movie.title !== movie.original_title && (
                    <p className="text-[9px] text-muted-foreground/50 truncate italic">
                      {movie.original_title}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {movie.release_date && (
                      <div className="flex items-center gap-1 text-muted-foreground/60">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {new Date(movie.release_date).getFullYear()}
                        </span>
                      </div>
                    )}
                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-1 text-amber-500/80">
                        <Star className="w-3 h-3 fill-amber-500/80" />
                        <span className="text-[10px] font-bold">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {movie.overview && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                      {movie.overview}
                    </p>
                  )}
                </div>

                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-all shrink-0",
                    theme.text.replace("text-", "group-hover:text-"),
                  )}
                />
              </button>
            ))
          ) : searched && !loading ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-40">
              <Film className="w-10 h-10 mb-2" />
              <p className="text-[11px] font-bold">Nenhum resultado</p>
              <p className="text-[10px] mt-1">Tente outro título ou idioma</p>
            </div>
          ) : !loading ? (
            <div className="h-32 flex items-center justify-center">
              <p className="text-xs text-muted-foreground/40 font-medium">
                Digite e pressione Buscar ou Enter
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
