"use client";

import {
  Clock,
  History as HistoryIcon,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingSession } from "../types";

interface HistoryTabProps {
  sessions: ReadingSession[];
  books: ReadingBook[];
  onDelete: (id: number) => void;
  onEdit: (session: ReadingSession) => void;
}

export function HistoryTab({
  sessions,
  books,
  onDelete,
  onEdit,
}: HistoryTabProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const getBook = (session: ReadingSession) => {
          const bid = session.bookId;
          return books.find((b) => Number(b.id) === Number(bid));
        };

        const book = getBook(s);
        const matchesSearch =
          book?.title.toLowerCase().includes(search.toLowerCase()) ||
          s.note?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, books, search]);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) return `${hours}h ${m}min`;
    return `${m}min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar registro..."
            className={cn(
              "pl-11 h-12 bg-card/50 border-border rounded-xl border-b-2 border-b-neutral-800 placeholder:text-neutral-700",
              theme.borderHover.replace("hover:", "focus-visible:ring-"),
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSessions.map((s) => {
          const getBook = (session: ReadingSession) => {
            const bid = session.bookId;
            return books.find((b) => Number(b.id) === Number(bid));
          };
          const book = getBook(s);
          const duration = s.durationMinutes || 0;
          const pages = s.pagesRead || 0;

          return (
            <div
              key={s.id}
              className={cn(
                "bg-card/40 border border-border/50 rounded-xl p-6 group hover:bg-card/60 transition-all relative overflow-hidden",
                theme.borderHover,
              )}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex flex-col gap-1">
                  <h3
                    className={cn(
                      "text-base font-bold text-foreground transition-colors",
                      theme.textDarkHover.replace("hover:", "group-hover:"),
                    )}
                  >
                    {book?.title || "Leitura avulsa"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {book?.author || "Sessão independente"}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "px-3 py-1.5 border rounded-xl",
                      theme.bg,
                      theme.border,
                    )}
                  >
                    <span className={cn("text-xs font-semibold", theme.text)}>
                      {formatDate(s.date)}
                    </span>
                  </div>

                  <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden">
                    <ToolTip content="Editar registro">
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className={cn(
                          "p-2.5 transition-all border-r border-border active:scale-95 text-neutral-600",
                          theme.bgHover,
                          theme.textDarkHover,
                        )}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir registro">
                      <button
                        type="button"
                        onClick={() => s.id && onDelete(s.id)}
                        className="p-2.5 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ToolTip>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-border/50 rounded-xl">
                  <Clock className={cn("w-3.5 h-3.5", theme.text)} />
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-border/50 rounded-xl">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        fill="currentColor"
                        className={cn(
                          "w-3 h-3 transition-colors",
                          star <= (s.focus || 0)
                            ? theme.text
                            : "text-neutral-800",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-border/50 rounded-xl">
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                    {pages} páginas
                  </span>
                </div>
              </div>

              {s.note && (
                <div className="relative pl-6 py-1">
                  <div
                    className={cn(
                      "absolute left-1 top-0 bottom-0 w-px border-dotted",
                      theme.border.replace("20", "40"),
                    )}
                  />
                  <p className="text-sm font-medium text-muted-foreground italic leading-relaxed line-clamp-3">
                    {s.note}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 grayscale">
            <HistoryIcon className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground">
              Histórico vazio
            </h3>
            <p className="text-xs text-neutral-700 mt-1">
              Nenhum registro encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
