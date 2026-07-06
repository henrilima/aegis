/**
 * Seletor de cor reutilizável para notas e outros itens.
 * Extraído do InlineColorPicker do MarkdownToolbar.
 */
"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  /** Chave da cor selecionada (ex: "red", "blue") ou string vazia para padrão */
  value: string;
  onChange: (color: string) => void;
  /** Se verdadeiro, renderiza como swatches inline (sem dropdown) */
  inline?: boolean;
  /** Elemento filho que dispara o dropdown — ignora em modo inline */
  children?: React.ReactNode;
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  inline = false,
  children,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Swatches de cor (usados em modo inline ou dentro do dropdown)
  const swatches = (
    <div className={cn("flex flex-col gap-0.5 p-1", className)}>
      {/* Opção "Sem cor" */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onChange("");
          setIsOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium text-foreground",
          !value ? "bg-muted/60" : "hover:bg-muted/40",
        )}
      >
        <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-transparent shrink-0" />
        <span>Padrão</span>
        {!value && <Check className="w-3 h-3 ml-auto text-muted-foreground" />}
      </button>

      <div className="h-px bg-border/40 my-0.5 mx-1" />

      {SELECTABLE_COLORS.map((c) => {
        const hex = resolveColor(c.key);
        return (
          <button
            key={c.key}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(c.key);
              setIsOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium text-foreground",
              value === c.key ? "bg-muted/60" : "hover:bg-muted/40",
            )}
          >
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: hex }}
            />
            <span>{c.label}</span>
            {value === c.key && (
              <Check className="w-3 h-3 ml-auto text-muted-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );

  // Modo inline: apenas os swatches, sem botão/dropdown
  if (inline) {
    return swatches;
  }

  // Modo dropdown: botão disparador + popover
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="w-full text-left bg-transparent border-none p-0 focus:outline-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {children}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-44 bg-card border border-border rounded-xl z-9999 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
            {swatches}
          </div>
        </div>
      )}
    </div>
  );
}
