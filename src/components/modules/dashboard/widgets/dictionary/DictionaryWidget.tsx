"use client";

import { Book, Search } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { GlossaryWord } from "../../../dictionary/types";
import { BaseWidget } from "../BaseWidget";

interface DictionaryWidgetProps {
  words: GlossaryWord[];
  className?: string;
  isInteractive?: boolean;
}

export function DictionaryWidget({
  words,
  className,
  isInteractive,
}: DictionaryWidgetProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  const recentWords = [...words]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const hasData = words.length > 0;

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("toggle-dictionary-search"));
  };

  return (
    <BaseWidget
      title="Dicionário"
      icon={Book}
      color={color}
      route="dictionary"
      className={className}
      isInteractive={isInteractive}
      onToggleInteractive={() => {}}
    >
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-full py-6 text-center">
          <Book className="w-8 h-8 text-muted-foreground/20 mb-2" />
          <p className="text-xs text-muted-foreground">Glossário vazio.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {words.length}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                Palavras salvas
              </span>
            </div>
            {isInteractive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openSearch();
                }}
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer border",
                  theme.bg,
                  theme.text,
                  theme.border,
                  theme.bgHover,
                )}
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground">
              Recém adicionadas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {recentWords.map((word) => (
                <div
                  key={word.id}
                  className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1 min-w-0"
                >
                  <p className="text-xs font-bold truncate leading-none">
                    {word.word}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                    {word.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
