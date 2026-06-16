"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  FolderOpen,
  Pencil,
  Search,
  Settings2,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resolveColor } from "@/colors.config";
import { EmptyState } from "@/components/ui/EmptyState";
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
import type {
  StudyGrade,
  SubjectFormula,
  SubjectGroup,
  SubjectStatus,
} from "../types";
import { fmtGrade, GRADE_TYPE_COLORS, getSubjectStatus } from "../utils";

const STATUS_CONFIG = {
  aprovado: {
    label: "Aprovado",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
  "em-risco": {
    label: "Em risco",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bar: "bg-amber-500",
  },
  reprovado: {
    label: "Ainda não aprovado",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    bar: "bg-red-500",
  },
  "sem-nota": {
    label: "Sem notas",
    className: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    bar: "bg-neutral-600",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 26 },
  },
};

interface GroupAccordionProps {
  group: SubjectGroup;
  groupStatuses: SubjectStatus[];
  renderSubjectCard: (s: SubjectStatus) => React.ReactNode;
  toggleGroupExpanded: (groupId: number) => void;
  isExpanded: boolean;
}

function GroupAccordion({
  group,
  groupStatuses,
  renderSubjectCard,
  toggleGroupExpanded,
  isExpanded,
}: GroupAccordionProps) {
  const [overflow, setOverflow] = useState<"hidden" | "visible">("hidden");

  useEffect(() => {
    if (!isExpanded) {
      setOverflow("hidden");
    }
  }, [isExpanded]);

  const groupHex = resolveColor(group.color || "emerald");

  return (
    <div
      className="bg-card/30 border border-border/60 rounded-xl overflow-hidden shadow-sm hover:shadow transition-colors flex flex-col"
      style={{ borderLeft: `3px solid ${groupHex}` }}
    >
      {/* Cabeçalho do Grupo (Accordion trigger) */}
      <button
        type="button"
        onClick={() => group.id !== undefined && toggleGroupExpanded(group.id)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-card/45 hover:bg-accent/10 transition-colors text-left cursor-pointer",
          isExpanded && "border-b border-border/10",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen
            className="w-4 h-4 shrink-0"
            style={{ color: groupHex }}
          />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
            {group.name}
          </span>
          <span className="text-[10px] text-neutral-500 font-bold bg-muted px-2 py-0.5 rounded-full border border-border/40 shrink-0">
            {groupStatuses.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {/* Conteúdo do Grupo */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={() => {
              if (isExpanded) {
                setOverflow("visible");
              }
            }}
            style={{ overflow }}
            className="overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3 bg-background/20">
              {groupStatuses.map((s) => renderSubjectCard(s))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GradesSubjectsProps {
  grades: StudyGrade[];
  formulas: SubjectFormula[];
  groups: SubjectGroup[];
  allSubjects: string[];
  onConfigFormula: (subject: string) => void;
  onEditGrade?: (grade: StudyGrade) => void;
  onDeleteGrade?: (id: number) => void;
  userId: string;
}

export function GradesSubjects({
  grades,
  formulas,
  groups = [],
  allSubjects,
  onConfigFormula,
  onEditGrade,
  onDeleteGrade,
  userId,
}: GradesSubjectsProps) {
  const color = getModuleColor("grades");
  const theme = getColorTheme(color);

  // Filtros
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<number[]>(() =>
    groups.map((g) => g.id).filter((id): id is number => id !== undefined),
  );

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Matérias Ativas (persiste em localStorage por usuário como array JSON)
  const [activeSubjects, setActiveSubjects] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`aegis-active-subjects-${userId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          const old = localStorage.getItem(`aegis-active-subject-${userId}`);
          return old ? [old] : [];
        }
      }
      const old = localStorage.getItem(`aegis-active-subject-${userId}`);
      return old ? [old] : [];
    }
    return [];
  });

  const validActiveSubjects = useMemo(() => {
    return activeSubjects.filter((s) => allSubjects.includes(s));
  }, [activeSubjects, allSubjects]);

  const toggleActiveSubject = (subject: string) => {
    const newVal = activeSubjects.includes(subject)
      ? activeSubjects.filter((s) => s !== subject)
      : [...activeSubjects, subject];
    setActiveSubjects(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `aegis-active-subjects-${userId}`,
        JSON.stringify(newVal),
      );
      localStorage.removeItem(`aegis-active-subject-${userId}`);
    }
  };

  const formulaMap = useMemo(() => {
    return Object.fromEntries(formulas.map((f) => [f.subject, f]));
  }, [formulas]);

  // Status de cada matéria
  const statuses: SubjectStatus[] = useMemo(() => {
    return allSubjects.map((s) => {
      const subjectGrades = grades.filter((g) => g.subject === s);
      return getSubjectStatus(s, subjectGrades, formulaMap[s]);
    });
  }, [allSubjects, grades, formulaMap]);

  // Filtra as matérias baseado na busca e no grupo
  const filteredStatuses = useMemo(() => {
    return statuses.filter((s) => {
      const matchSearch = s.subject
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterGroup === "all") return true;
      if (filterGroup === "none") {
        return !groups.some((g) => g.subjects.includes(s.subject));
      }
      const targetGroup = groups.find((g) => String(g.id) === filterGroup);
      return targetGroup ? targetGroup.subjects.includes(s.subject) : false;
    });
  }, [statuses, searchQuery, filterGroup, groups]);

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Renderizador de Card de Matéria
  const renderSubjectCard = (s: SubjectStatus) => {
    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["sem-nota"];
    const isExpanded = expandedSubject === s.subject;
    const isStarred = validActiveSubjects.includes(s.subject);
    const subjectGrades = grades
      .filter((g) => g.subject === s.subject)
      .sort((a, b) => b.date.localeCompare(a.date));
    const pct = Math.min(100, (s.average / 10) * 100);

    return (
      <motion.div
        key={s.subject}
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className={cn(
          "bg-card/50 border border-border rounded-xl overflow-hidden transition-colors",
          theme.borderHover,
        )}
      >
        {/* Cabeçalho da matéria */}
        <div className="w-full flex items-center hover:bg-accent/10 transition-colors pr-4">
          <button
            type="button"
            onClick={() => setExpandedSubject(isExpanded ? null : s.subject)}
            className="flex-1 p-5 flex items-center gap-4 cursor-pointer text-left min-w-0"
          >
            {/* Barra de progresso vertical */}
            <div className="w-1 self-stretch rounded-full bg-border overflow-hidden shrink-0 min-h-[40px]">
              <div
                className={cn(
                  "w-full rounded-full transition-all duration-700",
                  cfg.bar,
                )}
                style={{ height: `${pct}%` }}
              />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-foreground truncate">
                  {s.subject}
                </h3>
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    cfg.className,
                  )}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {s.gradesCount} avaliaç{s.gradesCount === 1 ? "ão" : "ões"}
                </span>
                {s.hitRate > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {s.hitRate}% de acerto
                  </span>
                )}
                <span className="text-xs text-muted-foreground capitalize">
                  {s.formulaType === "simples"
                    ? "média simples"
                    : s.formulaType === "ponderada"
                      ? "ponderada"
                      : s.formulaType}
                </span>
              </div>
            </div>

            {/* Nota média */}
            <div className="text-right shrink-0">
              <span
                className={cn(
                  "text-2.5xl font-black tabular-nums",
                  s.status === "aprovado"
                    ? "text-emerald-400"
                    : s.status === "em-risco"
                      ? "text-amber-400"
                      : s.status === "reprovado"
                        ? "text-red-400"
                        : "text-muted-foreground",
                )}
              >
                {s.status === "sem-nota" ? "—" : fmtGrade(s.average)}
              </span>
              <p className="text-[10px] text-neutral-600 font-bold">
                mínimo {fmtGrade(s.passingGrade)}
              </p>
            </div>
          </button>

          {/* Botões de Ação na Direita */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <ToolTip
              content={
                isStarred
                  ? "Remover das metas ativas"
                  : "Marcar como meta ativa para relatório"
              }
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleActiveSubject(s.subject);
                }}
                className={cn(
                  "p-2 rounded-lg border transition-colors cursor-pointer",
                  isStarred
                    ? cn(theme.bg, theme.border, theme.text, theme.bgHover)
                    : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
              >
                <Target
                  className="w-3.5 h-3.5"
                  fill={isStarred ? "currentColor" : "none"}
                />
              </button>
            </ToolTip>

            <ToolTip content="Configurar fórmula de média">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigFormula(s.subject);
                }}
                className={cn(
                  "p-2 rounded-lg border border-border text-muted-foreground transition-all cursor-pointer",
                  theme.bgHover,
                  `hover:${theme.text}`,
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </ToolTip>
            <button
              type="button"
              onClick={() => setExpandedSubject(isExpanded ? null : s.subject)}
              className="p-2 rounded-lg hover:bg-accent/40 text-muted-foreground transition-all cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>

        {/* Histórico expandido */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border/50 bg-background/10"
          >
            <div className="p-4 flex flex-col gap-2">
              {subjectGrades.map((g) => {
                const pctGrade =
                  g.maxGrade > 0 ? Math.round((g.grade / g.maxGrade) * 100) : 0;
                const typeClass =
                  GRADE_TYPE_COLORS[g.gradeType] ??
                  "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-background/30 border border-border/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          typeClass,
                        )}
                      >
                        {g.gradeType}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {g.title || g.date}
                      </span>
                      {g.title && (
                        <span className="text-[10px] text-neutral-500 font-medium">
                          ({g.date})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          "text-xs font-black tabular-nums",
                          pctGrade >= 70
                            ? "text-emerald-400"
                            : pctGrade >= 50
                              ? "text-amber-400"
                              : "text-red-400",
                        )}
                      >
                        {fmtGrade(g.grade)}/{fmtGrade(g.maxGrade)}
                      </span>
                      {onEditGrade && (
                        <ToolTip content="Editar avaliação">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditGrade(g);
                            }}
                            className="p-1 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </ToolTip>
                      )}
                      {onDeleteGrade && (
                        <ToolTip content="Excluir avaliação">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (g.id !== undefined) onDeleteGrade(g.id);
                            }}
                            className="p-1 rounded-lg border border-border/50 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ToolTip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controles de filtro e busca */}
      <div className="flex gap-3 flex-wrap">
        {/* Barra de busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar matérias..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filtro por grupo */}
        <div className="min-w-[180px]">
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-full bg-card border-border rounded-xl h-[42px] text-xs font-medium focus:outline-none transition-colors">
              <SelectValue placeholder="Todos os grupos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">
                Todos os grupos
              </SelectItem>
              <SelectItem value="none" className="text-xs">
                Sem grupo (Matérias avulsas)
              </SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de matérias agrupada ou filtrada */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        {filteredStatuses.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhuma matéria encontrada"
            description="Tente ajustar a pesquisa ou os filtros de grupos."
            className="py-12"
          />
        ) : filterGroup === "all" ? (
          // Se for "Todos os grupos", agrupa sob headers
          <div className="flex flex-col gap-6">
            {groups.map((group) => {
              const groupStatuses = filteredStatuses.filter((s) =>
                group.subjects.includes(s.subject),
              );
              if (groupStatuses.length === 0) return null;

              const isExpanded =
                group.id !== undefined && expandedGroups.includes(group.id);
              return (
                <GroupAccordion
                  key={group.id}
                  group={group}
                  groupStatuses={groupStatuses}
                  renderSubjectCard={renderSubjectCard}
                  toggleGroupExpanded={toggleGroupExpanded}
                  isExpanded={isExpanded}
                />
              );
            })}

            {/* Matérias avulsas (sem grupo) */}
            {(() => {
              const ungroupedStatuses = filteredStatuses.filter(
                (s) => !groups.some((g) => g.subjects.includes(s.subject)),
              );
              if (ungroupedStatuses.length === 0) return null;

              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <BookOpen className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Matérias avulsas
                    </span>
                    <span className="text-[10px] text-neutral-500 font-bold bg-muted px-2 py-0.5 rounded-full">
                      {ungroupedStatuses.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {ungroupedStatuses.map((s) => renderSubjectCard(s))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          // Se tiver um filtro específico, lista direto
          <div className="flex flex-col gap-3">
            {filteredStatuses.map((s) => renderSubjectCard(s))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
