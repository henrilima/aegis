"use client";

import { Book, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { GlossaryWord } from "../../../dictionary/types";
import { BaseWidget } from "../BaseWidget";

interface DictionaryWidgetProps {
  words: GlossaryWord[];
  className?: string;
  isEditMode?: boolean;
}

export function DictionaryWidget({
  words,
  className,
  isEditMode,
}: DictionaryWidgetProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  const recentWords = [...words]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
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
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-[4cqw] @sm:gap-4">
            <div className="text-left">
              <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                {words.length}
              </span>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">
                Termos Salvos
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openSearch();
            }}
            className={cn(
              "h-7 w-7 p-0 rounded-lg border-none active:scale-95 transition-all text-white flex items-center justify-center shrink-0",
              theme.solid,
              theme.solidHover,
            )}
          >
            <Search className="w-3.5 h-3.5" />
          </Button>
        </div>

        {!hasData ? (
          <div className="flex-1 flex flex-col items-start justify-center py-6 bg-neutral-900/10 rounded-2xl border border-dashed border-border/40">
            <Book className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-neutral-600 font-medium italic">
              Glossário vazio.
            </p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-hidden text-left">
            <p className="text-[10px] font-bold text-muted-foreground px-1 text-left">
              Recém Adicionadas
            </p>
            <div className="grid grid-cols-1 gap-2 overflow-y-auto custom-scrollbar pr-1">
              {recentWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30 text-lime-500">
                      <Book className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className={cn("text-sm font-bold truncate", theme.text)}
                      >
                        {word.word}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 italic font-medium mt-0.5 leading-normal">
                        {word.definition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
