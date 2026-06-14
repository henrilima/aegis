"use client";

import { invoke } from "@tauri-apps/api/core";
import { Book, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { DictionaryResultModal } from "../modules/dictionary/components/DictionaryResultModal";
import type { DictionaryEntry } from "../modules/dictionary/types";
import { Kbd } from "../ui/kbd";

export function DictionaryQuickSearch() {
  const theme = getColorTheme(getModuleColor("dictionary"));
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryEntry[] | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelSearchRef = useRef(false);
  const { user } = useAuth();

  const cancelOperation = useCallback(() => {
    setLoading(false);
    cancelSearchRef.current = true;
  }, []);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => {
      setIsOpen(false);
      setIsResultModalOpen(false);
      cancelOperation();
    };

    window.addEventListener("toggle-dictionary-search", handleToggle);
    window.addEventListener("close-all-modals", handleClose);

    return () => {
      window.removeEventListener("toggle-dictionary-search", handleToggle);
      window.removeEventListener("close-all-modals", handleClose);
    };
  }, [cancelOperation]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResult(null);
      setSuggestions([]);
      cancelSearchRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent, term?: string) => {
    e?.preventDefault();
    const finalQuery = term || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setResult(null);
    setSuggestions([]);
    cancelSearchRef.current = false;

    try {
      const res = await invoke<DictionaryEntry[]>("dictionary_search", {
        query: finalQuery,
      });

      if (cancelSearchRef.current) return;

      if (res && res.length > 0) {
        setResult(res);
        setIsResultModalOpen(true);
        setIsOpen(false);
        if (term) setQuery(term);
      } else {
        throw new Error("Empty");
      }
    } catch {
      if (cancelSearchRef.current) return;
      try {
        const suggs = await invoke<string[]>("dictionary_suggestions", {
          query: finalQuery,
        });
        if (cancelSearchRef.current) return;
        if (suggs.length === 1) {
          handleSearch(undefined, suggs[0]);
        } else {
          setSuggestions(suggs);
          if (suggs.length === 0) toast.error("Palavra não encontrada.");
        }
      } catch {
        if (cancelSearchRef.current) return;
        toast.error("Erro na busca.");
      }
    } finally {
      setLoading(false);
    }
  };

  const addToGlossary = async (entry: DictionaryEntry, definition: string) => {
    if (!user) return;
    try {
      await invoke("dictionary_add", {
        word: {
          userId: String(user.id),
          word: entry.word,
          definition: definition,
          phonetic: entry.phonetic,
          sourceUrl: entry.sourceUrls?.[0],
          isFavorite: false,
          createdAt: new Date().toISOString(),
        },
      });
      toast.success("Salvo no glossário!");
      setIsResultModalOpen(false);
      window.dispatchEvent(new CustomEvent("glossary-updated"));
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  if (!isOpen && !isResultModalOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-start justify-center pt-[15vh] p-4">
          <ToolTip content="Fechar Busca">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 border-none outline-none cursor-default w-full h-full"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar busca"
            />
          </ToolTip>

          <div
            className={cn(
              "relative w-full max-w-xl bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200",

              theme.border.split(" ")[0].replace("/20", ""),
            )}
          >
            <form
              onSubmit={handleSearch}
              className="flex items-center px-4 py-3 border-b border-border/60"
            >
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar termo..."
                  className="w-full bg-transparent border-none outline-none text-xl font-medium placeholder:text-muted-foreground/40"
                  disabled={loading}
                />
                <div className="flex items-center gap-2 mt-1 px-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", theme.bg)} />
                  <p className="text-[10px] text-muted-foreground/60 font-medium italic">
                    Dica: Pesquise em inglês para maior precisão nos resultados.
                  </p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className={cn("w-4 h-4 animate-spin", theme.text)} />
                  <button
                    type="button"
                    onClick={cancelOperation}
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      theme.text,
                      theme.textDarkHover,
                    )}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <Kbd>Esc</Kbd>
              )}
            </form>

            <div className="max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    Você quis dizer?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSearch(undefined, s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-bold transition-all",
                          theme.text,
                          theme.bg,
                          theme.bgHover,
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Book className="w-8 h-8 opacity-20" />
                    Digite algo para pesquisar
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <DictionaryResultModal
        results={result}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onSave={addToGlossary}
      />
    </>
  );
}
