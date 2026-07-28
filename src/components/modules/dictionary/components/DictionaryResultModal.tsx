"use client";

import { Book, Check, Edit3, Star, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { DictionaryEntry } from "../types";

interface DictionaryResultModalProps {
  results: DictionaryEntry[] | null;
  searchedQuery?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DictionaryEntry, definition: string) => void;
}

export function DictionaryResultModal({
  results,
  searchedQuery,
  isOpen,
  onClose,
  onSave,
}: DictionaryResultModalProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  // Mapeia o índice do resultado para a palavra associada customizada pelo usuário
  const [customWords, setCustomWords] = useState<Record<number, string>>({});
  // Mapeia quais definições já foram salvas neste modal
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (results) {
      const initial: Record<number, string> = {};
      results.forEach((entry, idx) => {
        initial[idx] = searchedQuery?.trim()
          ? searchedQuery.trim()
          : entry.word;
      });
      setCustomWords(initial);
      setSavedKeys({});
    }
  }, [results, searchedQuery]);

  if (!results) return null;

  const playAudio = (url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio
      .play()
      .catch(() => toast.error("Não foi possível reproduzir o áudio"));
  };

  const handleSaveEntry = (
    entry: DictionaryEntry,
    idx: number,
    definition: string,
    key: string,
  ) => {
    const finalWord = (customWords[idx] || searchedQuery || entry.word).trim();
    onSave(
      {
        ...entry,
        word: finalWord,
      },
      definition,
    );
    setSavedKeys((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg" zIndex="z-[300]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Book className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Resultado da busca</h2>
            <p className="text-xs text-muted-foreground">
              Definições encontradas no dicionário
            </p>
          </div>
        </div>
        <ToolTip content="Fechar">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors text-muted-foreground cursor-pointer",
              theme.bgHover,
              theme.textDarkHover,
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </ToolTip>
      </div>

      {/* Content sem cards aninhados */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="space-y-8">
          {results.map((entry, idx) => (
            <div
              key={`${entry.word}-${entry.phonetic || "none"}-${idx}`}
              className="flex flex-col gap-6"
            >
              {/* Seção plana de edição da palavra associada (sem wrapper de card) */}
              <div className="flex flex-col gap-2 pb-4 border-b border-border/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label
                      htmlFor={`assoc-word-${idx}`}
                      className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      Palavra / termo associado para o glossário
                    </label>
                    <Input
                      id={`assoc-word-${idx}`}
                      type="text"
                      value={customWords[idx] ?? entry.word}
                      onChange={(e) =>
                        setCustomWords((prev) => ({
                          ...prev,
                          [idx]: e.target.value,
                        }))
                      }
                      className="h-10 bg-muted/20 border-border font-bold text-base text-foreground rounded-xl focus:border-sky-500/40"
                      placeholder="Digite a palavra que deseja associar..."
                    />
                  </div>

                  {entry.phonetics?.find((p) => p.audio) && (
                    <ToolTip content="Ouvir pronúncia">
                      <button
                        type="button"
                        onClick={() =>
                          playAudio(entry.phonetics.find((p) => p.audio)?.audio)
                        }
                        className={cn(
                          "p-3 rounded-xl transition-all cursor-pointer self-end mb-0.5",
                          theme.bg,
                          theme.text,
                          theme.solidHover,
                          "hover:text-white",
                        )}
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </ToolTip>
                  )}
                </div>

                {entry.word.toLowerCase() !==
                  (customWords[idx] || "").toLowerCase() && (
                  <span className="text-[10px] text-muted-foreground italic ml-0.5">
                    Tradução/Termo original retornado:{" "}
                    <strong className="font-bold">{entry.word}</strong>
                  </span>
                )}
              </div>

              {/* Lista plana de definições */}
              <div className="space-y-6">
                {entry.meanings.map((meaning, mIdx) => (
                  <div
                    key={`${entry.word}-${idx}-${meaning.partOfSpeech}-${mIdx}`}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-bold text-muted-foreground border border-border">
                        {meaning.partOfSpeech}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <div className="divide-y divide-border/40">
                      {meaning.definitions.map((def, dIdx) => {
                        const defKey = `${idx}-${mIdx}-${dIdx}`;
                        const isSaved = !!savedKeys[defKey];

                        return (
                          <div
                            key={`${entry.word}-${idx}-${mIdx}-${dIdx}`}
                            className="py-3.5 first:pt-1 last:pb-1 flex flex-col gap-2"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm text-foreground leading-relaxed flex-1 italic">
                                "{def.definition}"
                              </p>
                              {isSaved ? (
                                <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" />
                                  Salvo
                                </span>
                              ) : (
                                <ToolTip content="Salvar no glossário">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveEntry(
                                        entry,
                                        idx,
                                        def.definition,
                                        defKey,
                                      )
                                    }
                                    className={cn(
                                      "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                      theme.bg,
                                      theme.text,
                                      theme.solidHover,
                                      "hover:text-white",
                                    )}
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Salvar
                                  </button>
                                </ToolTip>
                              )}
                            </div>
                            {def.example && (
                              <p className="text-xs text-muted-foreground italic pl-3 border-l-2 border-border/60">
                                ex: {def.example}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-card border-t border-border flex justify-end shrink-0">
        <ToolTip content="Fechar resultados">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-8 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            Fechar resultados
          </button>
        </ToolTip>
      </div>
    </ModalShell>
  );
}
