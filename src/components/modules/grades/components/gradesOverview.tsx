"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FolderOpen,
  Pencil,
  Search,
  Settings2,
  Star,
  Target,
  ThumbsUp,
  TrendingUp,
  XCircle,
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
import {
  fmtGrade,
  GRADE_TYPE_COLORS,
  getSubjectStatus,
  hitRate,
} from "../utils";

interface GradesOverviewProps {
  grades: StudyGrade[];
  formulas: SubjectFormula[];
  groups: SubjectGroup[];
  allSubjects: string[];
  onConfigFormula: (subject: string) => void;
  onEditGrade?: (grade: StudyGrade) => void;
  userId: string;
}

const STATUS_CONFIG = {
  aprovado: {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
  "em-risco": {
    label: "Em risco",
    icon: TrendingUp,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bar: "bg-amber-500",
  },
  reprovado: {
    label: "Ainda não aprovado",
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    bar: "bg-red-500",
  },
  "sem-nota": {
    label: "Sem notas",
    icon: BookOpen,
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

export function GradesOverview({
  grades,
  formulas,
  groups = [],
  allSubjects,
  onConfigFormula,
  onEditGrade,
  userId,
}: GradesOverviewProps) {
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

  // Extrai matérias únicas (usa a lista completa de todas as matérias cadastradas)
  const subjects = allSubjects;

  // Mapa de fórmulas por matéria
  const formulaMap = useMemo(() => {
    return Object.fromEntries(formulas.map((f) => [f.subject, f]));
  }, [formulas]);

  // Status de cada matéria
  const statuses: SubjectStatus[] = useMemo(() => {
    return subjects.map((s) => {
      const subjectGrades = grades.filter((g) => g.subject === s);
      return getSubjectStatus(s, subjectGrades, formulaMap[s]);
    });
  }, [subjects, grades, formulaMap]);

  // Estatísticas globais
  const totalGrades = grades.length;
  const totalQ = grades.reduce((a, g) => a + g.questionsTotal, 0);
  const totalC = grades.reduce((a, g) => a + g.questionsCorrect, 0);
  const globalHitRate = hitRate(totalC, totalQ);
  const globalAverage = useMemo(() => {
    return subjects.length > 0
      ? Math.round(
          (statuses.reduce((a, s) => a + s.average, 0) / statuses.length) * 100,
        ) / 100
      : 0;
  }, [subjects, statuses]);

  // Matérias que precisam de atenção (abaixo da média ou com baixo rendimento em acertos) — apenas para as matérias ativas
  const attentionSubjects = useMemo(() => {
    return statuses.filter(
      (s) =>
        activeSubjects.includes(s.subject) &&
        ((s.gradesCount > 0 && s.average < s.passingGrade) ||
          s.status === "reprovado" ||
          s.status === "em-risco" ||
          (s.hitRate > 0 && s.hitRate < 60)),
    );
  }, [statuses, activeSubjects]);

  // Projeção de Notas para todas as matérias ativas
  const activeReports = useMemo(() => {
    if (activeSubjects.length === 0) return [];

    return activeSubjects.map((sub) => {
      const activeStatus = statuses.find((s) => s.subject === sub);
      const passing = activeStatus?.passingGrade ?? 7.0;
      const currentAvg = activeStatus?.average ?? 0.0;
      const formulaType = activeStatus?.formulaType ?? "simples";

      const subjectGrades = grades.filter((g) => g.subject === sub);
      const n = subjectGrades.length;

      if (n === 0) {
        return {
          subject: sub,
          formulaType,
          currentAvg: 0,
          passing,
          isApproved: false,
          neededAvg: passing,
          needed: null,
        };
      }

      if (currentAvg >= passing) {
        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing,
          isApproved: true,
          neededAvg: 0,
          needed: null,
        };
      }

      if (formulaType === "meta") {
        const currentSum = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + val;
        }, 0);
        const needed = passing - currentSum;
        const isApp = needed <= 0;
        return {
          subject: sub,
          formulaType,
          currentAvg: currentSum,
          passing,
          isApproved: isApp,
          neededAvg: isApp ? 0 : needed,
          needed: null,
        };
      }

      if (formulaType === "simples") {
        const currentSum = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + (val / g.maxGrade) * 10;
        }, 0);
        const needed = passing * (n + 1) - currentSum;
        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing,
          isApproved: false,
          neededAvg: Math.max(0, passing - currentAvg),
          needed: needed <= 0 ? 0 : needed,
        };
      }

      if (formulaType === "ponderada") {
        const currentSumWeighted = subjectGrades.reduce((a, g) => {
          const val = g.halfGrade ? g.grade / 2 : g.grade;
          return a + (val / g.maxGrade) * 10 * g.weight;
        }, 0);
        const currentWeight = subjectGrades.reduce((a, g) => a + g.weight, 0);
        const nextWeight = 1.0; // Assume peso padrão 1.0
        const needed =
          (passing * (currentWeight + nextWeight) - currentSumWeighted) /
          nextWeight;
        return {
          subject: sub,
          formulaType,
          currentAvg,
          passing,
          isApproved: false,
          neededAvg: Math.max(0, passing - currentAvg),
          needed: needed <= 0 ? 0 : needed,
        };
      }

      return {
        subject: sub,
        formulaType,
        currentAvg,
        passing,
        isApproved: false,
        neededAvg: Math.max(0, passing - currentAvg),
        needed: null,
      };
    });
  }, [activeSubjects, statuses, grades]);

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

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Nenhuma matéria encontrada"
        description="Registre uma nova sessão de estudos ou cadastre matérias no painel de matérias para começar."
        className="py-16"
      />
    );
  }

  // Renderizador de Card de Matéria
  const renderSubjectCard = (s: SubjectStatus) => {
    const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["sem-nota"];
    const isExpanded = expandedSubject === s.subject;
    const isStarred = activeSubjects.includes(s.subject);
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
                  {s.gradesCount} avaliação{s.gradesCount !== 1 ? "ões" : ""}
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
                  ? "Remover matéria ativa"
                  : "Marcar como matéria ativa para relatório"
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
                <Star
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
      {/* KPIs globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Avaliações",
            value: totalGrades,
            icon: BookOpen,
            suffix: "",
          },
          {
            label: "Matérias",
            value: subjects.length,
            icon: Target,
            suffix: "",
          },
          {
            label: "Média geral",
            value: fmtGrade(globalAverage),
            icon: Award,
            suffix: "/10",
          },
          {
            label: "Taxa de acerto",
            value: totalQ > 0 ? `${globalHitRate}%` : "—",
            icon: TrendingUp,
            suffix: "",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card/50 border border-border rounded-xl p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <kpi.icon className={cn("w-4 h-4", theme.text)} />
              <span className="text-xs text-muted-foreground font-medium">
                {kpi.label}
              </span>
            </div>
            <span className="text-2xl font-black text-foreground tabular-nums">
              {kpi.value}
              <span className="text-sm font-medium text-muted-foreground ml-0.5">
                {kpi.suffix}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Relatórios Superiores (Matéria Ativa + Atenção) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Projeção de Nota para Matérias Ativas */}
        <div className="lg:col-span-2 bg-card/40 border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Star className={cn("w-5 h-5", theme.text)} fill="currentColor" />
            <h3 className="text-sm font-bold text-foreground">
              Metas das Matérias Ativas
            </h3>
          </div>

          {activeReports.length > 0 ? (
            <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {activeReports.map((report) => (
                <div
                  key={report.subject}
                  className="bg-background/40 border border-border/80 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {report.subject}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider scale-95 origin-left shrink-0">
                        {report.formulaType === "simples"
                          ? "Simples"
                          : report.formulaType === "ponderada"
                            ? "Ponderada"
                            : report.formulaType === "meta"
                              ? "Meta"
                              : "Personalizada"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                        report.isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      )}
                    >
                      {report.isApproved ? "Aprovado" : "Pendente"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <div>
                      {report.formulaType === "meta"
                        ? "Nota acumulada:"
                        : "Média atual:"}{" "}
                      <span className="font-bold text-foreground">
                        {fmtGrade(report.currentAvg)}
                      </span>{" "}
                      / {fmtGrade(report.passing)}
                    </div>
                    {!report.isApproved && report.neededAvg !== undefined && (
                      <span className="text-rose-400/90 font-bold shrink-0">
                        Falta: {fmtGrade(report.neededAvg)}{" "}
                        {report.formulaType === "meta" ? "pontos" : "na média"}
                      </span>
                    )}
                  </div>

                  {!report.isApproved && report.needed !== null && (
                    <div className="text-[10px] text-muted-foreground/80 font-medium">
                      {report.needed > 10 ? (
                        <span className="text-amber-400/90 font-semibold flex items-center gap-1">
                          ⚠️ Requer mais de uma avaliação para atingir a meta
                        </span>
                      ) : (
                        <span>
                          Nota necessária na próxima prova:{" "}
                          <span className="font-bold text-foreground">
                            {fmtGrade(report.needed)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
              <Star className="w-7 h-7 text-neutral-600/70" />
              <p className="text-xs text-neutral-500 font-semibold max-w-sm">
                Selecione matérias ativas clicando no ícone de estrela (★) ao
                lado da matéria na lista abaixo para gerar o relatório de metas
                acadêmicas.
              </p>
            </div>
          )}
        </div>

        {/* Coluna 3: Notas que precisam de atenção */}
        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-foreground">
              Precisa de Atenção
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar flex flex-col gap-2">
            {attentionSubjects.length > 0 ? (
              attentionSubjects.map((s) => {
                const isCriticalHit = s.hitRate > 0 && s.hitRate < 60;
                const isLowAvg =
                  s.gradesCount > 0 && s.average < s.passingGrade;
                return (
                  <div
                    key={s.subject}
                    className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {s.subject}
                      </span>
                      <span className="text-xs font-black text-rose-500 tabular-nums shrink-0">
                        {s.gradesCount > 0 ? fmtGrade(s.average) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-semibold">
                      <span className="text-rose-400/80 truncate">
                        {isLowAvg
                          ? `Abaixo da média (mínimo ${fmtGrade(s.passingGrade)})`
                          : isCriticalHit
                            ? `Desempenho baixo (${s.hitRate}% acertos)`
                            : "Atenção necessária"}
                      </span>
                      {isLowAvg && (
                        <span className="text-rose-400 shrink-0 font-bold">
                          Falta: {fmtGrade(s.passingGrade - s.average)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 gap-2 h-full">
                <ThumbsUp className="w-6 h-6 text-emerald-400" />
                <span className="text-[11px] text-neutral-500 font-semibold">
                  Tudo sob controle! Todas as matérias estão com bom rendimento.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

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
