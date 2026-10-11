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
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs text-foreground font-bold">
              Dicionário vazio
            </p>
            <p className="text-[10px] text-muted-foreground font-medium max-w-45 mt-0.5">
              Adicione palavras desconhecidas ou termos técnicos para construir
              seu vocabulário.
            </p>
          </div>
        ) : (
          <div className="space-y-1 flex-1 overflow-hidden text-left">
            <p className="text-[10px] font-bold text-muted-foreground px-1 text-left pb-1">
              Recém adicionadas
            </p>
            <div className="divide-y divide-border/30 overflow-y-auto custom-scrollbar">
              {recentWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between py-2 px-2 rounded-xl transition-colors hover:bg-muted/40 gap-3 text-left"
                >
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span
                      className={cn("text-xs font-bold truncate", theme.text)}
                    >
                      {word.word}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 italic font-medium leading-normal">
                      {word.definition}
                    </span>
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
