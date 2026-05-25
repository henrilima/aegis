"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  placeholder?: string;
  defaultColor?: string;
}

/**
 * Componente global de seleção de cores.
 * Apresenta um trigger elegante (estilo select) que expande uma gaveta inline suave (Accordion).
 * Sem popovers ou portais, garantindo estabilidade total de scroll/alinhamento no Tauri.
 * Evita duplicação da cor padrão e fornece hover tracking dinâmico de cores.
 */
export function ColorPicker({
  value,
  onChange,
  className,
  placeholder = "Padrão",
  defaultColor,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Cores que precisam de ícone escuro para contraste
  const LIGHT_COLORS = ["yellow", "lime", "amber"];

  const selectedColor = SELECTABLE_COLORS.find((c) => c.key === value);
  const isDefaultSelected = !value;

  const displayColor = value
    ? resolveColor(value)
    : defaultColor
      ? resolveColor(defaultColor)
      : undefined;

  // Não filtra mais para permitir que a cor padrão seja selecionável normalmente
  const filteredColors = SELECTABLE_COLORS;

  const handleSelect = (colorKey: string) => {
    onChange(colorKey);
    setOpen(false);
  };

  const _defaultHex = defaultColor ? resolveColor(defaultColor) : undefined;
  const _isDefaultLight = defaultColor
    ? LIGHT_COLORS.includes(defaultColor)
    : false;

  return (
    <div className={cn("w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full h-11 bg-card border border-border rounded-xl px-4 flex items-center justify-between transition-all hover:border-border/80 cursor-pointer",
          open && "ring-2 ring-primary/20 border-primary/50",
        )}
      >
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "w-3.5 h-3.5 rounded-full border shrink-0",
              displayColor
                ? "border-white/10"
                : "border-dashed border-muted-foreground",
            )}
            style={{ backgroundColor: displayColor }}
          />
          <span className="truncate text-sm font-medium text-foreground">
            {selectedColor?.label ||
              (isDefaultSelected && defaultColor
                ? `${placeholder} (${SELECTABLE_COLORS.find((c) => c.key === defaultColor)?.label})`
                : placeholder)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Painel de Cores Retrátil (Smooth Accordion Height Animation com Framer Motion) */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              marginTop: 8,
              transition: {
                height: { type: "spring", stiffness: 350, damping: 25 },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              marginTop: 0,
              transition: {
                height: { type: "spring", stiffness: 350, damping: 25 },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden w-full"
          >
            <div className="bg-muted/15 border border-border/60 rounded-xl p-3.5 space-y-3">
              {/* Header dinâmico com Hover State */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-bold px-0.5">
                <span>PALETA DE CORES</span>
                <span className="text-primary uppercase transition-all duration-150">
                  {hoveredColor ||
                    selectedColor?.label ||
                    (isDefaultSelected ? placeholder : "")}
                </span>
              </div>

              {/* Grid de círculos */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5">
                {/* Botão de opção Padrão */}
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  onMouseEnter={() => setHoveredColor(placeholder)}
                  onMouseLeave={() => setHoveredColor(null)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer relative shrink-0 border border-dashed",
                    isDefaultSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-105"
                      : "border-muted-foreground/40 hover:border-muted-foreground/70 bg-muted/20",
                  )}
                >
                  {isDefaultSelected ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                  )}
                </button>

                {/* Cores filtradas para evitar duplicações */}
                {filteredColors.map((c) => {
                  const isSelected = value === c.key;
                  const hex = resolveColor(c.key);
                  const isLight = LIGHT_COLORS.includes(c.key);

                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleSelect(c.key)}
                      onMouseEnter={() => setHoveredColor(c.label)}
                      onMouseLeave={() => setHoveredColor(null)}
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer relative shrink-0",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background scale-105"
                          : "border-white/10 hover:border-white/20",
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {isSelected && (
                        <Check
                          className={cn(
                            "w-4 h-4 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]",
                            isLight ? "text-neutral-900" : "text-white",
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
