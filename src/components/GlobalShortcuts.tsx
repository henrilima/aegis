"use client";

import { Keyboard, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_GROUPS } from "@/components/appSidebar";
import type { AppRoute } from "@/context/NavigationContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { cn, getColorTheme } from "@/lib/utils";

export function GlobalShortcuts() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { navigate } = useNavigation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita interceptar se estiver digitando em um input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ctrl + K (Command Palette)
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }

      // Ctrl + Shift + ? (Shortcuts Guide)
      if (e.ctrlKey && e.shiftKey && e.key === "?") {
        e.preventDefault();
        setIsGuideOpen((prev) => !prev);
      }

      // Ctrl + Shift + C (Configurações)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        navigate("settings" as AppRoute);
      }

      // Ctrl + Shift + L (Telemetria)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key.toLowerCase() === "l" || e.code === "KeyL")
      ) {
        e.preventDefault();
        navigate("settings" as AppRoute);
        // Pequeno delay para garantir que o componente Settings foi montado se não estivermos lá
        setTimeout(() => {
          window.dispatchEvent(new Event("open-telemetry"));
        }, 100);
      }

      // Ctrl + Shift + D (Manual WhatsNew Modal)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        console.log("[Aegis] Atalho acionado: Abrindo modal de novidades...");
        window.dispatchEvent(new CustomEvent("open-whats-new"));
      }

      const key = e.key.toLowerCase();
      const code = e.code;

      if (!isPaletteOpen) {
        if (e.altKey && (key === "n" || code === "KeyN")) {
          e.preventDefault();
          window.dispatchEvent(new Event("toggle-notifications-panel"));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, isPaletteOpen]);

  return (
    <>
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={(route) => {
          if (route === "command:whats-new") {
            window.dispatchEvent(new CustomEvent("open-whats-new"));
          } else {
            navigate(route as AppRoute);
          }
          setIsPaletteOpen(false);
        }}
      />
      <ShortcutsGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <button
        type="button"
        onClick={() => setIsGuideOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-card border border-border rounded-full hover:scale-110 active:scale-95 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
        aria-label="Ver Atalhos"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    </>
  );
}

function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { themeStyles } = useTheme();

  // Achatar os items do sidebar para busca
  const allItems = useMemo(() => {
    const sidebarItems = NAV_GROUPS.flatMap((group) => group.items);
    // Adiciona comando manual para novidades
    return [
      ...sidebarItems,
      {
        title: "Ver Novidades (Whats New)",
        route: "command:whats-new",
        icon: Sparkles,
        color: "primary",
      },
    ];
  }, []);

  const filteredItems = useMemo(() => {
    if (!query) return allItems;
    const lowerQuery = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.route.toLowerCase().includes(lowerQuery),
    );
  }, [query, allItems]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < filteredItems.length - 1 ? prev + 1 : prev;
          document
            .getElementById(`cmd-item-${next}`)
            ?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : prev;
          document
            .getElementById(`cmd-item-${next}`)
            ?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onNavigate(filteredItems[selectedIndex].route);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, onNavigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-black/60 backdrop-blur-sm cursor-default transition-opacity border-none appearance-none"
        onClick={onClose}
        aria-label="Fechar busca"
      />

      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-border/60">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-[15px]"
            placeholder="Buscar módulo ou comando..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded-lg bg-accent border border-border text-[10px] font-medium text-muted-foreground ml-3 uppercase">
            ESC
          </kbd>
        </div>

        <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const colorTheme =
                item.color === "primary"
                  ? getColorTheme(themeStyles.name as string)
                  : getColorTheme(item.color);

              return (
                <button
                  key={item.route}
                  id={`cmd-item-${index}`}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex items-center px-3 py-3 rounded-xl cursor-pointer transition-colors text-left",
                    isSelected
                      ? `${colorTheme.bg} ${colorTheme.border} border`
                      : "border border-transparent hover:bg-accent/50",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg mr-3",
                      isSelected ? "bg-background" : "bg-accent",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4",
                        isSelected ? colorTheme.text : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[13px] font-bold",
                      isSelected ? colorTheme.text : "text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      Pressione{" "}
                      <kbd className="font-sans px-1.5 py-0.5 rounded bg-background border border-border">
                        Enter
                      </kbd>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="bg-muted/40 border-t border-border/60 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            Navegue com{" "}
            <kbd className="font-sans px-1.5 py-0.5 rounded-md bg-card border border-border">
              ↑
            </kbd>{" "}
            e{" "}
            <kbd className="font-sans px-1.5 py-0.5 rounded-md bg-card border border-border">
              ↓
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
}

function ShortcutsGuide({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { themeStyles } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + K", desc: "Abre a busca global (Command Palette)" },
    { key: "Ctrl + Shift + ?", desc: "Mostra este guia de atalhos" },
    { key: "Ctrl + Shift + D", desc: "Ver novidades da versão (What's New)" },
    { key: "Ctrl + B", desc: "Abre/Fecha a barra lateral (Sidebar)" },
    { key: "Alt + N", desc: "Abre/Fecha o Painel de Notificações" },
  ];

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-black/60 backdrop-blur-sm transition-opacity border-none appearance-none cursor-default"
        onClick={onClose}
        aria-label="Fechar guia"
      />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${themeStyles.bg} ${themeStyles.text}`}
            >
              <Keyboard className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-foreground">
              Guia de Atalhos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 text-left">
          {shortcuts.map((s, _idx) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors rounded-xl"
            >
              <span className="text-[13px] font-medium text-muted-foreground">
                {s.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-lg bg-accent border border-border/80 text-[11px] font-bold font-sans text-foreground whitespace-nowrap">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
