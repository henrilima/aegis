"use client";

import { Bookmark, BookOpen, Calendar, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { ReadingBook, ReadingSession } from "../types";

interface SessionModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (session: ReadingSession) => void;
  books: ReadingBook[];
  editSession?: ReadingSession;
}

function BookSelect({
  books,
  value,
  onChange,
}: {
  books: ReadingBook[];
  value?: number;
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = books.find((b) => Number(b.id) === Number(value));

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* visual idêntico ao shadcn SelectTrigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-all",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-0",
          "hover:bg-accent/50/60",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected ? selected.title : "Selecione o livro..."}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* inline, sem portal */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-56 overflow-y-auto p-1">
            {books.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-600">
                Nenhum livro na biblioteca
              </div>
            ) : (
              books.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(Number(b.id));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    Number(b.id) === Number(value)
                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                  <span className="truncate">{b.title}</span>
                  {Number(b.id) === Number(value) && (
                    <span className="ml-auto text-[10px] font-semibold text-orange-500">
                      ✓
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SessionFormData {
  id?: number;
  user_id: string;
  book_id?: number;
  date: string;
  pages_read: number;
  duration_hours: number;
  duration_minutes: number;
  note: string;
  focus: number;
}

export function SessionModal({
  show,
  onClose,
  onSave,
  books,
  editSession,
}: SessionModalProps) {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  const [formData, setFormData] = useState<SessionFormData>({
    user_id: uid,
    book_id: undefined,
    date: new Date().toISOString().split("T")[0],
    pages_read: 0,
    duration_hours: 0,
    duration_minutes: 0,
    note: "",
    focus: 3,
  });

  const selectedBook = useMemo(() => {
    const bid = formData.book_id;
    if (bid == null || !books.length) return undefined;
    return books.find((b) => String(b.id) === String(bid));
  }, [formData.book_id, books]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (show) {
      window.addEventListener("keydown", handleEscape);
      if (editSession) {
        const bid = editSession.book_id;
        const dread = editSession.pages_read;
        const dtotal = editSession.duration_minutes || 0;

        const hours = Math.floor(dtotal / 60);
        const minutes = dtotal % 60;

        // Encontra o livro para calcular onde a sessão terminou
        const book = books.find((b) => String(b.id) === String(bid));
        const startPage = book
          ? Math.max(0, book.current_page - Number(dread))
          : 0;
        const stopPage = startPage + Number(dread);

        setFormData({
          id: editSession.id,
          user_id: editSession.user_id,
          book_id: bid ? Number(bid) : undefined,
          pages_read: stopPage,
          duration_hours: hours,
          duration_minutes: minutes,
          date: editSession.date,
          note: editSession.note || "",
          focus: 3,
        });
      } else {
        const readingBooks = books.filter((b) => b.status === "Reading");
        const defaultBook = readingBooks[0] ?? books[0];
        const defaultBookId = defaultBook?.id;

        setFormData({
          book_id: defaultBookId ? Number(defaultBookId) : undefined,
          date: new Date().toISOString().split("T")[0],
          pages_read: defaultBook?.current_page ?? 0, // Padrão para o progresso atual
          duration_hours: 0,
          duration_minutes: 0,
          note: "",
          focus: 3,
          user_id: uid,
        });
      }
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, books, onClose, editSession, uid]);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.book_id) {
      toast.error("Selecione uma obra para registrar a sessão");
      return;
    }

    if (totalMinutesDisp <= 0) {
      toast.error("Informe a duração da sessão");
      return;
    }

    if (pagesReadDelta <= 0) {
      toast.error(
        `A página final (${formData.pages_read}) deve ser maior que a página inicial (${startPage})`,
      );
      return;
    }

    if (!formData.date) {
      toast.error("Selecione a data da sessão");
      return;
    }

    const cleanedSession: ReadingSession = {
      user_id: formData.user_id,
      book_id: Number(formData.book_id),
      pages_read: pagesReadDelta,
      duration_minutes: totalMinutesDisp,
      date: formData.date,
      note: formData.note || undefined,
    };

    if (formData.id) {
      cleanedSession.id = Number(formData.id);
    }

    onSave(cleanedSession);
  };

  const totalMinutesDisp =
    Number(formData.duration_hours) * 60 + Number(formData.duration_minutes);

  const startPage = editSession
    ? selectedBook
      ? Math.max(0, selectedBook.current_page - (editSession.pages_read || 0))
      : 0
    : selectedBook?.current_page || 0;

  const pagesReadDelta = Math.max(0, Number(formData.pages_read) - startPage);

  const pagesPerMinute =
    pagesReadDelta && totalMinutesDisp > 0
      ? (pagesReadDelta / totalMinutesDisp).toFixed(1)
      : "0.0";

  const labelClass = "text-xs font-semibold text-muted-foreground mb-1.5 block";
  const requiredClass = "text-orange-500 ml-1";
  const inputClass =
    "bg-card border-border/60 h-11 text-sm font-medium focus-visible:ring-orange-500/20 rounded-xl px-4 w-full placeholder:text-neutral-700";

  const focusLabels = [
    "Improdutivo",
    "Baixo",
    "Médio",
    "Bom",
    "Alto",
    "Imersivo",
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm ">
      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center justify-center text-orange-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {editSession ? "Editar sessão" : "Registrar leitura"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Sincronize seu progresso literário
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 hover:bg-muted/50 rounded-xl transition-all text-neutral-600 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-8 grid grid-cols-2 gap-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <Label className={labelClass}>
                Obra <span className={requiredClass}>*</span>
              </Label>
              {editSession ? (
                <div
                  className={cn(
                    inputClass,
                    "h-12 flex items-center gap-3 border border-border/60 rounded-xl px-4 opacity-60 cursor-not-allowed select-none",
                  )}
                >
                  <BookOpen className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground truncate">
                    {selectedBook?.title || "Livro da sessão"}
                  </span>
                  <span className="ml-auto text-[10px] font-medium text-neutral-700">
                    bloqueado
                  </span>
                </div>
              ) : (
                <BookSelect
                  books={books}
                  value={formData.book_id}
                  onChange={(id) => setFormData({ ...formData, book_id: id })}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>
                  Data <span className={requiredClass}>*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.date}
                    onClick={(e) => {
                      if ("showPicker" in HTMLInputElement.prototype) {
                        e.currentTarget.showPicker();
                      }
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className={cn(inputClass, "h-12 w-full cursor-pointer")}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col">
                <Label className={labelClass}>
                  Duração <span className={requiredClass}>*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      value={formData.duration_hours || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_hours: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={cn(inputClass, "h-12 pr-6 text-center")}
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-600">
                      h
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.duration_minutes || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_minutes: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={cn(inputClass, "h-12 pr-8 text-center")}
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-600">
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelClass}>Anotações</Label>
              <Textarea
                value={formData.note || ""}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="bg-card border-border/60 rounded-xl p-4 text-sm font-medium text-muted-foreground placeholder:text-neutral-700 resize-none h-36 focus-visible:ring-orange-500/20"
                placeholder="Reflexões sobre esta sessão (opcional)..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className={labelClass}>Nível de foco</Label>
                <span className="text-xs font-semibold text-orange-500">
                  {focusLabels[formData.focus ?? 0]}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 bg-card p-1.5 rounded-xl border border-border/50">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, focus: i })}
                    className={cn(
                      "h-9 rounded-lg text-xs font-bold transition-all",
                      formData.focus === i
                        ? "bg-orange-500/20 text-orange-500 border border-orange-500/30"
                        : "text-neutral-600 hover:text-muted-foreground",
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Label className={labelClass}>Métricas da sessão</Label>
            <div className="bg-card border border-border/60 rounded-xl p-6 flex flex-col flex-1 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Ritmo
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-foreground tabular-nums">
                      {pagesPerMinute}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      pág / min
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-semibold border border-orange-500/20">
                  {editSession ? "Edição" : "Nova"}
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <Label className={labelClass}>
                    Página de parada <span className={requiredClass}>*</span>
                  </Label>
                  <div className="relative group/field">
                    <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-hover/field:text-orange-500 transition-colors" />
                    <Input
                      type="number"
                      min={startPage}
                      value={formData.pages_read || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pages_read: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={cn(
                        inputClass,
                        "h-14 pl-12 bg-background border-border text-lg tabular-nums font-black",
                      )}
                      placeholder={String(startPage)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end opacity-60">
                      <span className="text-[10px] font-bold uppercase text-neutral-500">
                        Início
                      </span>
                      <span className="text-xs font-black text-foreground tabular-nums">
                        {startPage}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBook ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-sm font-bold text-foreground truncate max-w-[180px]">
                          {selectedBook.title}
                        </h4>
                        <p className="text-xs text-neutral-600 font-medium">
                          {selectedBook.author}
                        </p>
                      </div>
                      <span className="text-base font-black text-orange-500">
                        {Math.round(
                          (selectedBook.current_page /
                            selectedBook.total_pages) *
                            100,
                        )}
                        %
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-border/30">
                        <div
                          className="h-full bg-orange-500 transition-all duration-1000"
                          style={{
                            width: `${Math.min(100, (selectedBook.current_page / selectedBook.total_pages) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-neutral-600">
                        <span>{selectedBook.current_page} pág.</span>
                        <span>{selectedBook.total_pages} pág.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-border rounded-2xl">
                    <BookOpen className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Selecione um livro
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-2 h-11 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all active:scale-[0.98]"
          >
            {editSession ? "Salvar alterações" : "Confirmar registro"}
          </Button>
        </div>
      </div>
    </div>
  );
}
