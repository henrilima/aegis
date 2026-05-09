"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  placeholder?: string; // Ex: "Nenhuma", "Padrão", "Automático"
}

/**
 * Componente global de seleção de cores para módulos (Notas, Tarefas, etc.)
 * Implementa um dropdown customizado para evitar problemas de alinhamento do Radix.
 */
export function ColorPicker({
  value,
  onChange,
  className,
  placeholder = "Padrão",
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedColor = SELECTABLE_COLORS.find((c) => c.key === value);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between group transition-all hover:border-border/80",
          isOpen && "ring-2 ring-primary/20 border-primary/50",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/10"
            style={{
              backgroundColor: value ? resolveColor(value) : "transparent",
            }}
          />
          <span className="truncate text-sm font-medium text-foreground">
            {selectedColor?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Menu do Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              <div className="w-3.5 h-3.5 rounded-full border border-white/10 bg-transparent" />
              <span>{placeholder}</span>
            </button>
            <div className="h-px bg-border/40 my-1 mx-1" />
            {SELECTABLE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  onChange(c.key);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: resolveColor(c.key) }}
                />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
