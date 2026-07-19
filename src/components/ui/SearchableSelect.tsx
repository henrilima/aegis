"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface SearchableSelectProps<T> {
  items: T[];
  value?: string | number;
  onChange: (item: T | string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getItemKey: (item: T) => string | number;
  getItemLabel: (item: T) => string;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  moduleName?: string;
  mode?: "combobox" | "autocomplete";
  inputClass?: string;
  onCreateNew?: (query: string) => void;
}

export function SearchableSelect<T>({
  items,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado",
  getItemKey,
  getItemLabel,
  renderItem,
  icon: Icon,
  moduleName = "reading",
  mode = "combobox",
  inputClass,
  onCreateNew,
}: SearchableSelectProps<T>) {
  const theme = getColorTheme(getModuleColor(moduleName));
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // No modo autocomplete, o input exibe a query digitada ou o valor atual
  const [autocompleteQuery, setAutocompleteQuery] = useState("");

  useEffect(() => {
    if (mode === "autocomplete") {
      setAutocompleteQuery(String(value ?? ""));
    }
  }, [value, mode]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = mode === "autocomplete" ? autocompleteQuery : searchQuery;

  const filteredItems = items.filter((item) =>
    getItemLabel(item).toLowerCase().includes(query.toLowerCase()),
  );

  const isNew =
    query.trim() !== "" &&
    !items.some(
      (item) => getItemLabel(item).toLowerCase() === query.toLowerCase(),
    );

  const selectedItem = items.find(
    (item) => String(getItemKey(item)) === String(value),
  );

  const handleSelect = (item: T) => {
    onChange(item);
    if (mode === "autocomplete") {
      setAutocompleteQuery(getItemLabel(item));
    }
    setOpen(false);
  };

  const handleCreate = () => {
    if (onCreateNew && query.trim()) {
      onCreateNew(query.trim());
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {mode === "combobox" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-all select-none cursor-pointer",
            theme.borderHover.replace(
              "hover:",
              "focus:ring-2 focus:ring-offset-0 focus:outline-none focus:ring-",
            ),
            "hover:bg-accent/50/60",
            selectedItem ? "text-foreground" : "text-muted-foreground",
            inputClass || "h-12",
          )}
        >
          <span className="truncate">
            {selectedItem ? getItemLabel(selectedItem) : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      ) : (
        <input
          type="text"
          className={cn(
            inputClass,
            "w-full bg-card border border-border rounded-xl text-xs font-semibold px-3 outline-none",
          )}
          placeholder={placeholder}
          value={autocompleteQuery}
          onChange={(e) => {
            setAutocompleteQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 shadow-lg">
          {mode === "combobox" && (
            <div className="p-2 border-b border-border/40 bg-card">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/40 text-xs font-semibold rounded-lg h-9 pl-8 pr-3 border border-border/50 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/30 transition-all text-foreground"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
            {filteredItems.length === 0 && !isNew ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-600 font-medium">
                {emptyMessage}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem
                    ? getItemKey(selectedItem) === getItemKey(item)
                    : false;

                  return (
                    <button
                      key={String(getItemKey(item))}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer",
                        isSelected
                          ? cn(theme.bg, theme.text, "font-bold")
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          {Icon && (
                            <Icon className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                          )}
                          <span className="truncate">{getItemLabel(item)}</span>
                          {isSelected && (
                            <span
                              className={cn(
                                "ml-auto text-[10px] font-bold",
                                theme.text,
                              )}
                            >
                              ✓
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}

                {isNew && onCreateNew && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[11px] font-bold rounded-lg transition-all border-t border-border/20 mt-1 cursor-pointer",
                      theme.text,
                      theme.bgHover,
                    )}
                  >
                    + Criar "{query.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
