"use client";

import { invoke } from "@tauri-apps/api/core";
import { Bookmark, Plus, Quote, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingNote } from "../types";
import { BookSelect } from "./BookSelect";

interface NotesTabProps {
  books: ReadingBook[];
}

type NoteWithBook = ReadingNote & {
  bookTitle: string;
  bookAuthor: string;
  bookThumbnail?: string;
};

export function NotesTab({ books }: NotesTabProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);

  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [chapter, setChapter] = useState("");
  const [page, setPage] = useState("");
  const [content, setContent] = useState("");
  const [isQuote, setIsQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBookId, setFilterBookId] = useState("");

  const fetchNotes = useCallback(async () => {
    if (books.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const allNotesList: NoteWithBook[] = [];

      await Promise.all(
        books.map(async (book) => {
          if (!book.id) return;
          try {
            const bookNotes = await invoke<ReadingNote[]>(
              "reading_list_notes",
              {
                bookId: book.id,
              },
            );
            for (const note of bookNotes) {
              allNotesList.push({
                ...note,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookThumbnail: book.thumbnail,
              });
            }
          } catch (e) {
            console.error(`Erro ao buscar notas do livro ${book.title}:`, e);
          }
        }),
      );

      // Ordenar por data de criação decrescente
      allNotesList.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setNotes(allNotesList);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar fichamentos");
    } finally {
      setLoading(false);
    }
  }, [books]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedBookId) return;

    const book = books.find((b) => String(b.id) === selectedBookId);
    if (!book || !book.id) return;

    setSubmitting(true);
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
      setIsQuote(false);
      toast.success("Fichamento salvo com sucesso!");
      fetchNotes();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar fichamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await invoke("reading_delete_note", { id });
      toast.success("Fichamento excluído");
      fetchNotes();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir");
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.chapter?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBook = filterBookId
        ? String(n.bookId) === filterBookId
        : true;

      return matchesSearch && matchesBook;
    });
  }, [notes, searchTerm, filterBookId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Coluna Esquerda: Formulário de Adicionar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 bg-card border border-border rounded-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Novo Fichamento
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
              Adicione citações e reflexões aos seus livros.
            </p>
          </div>

          <form onSubmit={handleAddNote} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                Livro
              </Label>
              <BookSelect
                books={books.filter(
                  (b) => b.status === "Reading" || b.status === "Completed",
                )}
                value={selectedBookId ? Number(selectedBookId) : undefined}
                onChange={(id) => setSelectedBookId(String(id))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                  Capítulo
                </Label>
                <Input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="Ex: Cap. 1"
                  className="bg-card h-9 border-border text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                  Página
                </Label>
                <Input
                  type="number"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  placeholder="Ex: 24"
                  className="bg-card h-9 border-border text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                Conteúdo
              </Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Insira a citação direta ou sua anotação..."
                className="bg-card border-border text-xs font-medium resize-none min-h-[100px] rounded-xl"
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
                disabled={submitting || !content.trim() || !selectedBookId}
                className={cn(
                  "px-4 py-2 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3.5 h-3.5" /> Salvar Nota
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Coluna Direita: Lista de Notas */}
      <div className="lg:col-span-8 space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar fichamentos por texto..."
              className="pl-9 bg-card border-border h-9 text-xs font-medium rounded-xl"
            />
          </div>
          <select
            value={filterBookId}
            onChange={(e) => setFilterBookId(e.target.value)}
            className="bg-card h-9 border border-border rounded-xl text-xs font-semibold px-3 outline-none"
          >
            <option value="">Todos os livros</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline das Notas */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-xs font-semibold text-muted-foreground">
              Carregando notas...
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="space-y-3">
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  className="relative group/note bg-card border border-border rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-12 shrink-0 rounded bg-muted border border-border/50 overflow-hidden">
                        {n.bookThumbnail ? (
                          <img
                            src={n.bookThumbnail}
                            alt={n.bookTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Bookmark className="w-4 h-4 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {n.bookTitle}
                        </h4>
                        <p className="text-[10px] text-muted-foreground/60 font-semibold mt-0.5">
                          {n.bookAuthor}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => n.id && handleDeleteNote(n.id)}
                      className="opacity-0 group-hover/note:opacity-100 p-1.5 hover:bg-muted/80 rounded-lg text-rose-500 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground mb-1.5">
                      {n.isQuote && (
                        <Quote className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                      )}
                      {n.chapter && `Cap. ${n.chapter}`}
                      {n.chapter && n.pageNumber && " · "}
                      {n.pageNumber && `Pág. ${n.pageNumber}`}
                      {!n.chapter && !n.pageNumber && "Nota Geral"}
                    </div>

                    <p
                      className={cn(
                        "text-xs leading-relaxed font-medium text-foreground/80",
                        n.isQuote
                          ? "italic font-semibold text-foreground pl-3 border-l-2 border-blue-500/40"
                          : "",
                      )}
                    >
                      {n.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <p className="text-xs text-neutral-600 font-bold">
                Sem Fichamentos Registrados
              </p>
              <p className="text-[10px] text-neutral-600 font-medium max-w-[220px] mt-1 leading-normal">
                Crie sua primeira nota usando o formulário lateral selecionando
                um dos seus livros.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
