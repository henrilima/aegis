"use client";

import { invoke } from "@tauri-apps/api/core";
import { Book, Loader2, Search, Sparkles } from "lucide-react";
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
          <ToolTip content="Fechar busca">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 border-none outline-none cursor-default w-full h-full"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar busca"
            />
          </ToolTip>

          <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
            <form
              onSubmit={handleSearch}
              className="flex items-center px-4 py-3.5 border-b border-border/60 gap-3"
            >
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar palavra ou tradução..."
                  className="w-full bg-transparent border-none outline-none text-md font-medium text-foreground placeholder:text-muted-foreground/40"
                  disabled={loading}
                />
              </div>

              {loading ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Loader2 className={cn("w-4 h-4 animate-spin", theme.text)} />
                  <button
                    type="button"
                    onClick={cancelOperation}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <Kbd className="bg-muted/60 text-muted-foreground border-border text-[9px] px-1.5 py-0.5">
                  Esc
                </Kbd>
              )}
            </form>

            <div className="max-h-70 overflow-y-auto p-4 custom-scrollbar">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Você quis dizer?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSearch(undefined, s)}
                        className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent/50 text-xs font-bold text-foreground transition-all active:scale-95 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <Book className="w-7 h-7 opacity-30" />
                    <span>
                      Digite qualquer palavra para buscar significados e
                      pronúncias no dicionário.
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <DictionaryResultModal
        results={result}
        searchedQuery={query}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onSave={addToGlossary}
      />
    </>
  );
}
