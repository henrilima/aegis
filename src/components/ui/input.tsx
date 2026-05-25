"use client";

import { Minus, Plus } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  // Add any custom props here if needed
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

function Input({
  className,
  type,
  onChange,
  onFocus,
  onBlur,
  onClick,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Use native setter to trigger React's state binding correctly
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

  const handlePickerOpen = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      if ("showPicker" in HTMLInputElement.prototype) {
        input.showPicker();
      }
    } catch (_error) {}
  };

  const renderInput = (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        isBorderless
          ? "file:text-foreground placeholder:text-muted-foreground/50 flex w-full min-w-0 bg-transparent text-base transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          : "border-input file:text-foreground placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        isTimeOrDate && "pr-9",
        className,
      )}
      onFocus={(e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
      }}
      onBlur={(e) => {
        // Safe timeout to handle button clicks before hiding
        setTimeout(() => {
          setIsFocused(false);
          stopStepping();
        }, 200);
        if (onBlur) onBlur(e);
      }}
      onChange={onChange}
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
        // Clock icon (inline SVG to avoid import)
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

  return renderInput;
}

export { Input };
