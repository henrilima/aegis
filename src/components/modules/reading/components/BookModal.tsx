"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  AlignLeft,
  Book,
  Bookmark,
  BookOpen,
  ChevronRight,
  Hash,
  Image as ImageIcon,
  Search,
  Star,
  StarHalf,
  Tag,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook, ReadingStatus } from "../types";

interface BookModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (book: ReadingBook) => void;
  editBook?: ReadingBook;
  existingCategories?: string[];
  isSaving?: boolean;
}

interface SearchResult {
  key: string;
  title: string;
  author: string;
  pages: number;
  thumbnail: string;
  category: string;
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      pageCount?: number;
      imageLinks?: { thumbnail: string };
      categories?: string[];
    };
  }>;
}

const DEFAULT_FORM: Partial<ReadingBook> = {
  title: "",
  author: "",
  totalPages: 0,
  currentPage: 0,
  status: "Reading",
  category: "Geral",
  thumbnail: "",
  stars: 0,
  review: "",
};

export function BookModal({
  show,
  onClose,
  onSave,
  isSaving = false,
  existingCategories = [],
  editBook,
}: BookModalProps) {
  const color = getModuleColor("reading");
  const themeStyles = getColorTheme(color);
  const [formData, setFormData] = useState<Partial<ReadingBook>>(DEFAULT_FORM);
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
    if (show) {
      if (editBook) {
        setFormData(editBook);
      } else {
        setFormData(DEFAULT_FORM);
        setSearchResults([]);
        setSearchQuery("");
      }
    }
  }, [show, editBook]);

  if (!show) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const data = await invoke<GoogleBooksResponse>("reading_search_books", {
        query: searchQuery,
      });
      if (data.items && data.items.length > 0) {
        const results: SearchResult[] = data.items.map((item, index) => {
          const info = item.volumeInfo;
          return {
            key: String(index),
            title: info.title || "Sem título",
            author: info.authors ? info.authors[0] : "Autor desconhecido",
            pages: info.pageCount || 0,
            thumbnail:
              info.imageLinks?.thumbnail?.replace("http:", "https:") || "",
            category: info.categories ? info.categories[0] : "Geral",
          };
        });
        setSearchResults(results);
      } else {
        toast.error("Nenhum livro encontrado para essa busca");
      }
    } catch (e) {
      console.error("Erro na busca:", e);
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
      totalPages: result.pages,
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
    if (!formData.totalPages || formData.totalPages <= 0) {
      toast.error("Campo obrigatório: Total de páginas");
      return;
    }

    onSave(formData as ReadingBook);
  };

  const set = <K extends keyof ReadingBook>(field: K, value: ReadingBook[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const inputClass = cn(
    "h-10 bg-card border-border text-sm font-medium placeholder:text-muted-foreground/40 focus-visible:ring-1 rounded-xl",
    themeStyles.borderHover.replace("hover:", "focus-visible:"),
    themeStyles.border.replace("border-", "focus-visible:ring-"),
  );
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-background border border-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
              <BookOpen className={cn("w-5 h-5", themeStyles.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {editBook ? "Editar Obra" : "Adicionar à Biblioteca"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestão de acervo e progresso
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

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!editBook && (
            <div className="mb-6 space-y-3">
              <Label className={labelClass}>Busca online</Label>
              <div className="flex gap-2 p-1.5 bg-muted/30 rounded-xl border border-border/50">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                  <input
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium h-9 pl-9 pr-4 placeholder:text-muted-foreground/40 outline-none"
                    placeholder="Pesquisar por título ou autor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className={cn(
                    "h-9 px-4 rounded-lg text-white font-bold text-xs transition-all active:scale-95 shrink-0",
                    themeStyles.solid,
                    themeStyles.solidHover,
                  )}
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden bg-card/40 divide-y divide-border/40 max-h-60 overflow-y-auto custom-scrollbar">
                  {searchResults.map((result) => (
                    <button
                      key={result.key}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 transition-all text-left group",
                        themeStyles.bgHover,
                      )}
                    >
                      <div className="w-8 h-12 shrink-0 rounded bg-muted border border-border/50 overflow-hidden">
                        {result.thumbnail && (
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold text-foreground truncate transition-colors",
                            themeStyles.textDarkHover.replace(
                              "hover:",
                              "group-hover:",
                            ),
                          )}
                        >
                          {result.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.author}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Título</Label>
                  <div className="relative">
                    <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    <Input
                      value={formData.title ?? ""}
                      onChange={(e) => set("title", e.target.value)}
                      className={cn(inputClass, "pl-9")}
                      placeholder="Ex: Dom Casmurro"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Autor</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    <Input
                      value={formData.author ?? ""}
                      onChange={(e) => set("author", e.target.value)}
                      className={cn(inputClass, "pl-9")}
                      placeholder="Ex: Machado de Assis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Páginas totais</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                      <Input
                        type="number"
                        value={formData.totalPages || ""}
                        onChange={(e) =>
                          set("totalPages", parseInt(e.target.value, 10) || 0)
                        }
                        className={cn(inputClass, "pl-9")}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Página atual</Label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                      <Input
                        type="number"
                        value={formData.currentPage || ""}
                        onChange={(e) =>
                          set("currentPage", parseInt(e.target.value, 10) || 0)
                        }
                        className={cn(inputClass, "pl-9")}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Status de leitura</Label>
                  <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-xl border border-border/50">
                    {(
                      [
                        { id: "WantToRead", label: "Quero ler" },
                        { id: "Reading", label: "Lendo" },
                        { id: "Completed", label: "Lido" },
                        { id: "Dropped", label: "Parei" },
                      ] as { id: ReadingStatus; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => set("status", opt.id)}
                        className={cn(
                          "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                          formData.status === opt.id
                            ? cn(themeStyles.solid, "text-white")
                            : "text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Gênero / Categoria</Label>
                  <div className="relative group">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    <Input
                      value={formData.category ?? ""}
                      onChange={(e) => {
                        set("category", e.target.value);
                        setShowCategorySuggestions(true);
                      }}
                      onFocus={() => setShowCategorySuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowCategorySuggestions(false), 200)
                      }
                      className={cn(inputClass, "pl-9")}
                    />
                    {showCategorySuggestions &&
                      filteredCategories.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl overflow-hidden">
                          {filteredCategories.slice(0, 5).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                set("category", cat);
                                setShowCategorySuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>URL da capa</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    <Input
                      value={formData.thumbnail ?? ""}
                      onChange={(e) => set("thumbnail", e.target.value)}
                      className={cn(inputClass, "pl-9")}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <Label className={labelClass}>Avaliação</Label>
                <div className="flex gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const current = formData.stars ?? 0;
                    const isFullActive = current >= n;
                    const isHalfActive = current >= n - 0.5 && current < n;
                    return (
                      <div
                        key={n}
                        className="relative w-7 h-7 cursor-pointer group"
                      >
                        <Star
                          fill="currentColor"
                          className={cn(
                            "absolute inset-0 w-7 h-7 transition-all",
                            isFullActive
                              ? themeStyles.text
                              : "text-muted-foreground/20",
                          )}
                        />
                        {isHalfActive && (
                          <StarHalf
                            fill="currentColor"
                            className={cn(
                              "absolute inset-0 w-7 h-7",
                              themeStyles.text,
                            )}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            set("stars", current === n - 0.5 ? 0 : n - 0.5)
                          }
                          className="absolute left-0 top-0 w-1/2 h-full z-10 hover:opacity-80 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => set("stars", current === n ? 0 : n)}
                          className="absolute right-0 top-0 w-1/2 h-full z-10 hover:opacity-80 transition-opacity"
                        />
                      </div>
                    );
                  })}
                  {(formData.stars ?? 0) > 0 && (
                    <span
                      className={cn(
                        "ml-2 self-center text-xs font-bold",
                        themeStyles.text,
                      )}
                    >
                      {formData.stars} ★
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Resenha / Notas</Label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  <textarea
                    value={formData.review ?? ""}
                    onChange={(e) => set("review", e.target.value)}
                    className={cn(
                      "w-full rounded-xl bg-card border border-border text-sm font-medium p-3 pl-9 min-h-[100px] resize-none outline-none transition-all text-foreground placeholder:text-muted-foreground/40",
                      themeStyles.borderHover.replace("hover:", "focus:"),
                      themeStyles.border.replace("border-", "focus:ring-"),
                    )}
                    placeholder="Suas impressões sobre a obra..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50",
              themeStyles.solid,
              themeStyles.solidHover,
            )}
          >
            {isSaving
              ? "Salvando..."
              : editBook
                ? "Atualizar"
                : "Salvar na Estante"}
          </button>
        </div>
      </div>
    </div>
  );
}
