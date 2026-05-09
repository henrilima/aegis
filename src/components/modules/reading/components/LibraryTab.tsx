"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Heart,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook } from "../types";
import { calculateProgress } from "../utils";
import { BookDetailModal } from "./BookDetailModal";

interface LibraryTabProps {
  books: ReadingBook[];
  avgPpm: number;
  onEdit: (b: ReadingBook) => void;
  onDelete: (id: number) => void;
  uid: string;
  onRefresh: () => void;
}

type LibFilter = "all" | "WantToRead" | "Reading" | "Completed" | "favorites";

const STATUS_LABEL: Record<string, string> = {
  Reading: "Lendo",
  Completed: "Lido",
  WantToRead: "Quero ler",
  Dropped: "Interrompido",
};

export function LibraryTab({
  books,
  onEdit,
  onDelete,
  uid,
  onRefresh,
}: LibraryTabProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LibFilter>("all");
  const [detailBook, setDetailBook] = useState<ReadingBook | null>(null);

  const handleToggleFavorite = async (book: ReadingBook) => {
    try {
      await invoke("reading_toggle_favorite", {
        id: book.id,
        userId: uid,
        isFavorite: !book.isFavorite,
      });
      onRefresh();
    } catch {
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleUpdateRating = async (id: number, stars: number) => {
    try {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      await invoke("reading_upsert_book", {
        book: { ...book, stars, userId: uid },
      });
      onRefresh();
      // Atualiza o estado do modal para refletir a mudança
      setDetailBook((prev) => (prev ? { ...prev, stars } : null));
    } catch {
      toast.error("Erro ao atualizar nota");
    }
  };

  const counts = useMemo(
    () => ({
      all: books.length,
      WantToRead: books.filter((b) => b.status === "WantToRead").length,
      Reading: books.filter((b) => b.status === "Reading").length,
      Completed: books.filter((b) => b.status === "Completed").length,
      favorites: books.filter((b) => b.isFavorite).length,
    }),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const q = search.toLowerCase();

    // Ordena por status: quero ler → lendo → lido → interrompido
    const priority: Record<string, number> = {
      WantToRead: 0,
      Reading: 1,
      Completed: 2,
      Dropped: 3,
    };

    const byFilter =
      filter === "favorites"
        ? books.filter((b) => b.isFavorite)
        : filter === "all"
          ? books
          : books.filter((b) => b.status === filter);

    const sorted =
      filter === "all"
        ? [
            ...byFilter.filter((b) => b.status === "WantToRead"),
            ...byFilter.filter((b) => b.status === "Reading"),
            ...byFilter.filter((b) => b.status === "Completed"),
            ...byFilter.filter((b) => b.status === "Dropped"),
          ]
        : [...byFilter].sort(
            (a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9),
          );

    if (!q) return sorted;
    return sorted.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q),
    );
  }, [books, filter, search]);

  const TABS: { id: LibFilter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "WantToRead", label: "Quero ler", count: counts.WantToRead },
    { id: "Reading", label: "Lendo", count: counts.Reading },
    { id: "Completed", label: "Lidos", count: counts.Completed },
    { id: "favorites", label: "Favoritos", count: counts.favorites },
  ];

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Barra de busca + filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border rounded-xl p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Buscar por título, autor ou gênero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full bg-background/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-all font-medium",
              theme.borderHover.replace("hover:", "focus:"),
            )}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-background/50 border border-border rounded-xl shrink-0 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                filter === t.id
                  ? cn(theme.bg, theme.text, "border", theme.border)
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold",
                  filter === t.id
                    ? cn(theme.bg, theme.text)
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {filteredBooks.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-10 grayscale">
          <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {search ? "Nenhum resultado" : "Biblioteca vazia"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {search
              ? "Nenhum livro corresponde à sua busca."
              : filter === "favorites"
                ? "Marque livros como favoritos para vê-los aqui."
                : filter === "Completed"
                  ? "Livros marcados como lidos aparecerão aqui."
                  : "Adicione um livro para começar."}
          </p>
        </div>
      ) : filter === "all" ? (
        // Na aba "todos", dividir por seção se houver mais de um grupo
        <AllSections
          books={filteredBooks}
          onView={setDetailBook}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        <BookGrid
          books={filteredBooks}
          onView={setDetailBook}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Modal de detalhes */}
      <BookDetailModal
        book={detailBook}
        onClose={() => setDetailBook(null)}
        onEdit={(b) => {
          setDetailBook(null);
          onEdit(b);
        }}
        onUpdateRating={handleUpdateRating}
      />
    </div>
  );
}

