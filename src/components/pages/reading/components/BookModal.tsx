"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Book,
  Bookmark,
  BookOpen,
  ChevronRight,
  Hash,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReadingBook, ReadingStatus } from "../types";

interface BookModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (book: ReadingBook) => void;
  editBook?: ReadingBook;
  existingCategories?: string[];
}

interface SearchResult {
  key: string;
  title: string;
  author: string;
  pages: number;
  thumbnail: string;
  category: string;
}

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
}

interface OpenLibraryResponse {
  docs: OpenLibraryBook[];
}

function StatusSelect({
  value,
  onChange,
}: {
  value: ReadingStatus;
  onChange: (val: ReadingStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "WantToRead", label: "Quero Ler" },
    { value: "Reading", label: "Lendo" },
    { value: "Completed", label: "Lido" },
    { value: "Dropped", label: "Interrompido" },
  ];
  const selected = options.find((o) => o.value === value) || options[1];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-card border border-border h-11 rounded-xl px-4 flex items-center justify-between w-full text-sm font-medium text-foreground hover:bg-accent/50/60 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <span>{selected.label}</span>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-neutral-600 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value as ReadingStatus);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all",
                  value === opt.value
                    ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BookModal({
  show,
  onClose,
  onSave,
  editBook,
  existingCategories = [],
  isSaving = false,
}: BookModalProps & { isSaving?: boolean }) {
  const [formData, setFormData] = useState<Partial<ReadingBook>>({
    title: "",
    author: "",
    total_pages: 0,
    current_page: 0,
    status: "Reading",
    category: "Geral",
    thumbnail: "",
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const filteredCategories = useMemo(() => {
    const val = (formData.category || "").toLowerCase();
    if (!val) return [];
    return existingCategories.filter(
      (cat) => cat.toLowerCase().includes(val) && cat.toLowerCase() !== val,
    );
  }, [formData.category, existingCategories]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (show) {
      window.addEventListener("keydown", handleEscape);
      if (editBook) {
        setFormData(editBook);
      } else {
        setFormData({
          title: "",
          author: "",
          total_pages: 0,
          current_page: 0,
          status: "Reading",
          category: "Geral",
          thumbnail: "",
        });
        setSearchResults([]);
        setSearchQuery("");
      }
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, editBook, onClose]);

  if (!show) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const data = await invoke<OpenLibraryResponse>("reading_search_books", {
        query: searchQuery,
      });
      if (data.docs && data.docs.length > 0) {
        const results: SearchResult[] = data.docs.slice(0, 5).map((book) => ({
          key: book.key,
          title: book.title || "Sem título",
          author: book.author_name ? book.author_name[0] : "Autor desconhecido",
          pages: book.number_of_pages_median || 0,
          thumbnail: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : "",
          category: book.subject ? book.subject[0] : "Geral",
        }));
        setSearchResults(results);
      } else {
        toast.error("Nenhum livro encontrado para essa busca");
      }
    } catch (e) {
      console.error("Open Library API error:", e);
      toast.error("Erro ao buscar livro. Verifique sua conexão.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setFormData({
      ...formData,
      title: result.title,
      author: result.author,
      total_pages: result.pages,
      thumbnail: result.thumbnail,
      category: result.category,
    });
    setSearchResults([]);
    toast.success("Livro selecionado!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Campo obrigatório: Título do livro");
      return;
    }
    if (!formData.author?.trim()) {
      toast.error("Campo obrigatório: Autor da obra");
      return;
    }
    if (!formData.total_pages || formData.total_pages <= 0) {
      toast.error("Campo obrigatório: Total de páginas (deve ser maior que 0)");
      return;
    }

    onSave(formData as ReadingBook);
  };

  const labelClass = "text-xs font-semibold text-muted-foreground mb-2 block";
  const requiredClass = "text-orange-500 ml-1";
  const inputClass =
    "bg-card border-border focus-visible:ring-orange-500/20 h-11 rounded-xl text-sm font-medium";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <BookOpen className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {editBook ? "Editar obra" : "Adicionar à biblioteca"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Gestão de acervo e progresso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!editBook && (
            <div className="mb-6">
              <div className="bg-card/40 p-1.5 rounded-xl border border-border flex items-center gap-3">
                <Search className="w-4 h-4 text-neutral-600 ml-3 shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium h-9 placeholder:text-neutral-700 outline-none"
                  placeholder="Pesquisar na Open Library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="h-9 px-4 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/40 text-orange-600 dark:text-orange-400 font-semibold text-xs transition-all active:scale-[0.98] shrink-0"
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border border-border rounded-xl overflow-hidden bg-card/60 divide-y divide-neutral-800/60">
                  {searchResults.map((result) => (
                    <button
                      key={result.key}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-500/5 transition-all text-left group"
                    >
                      <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-neutral-800 border border-border/50">
                        {result.thumbnail ? (
                          <Image
                            src={result.thumbnail}
                            alt={result.title}
                            width={40}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-neutral-700" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600 dark:text-orange-400 transition-colors">
                          {result.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {result.author}
                        </p>
                        {result.pages > 0 && (
                          <p className="text-[10px] text-neutral-700 mt-0.5">
                            {result.pages} páginas
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-orange-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <Label className={labelClass}>
                    Título <span className={requiredClass}>*</span>
                  </Label>
                  <div className="relative group">
                    <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      className={cn(inputClass, "pl-11")}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Ex: Dom Casmurro"
                    />
                  </div>
                </div>

                <div>
                  <Label className={labelClass}>
                    Autor <span className={requiredClass}>*</span>
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                      className={cn(inputClass, "pl-11")}
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      placeholder="Ex: Machado de Assis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClass}>Gênero</Label>
                    <div className="relative group">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        className={cn(inputClass, "pl-11")}
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          });
                          setShowCategorySuggestions(true);
                        }}
                        onFocus={() => setShowCategorySuggestions(true)}
                        onBlur={() =>
                          setTimeout(
                            () => setShowCategorySuggestions(false),
                            200,
                          )
                        }
                      />

                      {/* Autocomplete sugeridos */}
                      {showCategorySuggestions &&
                        filteredCategories.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="p-1">
                              {filteredCategories.slice(0, 5).map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, category: cat });
                                    setShowCategorySuggestions(false);
                                  }}
                                  className="w-full text-left px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all py-2.5"
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  <div>
                    <Label className={labelClass}>Status</Label>
                    <StatusSelect
                      value={formData.status || "Reading"}
                      onChange={(val) =>
                        setFormData({ ...formData, status: val })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClass}>
                      Páginas totais <span className={requiredClass}>*</span>
                    </Label>
                    <div className="relative group">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        type="number"
                        className={cn(inputClass, "pl-11")}
                        value={formData.total_pages || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_pages: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className={labelClass}>Página atual</Label>
                    <div className="relative group">
                      <Bookmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        type="number"
                        className={cn(inputClass, "pl-11")}
                        value={formData.current_page || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            current_page: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className={labelClass}>Capa (URL)</Label>
                  <Input
                    className={inputClass}
                    value={formData.thumbnail}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnail: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                {formData.thumbnail && (
                  <div className="relative group w-20 h-28 mx-auto rounded-xl overflow-hidden border border-border transition-transform hover:scale-105 duration-300">
                    <Image
                      src={formData.thumbnail}
                      alt="Preview"
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Book className="w-4 h-4 text-foreground/50" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-8 mt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-2 h-11 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? "Salvando..."
                  : editBook
                    ? "Salvar alterações"
                    : "Adicionar à biblioteca"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
