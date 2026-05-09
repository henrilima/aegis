"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { ReadingBook } from "../types";

interface BookSelectProps {
  books: ReadingBook[];
  value?: number;
  onChange: (id: number) => void;
}

/**
 * Dropdown customizado para seleção de livro na SessionModal.
 * Evita usar o Select do Radix para manter compatibilidade com o layout do modal.
 */
export function BookSelect({ books, value, onChange }: BookSelectProps) {
  const theme = getColorTheme(getModuleColor("reading"));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = books.find((b) => Number(b.id) === Number(value));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-all",
          theme.borderHover.replace(
            "hover:",
            "focus:ring-2 focus:ring-offset-0 focus:outline-none focus:ring-",
          ),
          "hover:bg-accent/50/60",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected ? selected.title : "Selecione o livro..."}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-h-56 overflow-y-auto p-1">
            {books.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-600">
                Nenhum livro na biblioteca
              </div>
            ) : (
              books.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(Number(b.id));
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    Number(b.id) === Number(value)
                      ? cn(theme.bg, theme.text)
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                  <span className="truncate">{b.title}</span>
                  {Number(b.id) === Number(value) && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-semibold",
                        theme.text,
                      )}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