// Seções separadas por status na aba "todos"
function AllSections({
  books,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  books: ReadingBook[];
  onView: (b: ReadingBook) => void;
  onEdit: (b: ReadingBook) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (b: ReadingBook) => void;
}) {
  const groups = [
    { status: "WantToRead", label: "Quero ler", icon: Bookmark },
    { status: "Reading", label: "Lendo", icon: BookOpen },
    { status: "Completed", label: "Lidos", icon: BookmarkCheck },
    { status: "Dropped", label: "Interrompidos" },
  ] as const;

  const hasMultiple =
    groups.filter(({ status }) => books.some((b) => b.status === status))
      .length > 1;

  if (!hasMultiple) {
    return (
      <BookGrid
        books={books}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(({ status, label }, i) => {
        const group = books.filter((b) => b.status === status);
        if (group.length === 0) return null;
        return (
          <div key={status} className="space-y-3">
            {i > 0 && <div className="border-t border-border/50" />}
            <p className="text-sm font-medium text-muted-foreground">
              {label} · {group.length}
            </p>
            <BookGrid
              books={group}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        );
      })}
    </div>
  );
}

// Grid de cards
function BookGrid({
  books,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  books: ReadingBook[];
  onView: (b: ReadingBook) => void;
  onEdit: (b: ReadingBook) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (b: ReadingBook) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

// Card individual de livro
function BookCard({
  book,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  book: ReadingBook;
  onView: (b: ReadingBook) => void;
  onEdit: (b: ReadingBook) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (b: ReadingBook) => void;
}) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const isFav = !!book.isFavorite;
  const isReading = book.status === "Reading";
  const progress = calculateProgress(book.currentPage, book.totalPages);

  const statusColor: Record<string, string> = {
    Reading: cn(theme.text, theme.border, theme.bg),
    Completed: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
    WantToRead: "text-muted-foreground border-border bg-muted/30",
    Dropped: "text-red-500 border-red-500/20 bg-red-500/5",
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Card has nested action buttons
    <div
      className={cn(
        "group relative flex flex-row bg-card border border-border rounded-xl overflow-hidden transition-all cursor-pointer h-[150px]",
        theme.borderHover.replace("hover:", "hover:"),
      )}
      onClick={() => onView(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(book);
        }
      }}
    >
      {/* Capa */}
      <div className="w-[100px] shrink-0 relative overflow-hidden bg-muted border-r border-border/50">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Overlay de ações */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(book);
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
              book.id && onDelete(book.id);
            }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Barra de progresso sutil no poster */}
        {isReading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className={cn("h-full transition-all", theme.solid)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 p-3.5 flex flex-col min-w-0 relative">
        <div className="flex justify-between items-start gap-2">
          <h3
            className={cn(
              "font-bold text-sm text-foreground line-clamp-1 leading-snug transition-colors flex-1",
              theme.textDarkHover.replace("hover:", "group-hover:"),
            )}
          >
            {book.title}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(book);
            }}
            className={cn(
              "shrink-0 transition-all cursor-pointer",
              isFav
                ? "text-rose-500"
                : "text-muted-foreground/30 hover:text-rose-500",
            )}
          >
            <Heart className={cn("w-4 h-4", isFav && "fill-rose-500")} />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 font-bold truncate mt-0.5">
          {book.author}
        </p>

        <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold mt-1.5">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border",
              statusColor[book.status] ??
                "text-muted-foreground border-border bg-muted/30",
            )}
          >
            {STATUS_LABEL[book.status] ?? book.status}
          </span>
          {isReading && <span className={theme.text}>{progress}%</span>}
          {book.category && book.category !== "Geral" && (
            <span className="truncate max-w-[80px]">{book.category}</span>
          )}
        </div>

        {book.review ? (
          <p className="mt-2 text-xs text-muted-foreground/80 line-clamp-1 leading-relaxed">
            {book.review}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground/30 italic">
            Sem resenha ainda...
          </p>
        )}

        <div className="mt-auto pt-2">
          {book.stars > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={`${book.id}-star-${i}`}
                  fill="currentColor"
                  className={cn(
                    "w-3 h-3",
                    i < book.stars ? theme.text : "text-muted-foreground/20",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
