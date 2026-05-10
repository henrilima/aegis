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
        <div className="flex items-center justify-between">
          <div>
            <span className="text-4xl font-black text-foreground leading-none">
              {words.length}
            </span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Termos Salvos
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openSearch();
            }}
            className={cn(
              "h-9 w-9 p-0 rounded-xl border-none active:scale-95 transition-all text-white",
              theme.solid,
              theme.solidHover,
            )}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {!hasData ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center bg-neutral-800/20 rounded-2xl border border-dashed border-border/40">
            <Book className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-neutral-600 font-medium italic">
              Glossário vazio.
            </p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
              Recém Adicionadas
            </p>
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1">
              {recentWords.map((word) => (
                <div
                  key={word.id}
                  className="p-3 rounded-2xl bg-neutral-800/30 border border-border/50 flex flex-col gap-1"
                >
                  <p className={cn("text-xs font-bold truncate", theme.text)}>
                    {word.word}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic font-medium leading-tight">
                    {word.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
