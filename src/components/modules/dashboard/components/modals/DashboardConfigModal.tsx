"use client";

import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Layout,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { WIDGET_METADATA } from "@/components/modules/dashboard/widgets/registry";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface DashboardConfigModalProps {
  activeWidgetIds: string[];
  onToggle: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}

export function DashboardConfigModal({
  activeWidgetIds,
  onToggle,
  onReorder,
  onClose,
}: DashboardConfigModalProps) {
  const { themeStyles: theme } = useTheme();
  const [internalActiveIds, setInternalActiveIds] =
    useState<string[]>(activeWidgetIds);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setInternalActiveIds(activeWidgetIds);
  }, [activeWidgetIds]);

  const handleToggle = (id: string) => {
    onToggle(id);
    setSelectedIndex(null);
  };

  const move = (
    id: string,
    direction: "up" | "down" | "to",
    toIndex?: number,
  ) => {
    const idx = internalActiveIds.indexOf(id);
    if (idx === -1) return;

    const next = [...internalActiveIds];
    let target = direction === "up" ? idx - 1 : idx + 1;
    if (direction === "to" && typeof toIndex === "number") target = toIndex;
    if (target < 0 || target >= next.length || target === idx) return;

    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);

    setInternalActiveIds(next);
    onReorder(next);
    setSelectedIndex(null);
  };

  const handleItemClick = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      move(internalActiveIds[selectedIndex], "to", index);
    }
  };

  const inactiveWidgets = WIDGET_METADATA.filter(
    (w) => !internalActiveIds.includes(w.id),
  );

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[98vw] h-[92vh] p-0 overflow-hidden border-2 border-border gap-0 sm:max-w-none backdrop-blur-md bg-background/95 flex flex-col">
        <DialogTitle className="sr-only">configurar dashboard</DialogTitle>

        <div className="flex h-full w-full relative">
          {/* Lado Esquerdo: Widgets Ativos */}
          <main className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0">
            <header className="flex items-center justify-between px-8 py-6 border-b border-border/20">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    theme.bg,
                  )}
                >
                  <Layout className={cn("w-5 h-5", theme.text)} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-foreground">
                    Sua dashboard
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground lowercase opacity-50">
                    {selectedIndex !== null
                      ? "selecione o destino para mover"
                      : "gerencie seus widgets ativos"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    className="px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black lowercase hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    cancelar movimento
                  </button>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-3">
                {internalActiveIds.map((id, idx) => {
                  const w = WIDGET_METADATA.find((m) => m.id === id);
                  if (!w) return null;

                  const isSelected = selectedIndex === idx;
                  const isMoveTarget = selectedIndex !== null && !isSelected;

                  return (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-300"
                    >
                      <button
                        type="button"
                        onClick={() => handleItemClick(idx)}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all shrink-0",
                          isSelected
                            ? "bg-foreground border-foreground text-background scale-105"
                            : "bg-card border-border text-muted-foreground hover:border-foreground hover:text-foreground cursor-pointer",
                          isMoveTarget &&
                            "bg-accent border-dashed border-foreground/30 animate-pulse",
                        )}
                      >
                        {isMoveTarget ? (
                          <ArrowDownUp className="w-4 h-4" />
                        ) : (
                          <GripVertical className="w-4 h-4" />
                        )}
                      </button>

                      <div
                        className={cn(
                          "flex-1 flex items-center justify-between p-4 rounded-2xl border-2 bg-card transition-all",
                          isSelected ? "border-foreground" : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center bg-accent/50 text-foreground",
                            )}
                          >
                            <Layout className="w-4 h-4 opacity-30" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground lowercase">
                              {w.name}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground lowercase opacity-50">
                              {w.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {selectedIndex === null && (
                            <div className="flex items-center gap-1.5 mr-2 border-r border-border/20 pr-3">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => move(w.id, "up")}
                                className="p-1.5 rounded-lg bg-background border border-border hover:border-foreground disabled:opacity-20 transition-all cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === internalActiveIds.length - 1}
                                onClick={() => move(w.id, "down")}
                                className="p-1.5 rounded-lg bg-background border border-border hover:border-foreground disabled:opacity-20 transition-all cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggle(w.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <footer className="px-8 py-6 border-t border-border/20 bg-accent/5 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer lowercase"
              >
                Agora não
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-8 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                Salvar configurações
              </button>
            </footer>
          </main>

          {/* Lado Direito: Biblioteca */}
          <aside className="w-[480px] bg-accent/30 border-l border-border/40 flex flex-col p-8 gap-6 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-black text-foreground lowercase">
                  biblioteca
                </h4>
                <p className="text-[10px] font-bold text-muted-foreground lowercase opacity-50">
                  adicione novos widgets
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              <div className="grid grid-cols-2 gap-3 pb-8">
                {inactiveWidgets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleToggle(w.id)}
                    className="flex flex-col p-4 rounded-2xl border-2 border-border bg-card/50 hover:border-foreground hover:bg-card transition-all text-left group cursor-pointer h-full min-h-[120px]"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-background border border-border text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-foreground lowercase line-clamp-1">
                        {w.name}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground lowercase opacity-50 line-clamp-2 leading-tight">
                        {w.description}
                      </span>
                    </div>
                  </button>
                ))}

                {inactiveWidgets.length === 0 && (
                  <div className="col-span-2 py-12 text-center">
                    <p className="text-xs font-bold text-muted-foreground lowercase">
                      todos ativos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
