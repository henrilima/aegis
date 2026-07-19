"use client";

import { Bookmark, BookOpen, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingSession } from "../types";
import { BookSelect } from "./BookSelect";

interface SessionModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (session: ReadingSession) => void;
  books: ReadingBook[];
  editSession?: ReadingSession;
  isSaving?: boolean;
}

interface SessionFormData {
  id?: number;
  userId: string;
  bookId?: number;
  date: string;
  pagesRead: number;
  duration_hours: number;
  durationMinutes: number;
  note: string;
  focus: number;
}

export function SessionModal({
  show,
  onClose,
  onSave,
  books,
  editSession,
  isSaving = false,
}: SessionModalProps) {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);

  const [formData, setFormData] = useState<SessionFormData>({
    userId: uid,
    bookId: undefined,
    date: new Date().toISOString().split("T")[0],
    pagesRead: 0,
    duration_hours: 0,
    durationMinutes: 0,
    note: "",
    focus: 3,
  });

  const set = (
    key: keyof SessionFormData,
    val: SessionFormData[keyof SessionFormData],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const selectedBook = useMemo(() => {
    const bid = formData.bookId;
    if (bid == null || !books.length) return undefined;
    return books.find((b) => String(b.id) === String(bid));
  }, [formData.bookId, books]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (show) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, onClose]);

  useEffect(() => {
    if (show) {
      if (editSession) {
        const bid = editSession.bookId;
        const dread = editSession.pagesRead;
        const dtotal = editSession.durationMinutes || 0;
        const hours = Math.floor(dtotal / 60);
        const minutes = dtotal % 60;

        const book = books.find((b) => String(b.id) === String(bid));
        const startPage = book
          ? Math.max(0, book.currentPage - Number(dread))
          : 0;
        const stopPage = startPage + Number(dread);

        setFormData({
          id: editSession.id,
          userId: editSession.userId,
          bookId: bid ? Number(bid) : undefined,
          pagesRead: stopPage,
          duration_hours: hours,
          durationMinutes: minutes,
          date: editSession.date,
          note: editSession.note || "",
          focus: 3,
        });
      } else {
        const readingBooks = books.filter((b) => b.status === "Reading");
        const defaultBook = readingBooks[0] ?? books[0];
        const defaultBookId = defaultBook?.id;

        setFormData({
          bookId: defaultBookId ? Number(defaultBookId) : undefined,
          date: new Date().toISOString().split("T")[0],
          pagesRead: defaultBook?.currentPage ?? 0,
          duration_hours: 0,
          durationMinutes: 0,
          note: "",
          focus: 3,
          userId: uid,
        });
      }
    }
  }, [show, editSession, books, uid]);

  if (!show) return null;

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!formData.bookId) {
      toast.error("Selecione uma obra para registrar a sessão");
      return;
    }

    if (totalMinutesDisp <= 0) {
      toast.error("Informe a duração da sessão");
      return;
    }

    if (pagesReadDelta <= 0) {
      toast.error(
        `A página final (${formData.pagesRead}) deve ser maior que a página inicial (${startPage})`,
      );
      return;
    }

    if (!formData.date) {
      toast.error("Selecione a data da sessão");
      return;
    }

    const cleanedSession: ReadingSession = {
      userId: formData.userId,
      bookId: Number(formData.bookId),
      pagesRead: pagesReadDelta,
      durationMinutes: totalMinutesDisp,
      date: formData.date,
      note: formData.note || undefined,
      focus: formData.focus,
    };

    if (formData.id) {
      cleanedSession.id = Number(formData.id);
    }

    onSave(cleanedSession);
  };

  const totalMinutesDisp =
    Number(formData.duration_hours) * 60 + Number(formData.durationMinutes);

  const startPage = editSession
    ? selectedBook
      ? Math.max(0, selectedBook.currentPage - (editSession.pagesRead || 0))
      : 0
    : selectedBook?.currentPage || 0;

  const pagesReadDelta = Math.max(0, Number(formData.pagesRead) - startPage);

  const pagesPerMinute =
    pagesReadDelta && totalMinutesDisp > 0
      ? (pagesReadDelta / totalMinutesDisp).toFixed(1)
      : "0.0";

  const labelClass = "text-xs font-semibold text-muted-foreground mb-1.5 block";
  const requiredClass = cn("ml-1", theme.text);
  const inputClass = cn(
    "bg-card border-border/60 h-11 text-sm font-medium rounded-xl px-4 w-full placeholder:text-neutral-700 transition-all",
    theme.borderHover.replace(
      "hover:",
      "focus-visible:ring-1 focus-visible:ring-",
    ),
  );

  const focusLabels = [
    "Improdutivo",
    "Baixo",
    "Médio",
    "Bom",
    "Alto",
    "Imersivo",
  ];

  return (
    <ModalShell isOpen={show} onClose={onClose} size="xl" zIndex="z-[100]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <BookOpen className={cn("w-4 h-4", theme.text)} />
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
                value={formData.bookId}
                onChange={(id) => set("bookId", id)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={labelClass}>
                Data <span className={requiredClass}>*</span>
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => set("date", e.target.value)}
                className={cn(inputClass, "h-12 w-full")}
              />
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
                      set("duration_hours", parseInt(e.target.value, 10) || 0)
                    }
                    className={cn(inputClass, "h-12 pr-6 text-center")}
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-600 pointer-events-none">
                    h
                  </span>
                </div>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.durationMinutes || ""}
                    onChange={(e) =>
                      set("durationMinutes", parseInt(e.target.value, 10) || 0)
                    }
                    className={cn(inputClass, "h-12 pr-8 text-center")}
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-600 pointer-events-none">
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
              onChange={(e) => set("note", e.target.value)}
              className={cn(
                "bg-card border-border/60 rounded-xl p-4 text-sm font-medium text-muted-foreground placeholder:text-neutral-700 resize-none h-36 transition-all",
                theme.borderHover.replace(
                  "hover:",
                  "focus-visible:ring-1 focus-visible:ring-",
                ),
              )}
              placeholder="Reflexões sobre esta sessão (opcional)..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className={labelClass}>Nível de foco</Label>
              <span className={cn("text-xs font-semibold", theme.text)}>
                {focusLabels[formData.focus ?? 0]}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5 bg-card p-1.5 rounded-xl border border-border/50">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => set("focus", num)}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    formData.focus === num
                      ? cn(theme.solid, "text-white")
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <Label className={labelClass}>Métricas da sessão</Label>
          <div className="flex flex-col flex-1 relative gap-6">
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
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border",
                  theme.bg,
                  theme.text,
                  theme.border,
                )}
              >
                {editSession ? "Edição" : "Nova"}
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <Label className={labelClass}>
                  Página de parada <span className={requiredClass}>*</span>
                </Label>
                <div className="relative group/field">
                  <Bookmark
                    className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 transition-colors pointer-events-none",
                      `group-hover/field:${theme.text}`,
                    )}
                  />
                  <Input
                    type="number"
                    min={startPage}
                    value={formData.pagesRead || ""}
                    onChange={(e) =>
                      set("pagesRead", parseInt(e.target.value, 10) || 0)
                    }
                    className={cn(
                      inputClass,
                      "h-14 pl-12 bg-background border-border text-lg tabular-nums font-black",
                    )}
                    placeholder={String(startPage)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end opacity-60 pointer-events-none">
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
                    <span className={cn("text-base font-black", theme.text)}>
                      {Math.round(
                        (selectedBook.currentPage / selectedBook.totalPages) *
                          100,
                      )}
                      %
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-border/30">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          theme.solid,
                        )}
                        style={{
                          width: `${Math.min(100, (selectedBook.currentPage / selectedBook.totalPages) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-neutral-600">
                      <span>{selectedBook.currentPage} pág.</span>
                      <span>{selectedBook.totalPages} pág.</span>
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
          disabled={isSaving}
          onClick={handleSave}
          className={cn(
            "flex-2 h-11 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving
            ? "Salvando..."
            : editSession
              ? "Salvar alterações"
              : "Confirmar registro"}
        </Button>
      </div>
    </ModalShell>
  );
}
