"use client";

import { Minus, Plus } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  applySnippetExpansion,
  getWordSuggestion,
} from "@/lib/wordSuggestions";

interface InputProps extends React.ComponentProps<"input"> {
  enableSuggestions?: boolean;
}

function getWrapperClasses(className?: string) {
  if (!className) return "";
  const classes = className.split(/\s+/);
  const wrapperPatterns = [
    /^w-/,
    /^min-w-/,
    /^max-w-/,
    /^m-/,
    /^mt-/,
    /^mb-/,
    /^ml-/,
    /^mr-/,
    /^mx-/,
    /^my-/,
    /^flex-/,
    /^grid-/,
    /^col-/,
    /^row-/,
    /^self-/,
    /^justify-/,
    /^items-/,
    /^(relative|absolute|fixed|static)/,
    /^grow/,
    /^shrink/,
  ];
  return classes
    .filter((cls) => wrapperPatterns.some((pattern) => pattern.test(cls)))
    .join(" ");
}

function getTypographyClasses(className?: string) {
  if (!className) return "text-base";
  const classes = className.split(/\s+/);
  const typoPatterns = [
    /^text-(xs|sm|base|lg|xl|2xl|3xl)/,
    /^font-/,
    /^tracking-/,
    /^leading-/,
  ];
  const matched = classes.filter((cls) =>
    typoPatterns.some((pattern) => pattern.test(cls)),
  );
  if (!matched.some((cls) => /^text-(xs|sm|base|lg|xl)/.test(cls))) {
    matched.push("text-base");
  }
  return matched.join(" ");
}

function getPaddingClasses(className?: string) {
  if (!className) return "px-3 py-1";
  const classes = className.split(/\s+/);
  const padPatterns = [/^p[xylrtb]?-/, /^p-/];
  const matched = classes.filter((cls) =>
    padPatterns.some((pattern) => pattern.test(cls)),
  );
  return matched.length > 0 ? matched.join(" ") : "px-3 py-1";
}

