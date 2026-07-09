"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  FileText,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme, toHoverClass } from "@/lib/utils";
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

interface HistoryTabProps {
  sessions: StudySession[];
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
  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros */}
      <div className="flex gap-3 flex-wrap">
        {/* Campo de busca */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input
            className={cn(
              "w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
              theme.borderHover.replace("hover:", "focus:"),
            )}
            placeholder="Buscar por matéria, conteúdo, data ou anotação..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filtro por matéria */}
        <Select value={filterSubject} onValueChange={onFilterSubjectChange}>
          <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs min-w-[160px]">
            <SelectValue placeholder="Todas as matérias" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-xs">
              Todas as matérias
            </SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por mês */}
        <div>
          <Select value={filterMonth} onValueChange={onFilterMonthChange}>
            <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs min-w-[160px]">
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
            const totalQ = s.questionsNew + s.questionsReview;
            const totalC = s.correctNew + s.correctReview;
            const hRate = hitRate(totalC, totalQ);

            return (
              <motion.div
                key={s.id}
                variants={itemVariants}
                className={cn(
                  "group bg-card/50 border border-border rounded-xl p-5 transition-all duration-300",
                  theme.borderHover,
                  "hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Linha Superior: Materia e Data */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-base font-bold text-foreground truncate">
                          {s.subject}
                        </h3>
                        {/* Conteúdo estudado — exibido apenas quando preenchido */}
                        {s.topic && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {s.topic}
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border",
                          theme.bg,
                          theme.text,
                          theme.border,
                        )}
                      >
                        {parseDate(s.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Linha de Métricas: Badges estilizados */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border group-hover:border-border transition-colors">
                        <Clock
                          className={cn(
                            "w-3.5 h-3.5 text-muted-foreground transition-colors",
                            `group-hover:${theme.text.replace("text-", "text-")}`,
                          )}
                        />
                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                          {formatHours(s.hours)}
                        </span>
                      </div>

                      {s.focusScore !== undefined && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border group-hover:border-border transition-colors">
                          <StudyStars score={s.focusScore} />
                        </div>
                      )}

                      {totalQ > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border text-xs font-bold text-muted-foreground">
                            {totalQ} questões
                          </div>
                          <div
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              hRate >= 70
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : hRate >= 50
                                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {hRate}% acerto
                          </div>
                        </div>
                      )}

                      {s.pagesRead && s.pagesRead > 0 ? (
                        <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border text-xs font-bold text-muted-foreground">
                          {s.pagesRead} páginas
                        </div>
                      ) : null}

                      {s.custom_metric_label && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border text-xs font-bold text-muted-foreground">
                          {s.custom_metric_value} {s.custom_metric_label}
                        </div>
                      )}
                    </div>

                    {/* Nota */}
                    {s.note && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic border-border pl-3 py-0.5 mt-1 border-dashed">
                        {s.note}
                      </p>
                    )}
                  </div>

                  {/* Ações Padronizadas */}
                  <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden shrink-0">
                    <ToolTip content="Editar sessão">
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className={cn(
                          "p-2.5 text-neutral-600 transition-all border-r border-border active:scale-95",
                          theme.bgHover,
                          toHoverClass(theme.text),
                        )}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir sessão">
                      <button
                        type="button"
                        onClick={() => s.id !== undefined && onDelete(s.id)}
                        className="p-2.5 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ToolTip>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
