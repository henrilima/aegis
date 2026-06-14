"use client";

import { Book, Star, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "@/components/ui/ModalShell";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { DictionaryEntry } from "../types";

interface DictionaryResultModalProps {
  results: DictionaryEntry[] | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DictionaryEntry, definition: string) => void;
}

export function DictionaryResultModal({
  results,
  isOpen,
  onClose,
  onSave,
}: DictionaryResultModalProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  if (!results) return null;

  const playAudio = (url?: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio
      .play()
      .catch(() => toast.error("Não foi possível reproduzir o áudio"));
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
            <h2 className="text-lg font-bold">Resultado da Busca</h2>
            <p className="text-xs text-muted-foreground">
              Definições encontradas para o termo
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

      {/* Content */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="space-y-8">
          {results.map((entry, idx) => (
            <div
              key={`${entry.word}-${entry.phonetic || "none"}-${idx}`}
              className="flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold text-foreground leading-tight">
                    {entry.word}
                  </h1>
                  {entry.phonetic && (
                    <span className={cn("font-mono text-sm", theme.text)}>
                      {entry.phonetic}
                    </span>
                  )}
                </div>
                {entry.phonetics?.find((p) => p.audio) && (
                  <ToolTip content="Ouvir Pronúncia">
                    <button
                      type="button"
                      onClick={() =>
                        playAudio(entry.phonetics.find((p) => p.audio)?.audio)
                      }
                      className={cn(
                        "p-3 rounded-full transition-all cursor-pointer",
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

              <div className="space-y-6">
                {entry.meanings.map((meaning, mIdx) => (
                  <div
                    key={`${entry.word}-${idx}-${meaning.partOfSpeech}-${mIdx}`}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase text-muted-foreground border border-border">
                        {meaning.partOfSpeech}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>

                    <div className="grid gap-3">
                      {meaning.definitions.map((def, dIdx) => (
                        <div
                          key={`${entry.word}-${idx}-${mIdx}-${dIdx}`}
                          className={cn(
                            "group bg-card/40 border border-border/50 rounded-xl p-4 transition-all",
                            theme.borderHover.replace("hover:", "hover:"),
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm text-foreground leading-relaxed flex-1 italic">
                              "{def.definition}"
                            </p>
                            <ToolTip content="Salvar no Glossário">
                              <button
                                type="button"
                                onClick={() => onSave(entry, def.definition)}
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
                          </div>
                          {def.example && (
                            <p className="mt-2 text-xs text-muted-foreground pl-4 border-border italic">
                              ex: {def.example}
                            </p>
                          )}
                        </div>
                      ))}
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
        <ToolTip content="Fechar Resultados">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-8 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            Fechar Resultados
          </button>
        </ToolTip>
      </div>
    </ModalShell>
  );
}
