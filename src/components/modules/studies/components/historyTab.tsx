"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, Pencil, Search, Timer, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { resolveColor } from "@/config/colors.config";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "../types";
import { formatHours, hitRate, parseDate } from "../utils";
import { StudyStars } from "./studyStars";

// Variantes de animação para entrada escalonada (staggered entrance)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
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

import type { SubjectGroup } from "@/components/modules/grades/types";

interface HistoryTabProps {
  sessions: StudySession[];
  groups: SubjectGroup[];
  search: string;
  onSearchChange: (val: string) => void;
  filterMonth: string;
  onFilterMonthChange: (val: string) => void;
  /** Lista de matérias únicas para o filtro por matéria */
  subjects: string[];
  filterSubject: string;
  onFilterSubjectChange: (val: string) => void;
  months: string[];
  onEdit: (s: StudySession) => void;
  onDelete: (id: number) => void;
}

export function HistoryTab({
  sessions,
  groups,
  search,
  onSearchChange,
  filterMonth,
  onFilterMonthChange,
  subjects,
  filterSubject,
  onFilterSubjectChange,
  months,
  onEdit,
  onDelete,
}: HistoryTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const pomoColor = getModuleColor("pomodoro");
  const pomoTheme = getColorTheme(pomoColor);

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros em linha única */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input
            className={cn(
              "w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
              theme.borderHover.replace("hover:", "focus:"),
            )}
            placeholder="Buscar por matéria, conteúdo, data ou anotação..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filtro por matéria */}
        <div className="w-full sm:w-48 shrink-0">
          <SearchableSelect
            items={["all", ...subjects]}
            value={filterSubject}
            onChange={(val) =>
              onFilterSubjectChange(typeof val === "string" ? val : String(val))
            }
            placeholder="Todas as matérias"
            searchPlaceholder="Buscar matéria..."
            emptyMessage="Nenhuma matéria correspondente"
            getItemKey={(s) => s}
            getItemLabel={(s) => (s === "all" ? "Todas as matérias" : s)}
            moduleName="studies"
            mode="combobox"
            inputClass="h-9 text-xs"
          />
        </div>

        {/* Filtro por mês */}
        <Select value={filterMonth} onValueChange={onFilterMonthChange}>
          <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs w-full sm:w-44 shrink-0">
            <SelectValue placeholder="Todos os meses" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">
              Todos os meses
            </SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {parseDate(`${m}-01`).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma sessão encontrada"
          description="Seu histórico de estudos está vazio ou não corresponde à sua busca atual."
          className="py-12"
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {sessions.map((s) => {
            const isPomo =
              Boolean(s.isPomodoro) ||
              Boolean(
                s.tags
                  ?.split(",")
                  .map((t) => t.trim().toLowerCase())
                  .includes("pomodoro"),
              );
            const totalQ = s.questionsNew + s.questionsReview;
            const totalC = s.correctNew + s.correctReview;
            const hRate = hitRate(totalC, totalQ);
            const subjectGroup = groups.find((g) =>
              g.subjects
                .map((sub) => sub.toLowerCase())
                .includes(s.subject.toLowerCase()),
            );

            const displayTags = s.tags
              ? s.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => Boolean(t) && t.toLowerCase() !== "pomodoro")
              : [];

            return (
              <motion.div
                key={s.id}
                variants={itemVariants}
                className={cn(
                  "group bg-card/60 border border-border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-card",
                  isPomo ? pomoTheme.borderHover : theme.borderHover,
                )}
              >
                {/* Linha Superior: Matéria, Grupo/Pomodoro e Ações com Data */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground truncate max-w-50">
                      {s.subject}
                    </h3>

                    {isPomo ? (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 whitespace-nowrap",
                          pomoTheme.bg,
                          pomoTheme.text,
                          pomoTheme.border,
                        )}
                      >
                        <Timer className="w-3 h-3" />
                        Pomodoro
                      </span>
                    ) : (
                      subjectGroup?.color &&
                      (() => {
                        const hex = resolveColor(subjectGroup.color);
                        return (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap"
                            style={{
                              color: hex,
                              backgroundColor: `${hex}15`,
                              borderColor: `${hex}30`,
                            }}
                          >
                            {subjectGroup.name}
                          </span>
                        );
                      })()
                    )}
                  </div>

                  {/* Data e Ações */}
                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    <span className="text-xs font-medium text-muted-foreground">
                      {parseDate(s.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-0.5 border-l border-border/60 pl-2">
                      <ToolTip content="Editar sessão">
                        <button
                          type="button"
                          onClick={() => onEdit(s)}
                          className="p-1 rounded-md hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </ToolTip>
                      <ToolTip content="Excluir sessão">
                        <button
                          type="button"
                          onClick={() => s.id !== undefined && onDelete(s.id)}
                          className="p-1 rounded-md hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ToolTip>
                    </div>
                  </div>
                </div>

                {/* Tópico / Conteúdo estudado (Com rótulo Conteúdo:) */}
                {s.topic && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    <span className="font-bold text-foreground">Conteúdo:</span>{" "}
                    {s.topic}
                  </p>
                )}

                {/* Barra Padronizada de Métricas (Ordem Fixa com Alinhamento à Esquerda e Divisores) */}
                <div className="flex items-center justify-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs flex-wrap">
                  {/* 1. Tempo Registrado */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock
                      className={cn(
                        "w-3.5 h-3.5",
                        isPomo ? pomoTheme.text : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold",
                        isPomo ? pomoTheme.text : "text-foreground",
                      )}
                    >
                      {formatHours(s.hours)}
                    </span>
                  </div>

                  {/* 2. Avaliação de Foco */}
                  {s.focusScore !== undefined && (
                    <div className="flex items-center gap-1.5 shrink-0 border-l border-border/40 pl-3">
                      <span className="text-muted-foreground font-medium">
                        Foco:
                      </span>
                      <StudyStars score={s.focusScore} isPomodoro={isPomo} />
                    </div>
                  )}

                  {/* 3. Questões e Acertos */}
                  {totalQ > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium shrink-0 border-l border-border/40 pl-3">
                      <span>Questões: {totalQ}</span>
                      <span
                        className={cn(
                          "font-bold px-1.5 py-0.5 rounded text-[10px]",
                          hRate >= 70
                            ? "bg-green-500/10 text-green-400"
                            : hRate >= 50
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {hRate}% acerto
                      </span>
                    </div>
                  )}

                  {/* 4. Páginas Lidas */}
                  {s.pagesRead && s.pagesRead > 0 ? (
                    <div className="flex items-center gap-1 shrink-0 border-l border-border/40 pl-3 text-muted-foreground font-medium">
                      <span>Páginas: {s.pagesRead}</span>
                    </div>
                  ) : null}

                  {/* 5. Métrica Personalizada */}
                  {s.custom_metric_label && (
                    <div className="flex items-center gap-1 shrink-0 border-l border-border/40 pl-3 text-muted-foreground font-medium">
                      <span>
                        {s.custom_metric_label}: {s.custom_metric_value}
                      </span>
                    </div>
                  )}
                </div>

                {/* Observações / Notas (Com rótulo Notas:) */}
                {s.note && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border/80 pl-2.5 py-0.5">
                    <span className="font-bold text-foreground">Notas:</span>{" "}
                    {s.note}
                  </p>
                )}

                {/* Tags no Rodapé */}
                {displayTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                    {displayTags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap",
                          isPomo
                            ? cn(pomoTheme.bg, pomoTheme.text, pomoTheme.border)
                            : "bg-muted/40 text-neutral-400 border-border/40",
                        )}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
