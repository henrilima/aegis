"use client";

import { motion } from "framer-motion";
import { BarChart2, ChevronDown, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { parseDate } from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADE_TYPE_LABELS, type StudyGrade, type SubjectGroup } from "../types";
import { GRADE_TYPE_COLORS, fmtGrade, hitRate } from "../utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 25 },
  },
};

interface GradesHistoryProps {
  grades: StudyGrade[];
  groups: SubjectGroup[];
  onEdit: (g: StudyGrade) => void;
  onDelete: (id: number) => void;
}

export function GradesHistory({ grades, groups = [], onEdit, onDelete }: GradesHistoryProps) {
  const color = getModuleColor("grades");
  const theme = getColorTheme(color);

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const subjects = useMemo(
    () => Array.from(new Set(grades.map((g) => g.subject))).sort(),
    [grades],
  );

  const filtered = useMemo(() => {
    return grades.filter((g) => {
      const matchSearch =
        search === "" ||
        g.subject.toLowerCase().includes(search.toLowerCase()) ||
        (g.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        g.date.includes(search);
      const matchSubject = filterSubject === "all" || g.subject === filterSubject;
      const matchGroup = (() => {
        if (filterGroup === "all") return true;
        if (filterGroup === "none") {
          return !groups.some((grp) => grp.subjects.includes(g.subject));
        }
        const targetGroup = groups.find((grp) => String(grp.id) === filterGroup);
        return targetGroup ? targetGroup.subjects.includes(g.subject) : false;
      })();
      const matchType = filterType === "all" || g.gradeType === filterType;
      return matchSearch && matchSubject && matchGroup && matchType;
    });
  }, [grades, search, filterSubject, filterGroup, filterType, groups]);

  if (grades.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Nenhuma nota registrada"
        description="Registre provas, simulados e atividades para visualizar seu histórico acadêmico."
        className="py-16"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        {/* Busca */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input
            className={cn(
              "w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors text-sm",
              theme.borderHover.replace("hover:", "focus:"),
            )}
            placeholder="Buscar por matéria, título ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro por matéria */}
        <div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs min-w-[150px]">
              <SelectValue placeholder="Todas as matérias" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">Todas as matérias</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por grupo */}
        <div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs min-w-[140px]">
              <SelectValue placeholder="Todos os grupos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">Todos os grupos</SelectItem>
              <SelectItem value="none" className="text-xs">Sem grupo</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por tipo */}
        <div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs min-w-[130px]">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">Todos os tipos</SelectItem>
              {(["prova", "simulado", "atividade", "trabalho", "quiz"] as const).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {GRADE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma avaliação encontrada"
          description="Tente ajustar os filtros de busca."
          className="py-12"
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          {filtered.map((g) => {
            const pct =
              g.maxGrade > 0
                ? Math.round((g.grade / g.maxGrade) * 100)
                : 0;
            const hr = hitRate(g.questionsCorrect, g.questionsTotal);
            const typeClass =
              GRADE_TYPE_COLORS[g.gradeType] ??
              "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";

            return (
              <motion.div
                key={g.id}
                variants={itemVariants}
                whileHover={{ y: -3, boxShadow: "0 10px 25px -10px rgba(0,0,0,0.12)" }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                className={cn(
                  "group bg-card/50 border border-border rounded-xl p-5 transition-all duration-300",
                  theme.borderHover,
                  "hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Linha superior */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          typeClass,
                        )}
                      >
                        {GRADE_TYPE_LABELS[g.gradeType]}
                      </span>
                      <h3 className="text-base font-bold text-foreground">
                        {g.subject}
                        {g.title && (
                          <span className="text-muted-foreground font-medium ml-2 text-sm">
                            — {g.title}
                          </span>
                        )}
                      </h3>
                      <span
                        className={cn(
                          "ml-auto shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border",
                          theme.bg,
                          theme.text,
                          theme.border,
                        )}
                      >
                        {parseDate(g.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>

                    {/* Badges de métricas */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Nota */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold",
                          pct >= 70
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : pct >= 50
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400",
                        )}
                      >
                        {fmtGrade(g.grade)}/{fmtGrade(g.maxGrade)}
                        <span className="opacity-70">({pct}%)</span>
                        {g.halfGrade && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            Pela Metade na Média
                          </span>
                        )}
                      </div>

                      {/* Peso */}
                      {g.weight !== 1 && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border text-xs font-bold text-muted-foreground">
                          peso {g.weight}
                        </div>
                      )}

                      {/* Questões */}
                      {g.questionsTotal > 0 && (
                        <>
                          <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-border text-xs font-bold text-muted-foreground">
                            {g.questionsTotal} questões
                          </div>
                          <div
                            className={cn(
                              "px-2.5 py-1.5 rounded-xl border text-xs font-bold",
                              hr >= 70
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : hr >= 50
                                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/10 border-red-500/20 text-red-400",
                            )}
                          >
                            {hr}% acerto
                          </div>
                        </>
                      )}
                    </div>

                    {/* Nota/observação */}
                    {g.note && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic pl-3 border-l border-dashed border-border">
                        {g.note}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden shrink-0">
                    <ToolTip content="Editar avaliação">
                      <button
                        type="button"
                        onClick={() => onEdit(g)}
                        className={cn(
                          "p-2.5 text-neutral-600 transition-all border-r border-border active:scale-95",
                          theme.bgHover,
                          `hover:${theme.text}`,
                        )}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir avaliação">
                      <button
                        type="button"
                        onClick={() => g.id !== undefined && onDelete(g.id)}
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
