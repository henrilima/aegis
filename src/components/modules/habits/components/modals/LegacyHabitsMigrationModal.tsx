"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Habit } from "@/components/modules/habits/types";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface LegacyHabitsMigrationModalProps {
  legacyHabits: Habit[];
  onClose: () => void;
  onRefresh: () => void;
}

export function LegacyHabitsMigrationModal({
  legacyHabits,
  onClose,
  onRefresh,
}: LegacyHabitsMigrationModalProps) {
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const [loading, setLoading] = useState(false);

  const getNewType = (oldType: string): string => {
    const t = oldType.toLowerCase();
    if (t === "positive" || t === "good" || t === "positivehabit") {
      return "Positive";
    }
    return "Negative";
  };

  const handleMigrate = async (recreate: boolean) => {
    setLoading(true);
    try {
      for (const h of legacyHabits) {
        if (!h.id) continue;

        // 1. Limpa os logs do hábito para garantir o reset do progresso
        await invoke("habit_hard_reset_habit", { id: h.id });

        if (recreate) {
          // 2. Para reativar no novo sistema, atualiza o hábito para ativo e corrige o tipo
          const newType = getNewType(h.habitType);
          await invoke("habit_update_habit", {
            habit: {
              ...h,
              archived: false,
              habitType: newType,
            },
          });
        } else {
          // 3. Para deletar permanentemente, deleta o registro físico (já que não há mais logs)
          await invoke("habit_delete_habit", { id: h.id });
        }
      }
      toast.success(
        recreate
          ? "Hábitos antigos reativados no novo formato com sucesso!"
          : "Hábitos antigos excluídos permanentemente.",
      );
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Falha ao processar a ação: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[500px] bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl border bg-amber-500/10 border-amber-500/20",
              )}
            >
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                Hábitos ocultos ou arquivados
              </h2>
              <p className="text-xs font-medium text-muted-foreground mt-1.5">
                Hábitos inativos detectados no seu banco de dados.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg border border-border/30 hover:bg-muted/40 transition-all cursor-pointer text-muted-foreground"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[350px]">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Identificamos {legacyHabits.length} hábito(s) arquivado(s) ou de
            versões antigas que estão ocultos nas suas abas, mas continuam no
            banco de dados e somando nos contadores gerais:
          </p>

          <div className="space-y-2">
            {legacyHabits.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">
                    {h.name}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500 mt-0.5">
                    Tipo: <span className="italic">{h.habitType}</span> ·
                    Estado:{" "}
                    <span className="italic">
                      {h.archived ? "Arquivado" : "Inativo"}
                    </span>
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md text-muted-foreground shrink-0 select-none">
                  Inativo
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs leading-relaxed text-amber-500 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso sobre o progresso:</strong> se você escolher
              reativar (Recriar no novo sistema), os hábitos começarão do zero.
              Todo o progresso e histórico de conclusões passadas serão limpos
              para evitar conflitos.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 p-6 border-t border-border/60 bg-muted/10 shrink-0">
          <button
            type="button"
            onClick={() => handleMigrate(false)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Deletar todos
          </button>
          <button
            type="button"
            onClick={() => handleMigrate(true)}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50",
              theme.solid,
              theme.solidHover,
            )}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Recriar no novo sistema
          </button>
        </div>
      </div>
    </div>
  );
}
