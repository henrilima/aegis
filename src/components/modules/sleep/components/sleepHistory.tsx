"use client";

import { motion } from "framer-motion";
import { Clock, Moon, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { HistoryCard } from "@/components/ui/HistoryCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import {
  formatDuration,
  parseDate,
  qualityColor,
  qualityLabel,
} from "../sleepUtils";
import type { SleepEntry } from "../types";
import { SleepStars } from "./sleepStars";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const _itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    },
  },
};

interface SleepHistoryProps {
  entries: SleepEntry[];
  targetMinutes: number;
  onEdit: (e: SleepEntry) => void;
  onDelete: (id: number) => void;
  title?: string;
  isCompact?: boolean;
}

/**
 * Listagem dos registros históricos de sono com ações de edição e exclusão.
 * Design padronizado com os módulos de Estudos e Leitura.
 */
export function SleepHistory({
  entries,
  targetMinutes,
  onEdit,
  onDelete,
  title,
  isCompact = false,
}: SleepHistoryProps) {
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);

  const [search, setSearch] = useState("");
  const [filterQuality, setFilterQuality] = useState("all");

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const formattedDate = parseDate(e.date)
        .toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toLowerCase();

      const searchLower = search.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        formattedDate.includes(searchLower) ||
        e.date.includes(searchLower) ||
        e.note?.toLowerCase().includes(searchLower) ||
        e.bedtime.includes(searchLower) ||
        e.wakeTime.includes(searchLower);

      let matchesQuality = true;
      if (filterQuality !== "all") {
        const qNum = Number.parseInt(filterQuality, 10);
        if (qNum === 5) matchesQuality = e.quality === 5;
        else if (qNum === 4) matchesQuality = e.quality === 4;
        else if (qNum === 3) matchesQuality = e.quality === 3;
        else if (qNum === 2) matchesQuality = e.quality <= 2;
      }

      return matchesSearch && matchesQuality;
    });
  }, [entries, search, filterQuality]);

  // Modo compacto (usado na barra lateral da Visão Geral)
  if (isCompact) {
    if (entries.length === 0) {
      return (
        <EmptyState
          icon={Moon}
          title="Nenhum registro semanal"
          description="Seu histórico recente de descanso aparecerá aqui."
          className="py-8 bg-card/60 border border-border rounded-xl"
        />
      );
    }

    return (
      <div className="bg-card/60 border border-border rounded-xl p-5 flex flex-col gap-4">
        {title && (
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        )}
        <div className="flex flex-col gap-2.5">
          {entries.map((e) => {
            const isGoalMet = e.durationMinutes >= targetMinutes;
            return (
              <div
                key={e.id || `${e.date}-${e.bedtime}`}
                className="group bg-card/80 border border-border/80 rounded-lg p-3 flex items-center gap-3 transition-all hover:bg-card hover:border-border"
              >
                <div
                  className={cn(
                    "w-1 self-stretch rounded-full shrink-0",
                    isGoalMet ? theme.solid : "bg-muted-foreground/20",
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate">
                      {parseDate(e.date).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                      {e.bedtime} → {e.wakeTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-bold", theme.text)}>
                      {formatDuration(e.durationMinutes)}
                      {e.nap_minutes && e.nap_minutes > 0 ? (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (+{formatDuration(e.nap_minutes)})
                        </span>
                      ) : null}
                    </span>
                    <SleepStars quality={e.quality} />
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <ToolTip content="Editar registro">
                    <button
                      type="button"
                      onClick={() => onEdit(e)}
                      className="p-1 rounded hover:text-foreground text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </ToolTip>
                  <ToolTip content="Excluir registro">
                    <button
                      type="button"
                      onClick={() => e.id && onDelete(e.id)}
                      className="p-1 rounded hover:text-rose-500 text-muted-foreground hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </ToolTip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Modo Completo (Aba Histórico)
  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className={cn(
              "w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
              theme.borderHover.replace("hover:", "focus:"),
            )}
            placeholder="Buscar por data, horário ou anotação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro por Qualidade */}
        <Select value={filterQuality} onValueChange={setFilterQuality}>
          <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs w-full sm:w-44 shrink-0">
            <SelectValue placeholder="Todas as qualidades" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">
              Todas as qualidades
            </SelectItem>
            <SelectItem value="5" className="text-xs">
              Excelente (5 ⭐)
            </SelectItem>
            <SelectItem value="4" className="text-xs">
              Boa (4 ⭐)
            </SelectItem>
            <SelectItem value="3" className="text-xs">
              Regular (3 ⭐)
            </SelectItem>
            <SelectItem value="2" className="text-xs">
              Ruim (1-2 ⭐)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="Nenhum registro encontrado"
          description="Seu histórico de sono está vazio ou não corresponde à busca atual."
          className="py-12 bg-card/40 border border-border rounded-xl"
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredEntries.map((e) => {
            const isGoalMet = e.durationMinutes >= targetMinutes;
            const formattedDate = parseDate(e.date).toLocaleDateString(
              "pt-BR",
              {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              },
            );

            return (
              <HistoryCard key={e.id || `${e.date}-${e.bedtime}`} color="sleep">
                {/* Linha Superior: Data e Ações */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground capitalize truncate">
                      {formattedDate}
                    </h3>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap",
                        isGoalMet
                          ? `${theme.bg} ${theme.text} ${theme.border}`
                          : "bg-muted/40 text-muted-foreground border-border/60",
                      )}
                    >
                      {isGoalMet ? "Meta batida" : "Abaixo da meta"}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <ToolTip content="Editar registro">
                      <button
                        type="button"
                        onClick={() => onEdit(e)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir registro">
                      <button
                        type="button"
                        onClick={() => e.id && onDelete(e.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ToolTip>
                  </div>
                </div>

                {/* Barra de Métricas Principais */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">
                      {e.bedtime} → {e.wakeTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold text-sm", theme.text)}>
                      {formatDuration(e.durationMinutes)}
                    </span>
                    {e.nap_minutes && e.nap_minutes > 0 ? (
                      <span className="text-[11px] text-muted-foreground font-medium">
                        (+{formatDuration(e.nap_minutes)} soneca)
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Qualidade do Sono */}
                <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">
                      Qualidade:
                    </span>
                    <SleepStars quality={e.quality} />
                  </div>
                  <span
                    className={cn("font-bold text-xs", qualityColor(e.quality))}
                  >
                    {qualityLabel(e.quality)}
                  </span>
                </div>

                {/* Fatores & Hábitos */}
                {(e.caffeine || e.screens || e.alcohol || e.exercise) && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40 select-none">
                    {e.caffeine && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        ☕ Cafeína
                      </span>
                    )}
                    {e.screens && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        📱 Telas
                      </span>
                    )}
                    {e.alcohol && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        🍺 Álcool
                      </span>
                    )}
                    {e.exercise && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        🏋️ Exercício
                      </span>
                    )}
                  </div>
                )}

                {/* Anotação */}
                {e.note && (
                  <p className="text-xs text-muted-foreground/90 bg-background/50 border border-border/40 rounded-lg p-2 mt-0.5">
                    <span className="font-bold text-foreground">Anotação:</span>{" "}
                    {e.note}
                  </p>
                )}
              </HistoryCard>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
