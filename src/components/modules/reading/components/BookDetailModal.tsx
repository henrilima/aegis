"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Pencil,
  Plus,
  Quote,
  Star,
  StarHalf,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingNote, ReadingSession } from "../types";
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
  const [activeSubTab, setActiveSubTab] = useState<"details" | "notes">(
    "details",
  );
  const [sessions, setSessions] = useState<ReadingSession[]>([]);

  useEffect(() => {
    if (book?.id) {
      invoke<ReadingSession[]>("reading_list_sessions", {
        userId: book.userId,
        monthsBack: 12,
      })
        .then((res) => {
          const bookSessions = res.filter((s) => s.bookId === book.id);
          setSessions(bookSessions);
        })
        .catch((err) => console.error(err));
    }
  }, [book]);

  const { estimatedDateStr, timeLeftStr, averagePPM } = useMemo(() => {
    if (!book || sessions.length === 0) {
      return {
        estimatedDateStr: "Registrar sessões para calcular",
        timeLeftStr: "-",
        averagePPM: 1.0,
      };
    }
    const totalPagesRead = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const totalDuration = sessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0,
    );
    const averagePPM = totalDuration > 0 ? totalPagesRead / totalDuration : 1.0;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentSessions = sessions.filter(
      (s) => new Date(s.date) >= fourteenDaysAgo,
    );
    const totalPagesRecent = recentSessions.reduce(
      (sum, s) => sum + s.pagesRead,
      0,
    );
    const pagesPerDay =
      recentSessions.length > 0 ? totalPagesRecent / 14 : 10.0;
    const finalPagesPerDay = pagesPerDay > 0 ? pagesPerDay : 10.0;

    const pagesLeft = Math.max(0, book.totalPages - book.currentPage);
    const daysLeft = pagesLeft / finalPagesPerDay;
    const minutesLeft = pagesLeft / averagePPM;

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(daysLeft));
    const estimatedDateStr = completionDate.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const hours = Math.floor(minutesLeft / 60);
    const mins = Math.round(minutesLeft % 60);
    const timeLeftStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return { estimatedDateStr, timeLeftStr, averagePPM };
  }, [book, sessions]);

  if (!book) return null;
  const progress = calculateProgress(book.currentPage, book.totalPages);
  const isReadingOrCompleted =
    book.status === "Reading" || book.status === "Completed";
  return (
    <ModalShell isOpen={!!book} onClose={onClose} size="xl" zIndex="z-[100]">
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

            {/* Progresso e Páginas */}
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
                  <span className={cn("font-black text-xs", themeStyles.text)}>
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

          {/* Coluna Direita: Dados, Avaliação e Resenha / Fichamentos */}
          <div className="md:col-span-9 p-6 flex flex-col gap-6">
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

            {/* Seletor de Abas */}
            <div className="flex gap-4 border-b border-border/50">
              <button
                type="button"
                onClick={() => setActiveSubTab("details")}
                className={cn(
                  "pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer",
                  activeSubTab === "details"
                    ? "border-blue-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Resenha & Estimativas
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("notes")}
                className={cn(
                  "pb-2 text-xs font-bold transition-all border-b-2 cursor-pointer",
                  activeSubTab === "notes"
                    ? "border-blue-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Fichamentos & Citações
              </button>
            </div>

            {activeSubTab === "details" ? (
              <div className="space-y-6">
                {/* Estimativa de Término */}
                {book.status === "Reading" && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">
                          Previsão de Término
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none">
                          {estimatedDateStr}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">
                          Tempo Restante de Leitura
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1 leading-none">
                          {timeLeftStr}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 border-t border-blue-500/10 pt-3 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/80 leading-none">
                      <span>
                        Páginas restantes: {book.totalPages - book.currentPage}{" "}
                        pág.
                      </span>
                      <span>
                        Média de velocidade: {averagePPM.toFixed(2)} pág./min
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Avaliação
                  </p>
                  <StarPicker
                    rating={book.stars}
                    onSelect={(n) => book.id && onUpdateRating(book.id, n)}
                  />
                </div>

                <div className="space-y-2.5 border-t border-border/40 pt-4">
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
            ) : (
              <ReadingNotesPanel book={book} />
            )}
          </div>
        </div>
      </div>
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
    </ModalShell>
  );
}

function ReadingNotesPanel({ book }: { book: ReadingBook }) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [content, setContent] = useState("");
  const [page, setPage] = useState("");
  const [chapter, setChapter] = useState("");
  const [isQuote, setIsQuote] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!book.id) return;
    try {
      const res = await invoke<ReadingNote[]>("reading_list_notes", {
        bookId: book.id,
      });
      setNotes(res);
    } catch (e) {
      console.error(e);
    }
  }, [book.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !book.id) return;
    setLoading(true);
    try {
      await invoke("reading_add_note", {
        note: {
          userId: book.userId,
          bookId: book.id,
          pageNumber: page ? Number(page) : null,
          chapter: chapter.trim() || null,
          content: content.trim(),
          isQuote,
        },
      });
      setContent("");
      setPage("");
      setChapter("");
      fetchNotes();
      toast.success("Nota salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar nota");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await invoke("reading_delete_note", { id });
      fetchNotes();
      toast.success("Nota excluída");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-h-[50vh]">
      <form
        onSubmit={handleAddNote}
        className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="note-chapter"
              className="text-[10px] font-bold text-muted-foreground uppercase"
            >
              Capítulo
            </label>
            <Input
              id="note-chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="Ex: Capítulo 3"
              className="bg-card h-9 border-border mt-0.5 text-xs font-semibold"
            />
          </div>
          <div>
            <label
              htmlFor="note-page"
              className="text-[10px] font-bold text-muted-foreground uppercase"
            >
              Página
            </label>
            <Input
              id="note-page"
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Ex: 45"
              className="bg-card h-9 border-border mt-0.5 text-xs font-semibold"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="note-content"
            className="text-[10px] font-bold text-muted-foreground uppercase"
          >
            Conteúdo
          </label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite trechos favoritos, citações ou reflexões..."
            className="bg-card border-border mt-0.5 text-xs font-medium resize-none min-h-[70px]"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isQuote}
              onChange={(e) => setIsQuote(e.target.checked)}
              className="rounded border-border bg-card text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-foreground">
              É uma citação direta
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 animate-in fade-in"
          >
            <Plus className="w-3.5 h-3.5" /> Salvar Nota
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {notes.length > 0 ? (
          notes.map((n) => (
            <div
              key={n.id}
              className="relative group/note bg-muted/10 border border-border/40 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {n.isQuote && (
                    <Quote className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                  )}
                  {n.chapter && `Cap. ${n.chapter}`}
                  {n.chapter && n.pageNumber && " · "}
                  {n.pageNumber && `Pág. ${n.pageNumber}`}
                </span>
                <button
                  type="button"
                  onClick={() => n.id && handleDeleteNote(n.id)}
                  className="opacity-0 group-hover/note:opacity-100 p-1 hover:bg-accent rounded text-rose-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed font-medium text-foreground/80",
                  n.isQuote
                    ? "italic font-semibold text-foreground pl-2 border-l-2 border-blue-500/40"
                    : "",
                )}
              >
                {n.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            Nenhum fichamento registrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
