"use client";

import { Bookmark, BookOpen, Clock, Edit2, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";
import type { ReadingBook } from "../types";
import { calculateProgress } from "../utils";

interface LibraryTabProps {
  books: ReadingBook[];
  avgPpm: number;
  onEdit: (b: ReadingBook) => void;
  onDelete: (id: number) => void;
}

export function LibraryTab({
  books,
  avgPpm,
  onEdit,
  onDelete,
}: LibraryTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBooks = useMemo(() => {
    const priority: Record<string, number> = {
      Reading: 0,
      WantToRead: 1,
      Completed: 2,
      Dropped: 3,
    };

    return books
      .filter((b) => {
        const matchesSearch =
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99));
  }, [books, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      all: books.length,
      reading: books.filter((b) => b.status === "Reading").length,
      completed: books.filter((b) => b.status === "Completed").length,
      wishlist: books.filter((b) => b.status === "WantToRead").length,
    };
  }, [books]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Pesquisa e Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border rounded-xl p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/20 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-background/50 border border-border rounded-xl">
          {[
            { id: "all", label: "Tudo", count: stats.all },
            { id: "Reading", label: "Lendo", count: stats.reading },
            { id: "Completed", label: "Lido", count: stats.completed },
            { id: "WantToRead", label: "Desejo", count: stats.wishlist },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ",
                statusFilter === f.id
                  ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40"
                  : "text-muted-foreground hover:text-muted-foreground hover:bg-muted/50",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "w-4 h-4 rounded-xl flex items-center justify-center text-[8px]",
                  statusFilter === f.id
                    ? "bg-white/20"
                    : "bg-muted text-muted-foreground/60 font-bold",
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de livros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => {
            const progress = calculateProgress(
              book.current_page,
              book.total_pages,
            );
            const statusTheme = {
              Reading:
                "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
              Completed:
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              WantToRead: "bg-sky-500/10 text-sky-400 border-sky-500/20",
              Dropped: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            }[book.status];

            return (
              <div
                key={book.id}
                className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-orange-500/30 transition-all hover:shadow-orange-900/5"
              >
                <div className="relative p-6 pb-0 flex gap-4">
                  <div className="w-24 h-36 bg-muted rounded-xl overflow-hidden shrink-0 border border-border/50 group-hover:scale-105 transition-all duration-500">
                    {book.thumbnail ? (
                      <Image
                        src={book.thumbnail}
                        alt={book.title}
                        width={64}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-background text-neutral-800/20">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-xl text-[8px] font-bold mb-2 border",
                        statusTheme,
                      )}
                    >
                      {book.status === "Reading" && "Lendo"}
                      {book.status === "Completed" && "Concluído"}
                      {book.status === "WantToRead" && "Na lista"}
                      {book.status === "Dropped" && "Interrompido"}
                    </span>

                    {book.status === "Reading" && avgPpm > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {(() => {
                            const remainingPages =
                              book.total_pages - book.current_page;
                            const mins = Math.ceil(remainingPages / avgPpm);
                            if (mins < 60) return `${mins}min restantes`;
                            const h = Math.floor(mins / 60);
                            const m = mins % 60;
                            return `${h}h ${m}min restantes`;
                          })()}
                        </span>
                      </div>
                    )}

                    <h3 className="font-bold text-foreground leading-tight line-clamp-2 text-sm">
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {book.author}
                    </p>

                    {/* Ações Padronizadas */}
                    <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden mt-4 w-fit">
                      <ToolTip content="Editar obra">
                        <button
                          type="button"
                          onClick={() => onEdit(book)}
                          className="p-2.5 hover:bg-orange-600/10 hover:text-orange-500 text-neutral-600 transition-all border-r border-border active:scale-95"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </ToolTip>
                      <ToolTip content="Excluir da biblioteca">
                        <button
                          type="button"
                          onClick={() => book.id && onDelete(book.id)}
                          className="p-2.5 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </ToolTip>
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-6 pt-4 flex flex-col gap-4">
                  <div className="h-px bg-neutral-800 w-full" />

                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-bold text-neutral-600">
                      Progresso literário
                    </span>
                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">
                      {progress}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="h-1.5 bg-background rounded-xl border border-border overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-xl transition-all duration-1000",
                          book.status === "Completed"
                            ? "bg-emerald-500"
                            : "bg-orange-500",
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>
                          {book.current_page}{" "}
                          <span className="text-neutral-700">
                            / {book.total_pages}
                          </span>
                        </span>
                      </div>
                      {book.category && book.category !== "Geral" && (
                        <span className="text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded-lg border border-border/30">
                          {book.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-card/10 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-10 grayscale">
            <div className="w-20 h-20 rounded-xl bg-card border border-border flex items-center justify-center mb-6 overflow-hidden">
              <Search className="w-8 h-8 text-neutral-800" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Biblioteca silenciosa
            </h3>
            <p className="text-neutral-600 max-w-sm mt-1 text-xs">
              Nenhum livro corresponde ao seu filtro ou busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
