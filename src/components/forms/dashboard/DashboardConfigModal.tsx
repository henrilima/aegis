"use client";

import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Layout,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn, getThemeColor } from "@/lib/utils";
import { WIDGET_METADATA } from "../../pages/dashboard/widgets/registry";

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
  useLockBodyScroll();
  const theme = getThemeColor();
  const [internalActiveIds, setInternalActiveIds] =
    useState<string[]>(activeWidgetIds);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Sincroniza o estado interno se a lista externa mudar
  useEffect(() => {
    if (activeWidgetIds.length !== internalActiveIds.length) {
      setInternalActiveIds(activeWidgetIds);
    }
  }, [activeWidgetIds, internalActiveIds.length]);

  const handleToggle = (id: string) => {
    onToggle(id);
    if (selectedIndex !== null) setSelectedIndex(null);
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

    if (direction === "to" && typeof toIndex === "number") {
      target = toIndex;
    }

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
      // Troca/Move e limpa
      move(internalActiveIds[selectedIndex], "to", index);
    }
  };

  const inactiveWidgets = WIDGET_METADATA.filter(
    (w) => !internalActiveIds.includes(w.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <Card className="relative w-full max-w-xl bg-neutral-950 border border-neutral-800 rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/60 shrink-0 select-none">
          <div className="flex items-center gap-2.5 font-outfit">
            <div
              className={`p-1.5 ${theme.bg} rounded-lg border ${theme.border}`}
            >
              <Layout className={`w-4 h-4 ${theme.text}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Configurar Dashboard
              </h2>
              <p className="text-[10px] text-neutral-500 mt-1">
                {selectedIndex !== null
                  ? "Selecione a nova posição para o item"
                  : "Organize a ordem dos seus widgets"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Widgets */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-5">
            {/* Active Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 select-none">
                <p className="text-[9px] font-bold text-neutral-500">
                  Widgets Ativos ({internalActiveIds.length})
                </p>
                {selectedIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    className="text-[9px] font-bold text-rose-500 hover:text-rose-400 underline cursor-pointer uppercase"
                  >
                    Cancelar movimento
                  </button>
                )}
              </div>

              <ul className="grid grid-cols-1 gap-1.5">
                {internalActiveIds.map((id, idx) => {
                  const w = WIDGET_METADATA.find((m) => m.id === id);
                  if (!w) return null;

                  const isSelected = selectedIndex === idx;
                  const isMoveTarget = selectedIndex !== null && !isSelected;

                  return (
                    <li
                      key={w.id}
                      className={cn(
                        "flex items-center gap-1.5 group/item transition-all duration-200 list-none",
                        isSelected && "z-10 bg-emerald-500/5 rounded-lg",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleItemClick(idx)}
                        className={cn(
                          "shrink-0 p-2 rounded-lg transition-all border outline-none",
                          isSelected
                            ? "bg-emerald-500 border-emerald-400 text-black scale-105 shadow-lg shadow-emerald-500/20"
                            : "bg-neutral-900 border-neutral-800 text-neutral-700 hover:text-neutral-500 hover:border-neutral-700 active:scale-95 cursor-pointer",
                          isMoveTarget &&
                            "bg-neutral-800 border-dashed border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 animate-pulse cursor-pointer",
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
                          "flex-1 flex items-center justify-between p-2.5 rounded-lg border transition-all bg-neutral-900/50 border-neutral-800 shadow-sm",
                          isSelected &&
                            "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/10",
                          isMoveTarget && "opacity-40 grayscale-[0.8]",
                        )}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              "text-[13px] font-bold transition-colors font-outfit",
                              theme.text,
                            )}
                          >
                            {w.name}
                          </span>
                          <span className="text-[9px] font-medium text-neutral-600 leading-none">
                            {w.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(w.id);
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-all bg-emerald-500 text-black shadow-lg shadow-emerald-500/10 cursor-pointer hover:scale-105 active:scale-95",
                          )}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </button>
                      </div>

                      {selectedIndex === null && (
                        <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => move(w.id, "up")}
                            className="p-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-700 disabled:opacity-20 cursor-pointer transition-all"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === internalActiveIds.length - 1}
                            onClick={() => move(w.id, "down")}
                            className="p-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-700 disabled:opacity-20 cursor-pointer transition-all"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Inactive Section */}
            {inactiveWidgets.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-neutral-600 px-1 select-none">
                  Disponíveis ({inactiveWidgets.length})
                </p>
                <ul className="grid grid-cols-2 gap-1.5 list-none m-0 p-0">
                  {inactiveWidgets.map((w) => (
                    <li key={w.id} className="list-none">
                      <button
                        type="button"
                        onClick={() => handleToggle(w.id)}
                        className="flex items-center justify-between p-2 rounded-lg border transition-all text-left bg-neutral-950/20 border-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-900/30 w-full group/btn cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-bold text-neutral-500 group-hover/btn:text-neutral-400 transition-colors font-outfit truncate">
                            {w.name}
                          </span>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all bg-neutral-800/30 border border-neutral-700/30 text-neutral-600 group-hover/btn:bg-emerald-500/10 group-hover/btn:text-emerald-500 group-hover/btn:border-emerald-500/20 shrink-0">
                          <Plus className="w-3 h-3" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 p-4 border-t border-neutral-800/60 bg-neutral-950/50 select-none">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all active:scale-[0.98] cursor-pointer shadow-lg font-outfit border",
              theme.bg,
              theme.bgHover,
              theme.border,
              theme.borderHover,
              theme.textDark,
              theme.textDarkHover,
            )}
          >
            Salvar alterações
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-bold cursor-pointer transition-colors"
          >
            Agora não
          </button>
        </div>
      </Card>
    </div>
  );
}