function Input({
  className,
  type,
  onChange,
  onFocus,
  onBlur,
  onClick,
  onKeyDown,
  autoComplete = "off",
  enableSuggestions,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestionData, setSuggestionData] = useState<{
    suffix: string;
    suggestion: string;
    completedText: string;
    typedText: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ghostRef.current && inputRef.current) {
      ghostRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, []);

  const handleStep = (increment: boolean) => {
    const input = inputRef.current;
    if (!input) return;

    const min = input.min !== "" ? Number(input.min) : -Infinity;
    const max = input.max !== "" ? Number(input.max) : Infinity;
    const step =
      input.step !== "" && Number(input.step) ? Number(input.step) : 1;
    const currentValue = input.value !== "" ? Number(input.value) : 0;

    let newValue = increment ? currentValue + step : currentValue - step;

    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;

    // Usa setter nativo para disparar a vinculação de estado do React corretamente
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(input, String(newValue));

    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);

    if (onChange) {
      const changeEvent = {
        target: input,
        currentTarget: input,
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(changeEvent);
    }
  };

  const startStepping = (increment: boolean) => {
    stopStepping();
    handleStep(increment);
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        handleStep(increment);
      }, 80);
    }, 400);
  };

  const stopStepping = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopStepping();
  }, [stopStepping]);

  const isNumber = type === "number";
  const isBorderless = className?.includes("border-none");
  const isTimeOrDate =
    type === "date" || type === "time" || type === "datetime-local";
  const isTextual = !type || type === "text" || type === "search";
  const canSuggest =
    enableSuggestions !== undefined ? enableSuggestions : isTextual;

  const handlePickerOpen = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      if ("showPicker" in HTMLInputElement.prototype) {
        input.showPicker();
      }
    } catch (_error) {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (canSuggest) {
      const val = e.target.value;
      const sug = getWordSuggestion(val);
      if (sug) {
        setSuggestionData({
          suffix: sug.suffix,
          suggestion: sug.suggestion,
          completedText: sug.completedText,
          typedText: val,
        });
      } else {
        setSuggestionData(null);
      }
    }
    if (onChange) onChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (canSuggest && suggestionData) {
      const input = inputRef.current;
      const isCursorAtEnd =
        input !== null &&
        input.selectionStart !== null &&
        input.selectionStart === input.value.length;

      // Tab ou Seta Direita no final do texto aceita a sugestão
      if (e.key === "Tab" || (e.key === "ArrowRight" && isCursorAtEnd)) {
        e.preventDefault();
        const completed = suggestionData.completedText;

        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(input, completed);

          const inputEvent = new Event("input", { bubbles: true });
          input.dispatchEvent(inputEvent);

          if (onChange) {
            const changeEvent = {
              target: input,
              currentTarget: input,
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(changeEvent);
          }
        }
        setSuggestionData(null);
        return;
      }

      // Escape descarta a sugestão atual
      if (e.key === "Escape") {
        setSuggestionData(null);
        return;
      }
    }

    // Espaço: verifica se há um atalho de texto a expandir
    if (canSuggest && e.key === " ") {
      const input = inputRef.current;
      if (input) {
        const result = applySnippetExpansion(input.value);
        if (result) {
          e.preventDefault();
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          nativeInputValueSetter?.call(input, result.expanded);

          const inputEvent = new Event("input", { bubbles: true });
          input.dispatchEvent(inputEvent);

          if (onChange) {
            const changeEvent = {
              target: input,
              currentTarget: input,
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(changeEvent);
          }
          setSuggestionData(null);
          return;
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  };

  const renderInput = (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      autoComplete={autoComplete}
      className={cn(
        isBorderless
          ? "file:text-foreground placeholder:text-muted-foreground/50 flex w-full min-w-0 bg-transparent text-base transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          : "border-input file:text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        isTimeOrDate && "pr-9",
        canSuggest && suggestionData && "pr-24 sm:pr-28",
        className,
      )}
      onFocus={(e) => {
        setIsFocused(true);
        if (canSuggest && e.target.value) {
          const sug = getWordSuggestion(e.target.value);
          if (sug) {
            setSuggestionData({
              suffix: sug.suffix,
              suggestion: sug.suggestion,
              completedText: sug.completedText,
              typedText: e.target.value,
            });
          }
        }
        if (onFocus) onFocus(e);
      }}
      onBlur={(e) => {
        setSuggestionData(null);
        // Delay seguro para processar cliques de botões antes de ocultar
        setTimeout(() => {
          setIsFocused(false);
          stopStepping();
        }, 200);
        if (onBlur) onBlur(e);
      }}
      onScroll={() => {
        if (ghostRef.current && inputRef.current) {
          ghostRef.current.scrollLeft = inputRef.current.scrollLeft;
        }
      }}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
      {...props}
    />
  );

  if (isTimeOrDate) {
    const wrapperClass = getWrapperClasses(className);
    const pickerIcon =
      type === "time" ? (
        // Ícone de relógio (SVG inline para evitar importações redundantes)
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <title>Relógio</title>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ) : (
        // Calendar icon
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
        >
          <title>Calendário</title>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );

    return (
      <div className={cn("relative flex items-center", wrapperClass)}>
        {renderInput}
        <button
          type="button"
          tabIndex={-1}
          aria-label={
            type === "time" ? "Abrir seletor de horário" : "Abrir calendário"
          }
          onClick={handlePickerOpen}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer focus:outline-none"
        >
          {pickerIcon}
        </button>
      </div>
    );
  }

  if (isNumber) {
    const wrapperClass = getWrapperClasses(className);
    return (
      <div
        className={cn(
          "relative w-full group/numinput flex items-center",
          wrapperClass,
        )}
      >
        {renderInput}
        {isFocused && (
          <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-card border border-border px-1 py-1 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                startStepping(false);
              }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              onTouchStart={() => startStepping(false)}
              onTouchEnd={stopStepping}
              onTouchCancel={stopStepping}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground active:scale-90 flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3 bg-border/60" />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                startStepping(true);
              }}
              onMouseUp={stopStepping}
              onMouseLeave={stopStepping}
              onTouchStart={() => startStepping(true)}
              onTouchEnd={stopStepping}
              onTouchCancel={stopStepping}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground active:scale-90 flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (canSuggest) {
    const wrapperClass = getWrapperClasses(className);
    const typoClass = getTypographyClasses(className);
    const paddingClass = isBorderless ? "px-0" : getPaddingClasses(className);

    return (
      <div className={cn("relative flex items-center w-full", wrapperClass)}>
        {renderInput}

        {/* Camada Ghost Text Perfeitamente Alinhada (mesma borda, padding e tipografia) */}
        {isFocused && suggestionData && (
          <div
            ref={ghostRef}
            className={cn(
              "absolute inset-0 flex items-center pointer-events-none overflow-hidden select-none whitespace-pre",
              isBorderless ? "border-0" : "border border-transparent",
              paddingClass,
              typoClass,
            )}
            style={{
              font: "inherit",
              letterSpacing: "inherit",
            }}
          >
            <span className="opacity-0">{suggestionData.typedText}</span>
            <span className="text-muted-foreground/45 font-normal">
              {suggestionData.suffix}
            </span>
          </div>
        )}

        {/* Pill Indicadora de Atalho à Direita */}
        {isFocused && suggestionData && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 z-10 animate-in fade-in duration-100">
            <span className="text-[10px] font-medium text-muted-foreground/80 bg-muted/70 dark:bg-muted/50 border border-border/70 px-1.5 py-0.5 rounded-md flex items-center gap-1 select-none shadow-2xs">
              <span className="text-foreground font-semibold">
                {suggestionData.suggestion}
              </span>
              <kbd className="text-[9px] font-mono bg-background px-1 py-0.2 rounded border border-border/80 text-muted-foreground">
                Tab ⇥
              </kbd>
            </span>
          </div>
        )}
      </div>
    );
  }

  return renderInput;
}

export { Input };
