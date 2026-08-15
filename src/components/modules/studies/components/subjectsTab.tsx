"use client";

import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Clock,
  Folder,
  FolderOpen,
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  Search,
  Settings2,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import type {
  StudyGrade,
  SubjectFormula,
  SubjectGroup,
  SubjectMeta,
} from "@/components/modules/grades/types";
import {
  fmtGrade,
  GRADE_TYPE_COLORS,
  getSubjectStatus,
} from "@/components/modules/grades/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttonGroup";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "../types";
import { formatHours, isoDate, startOfWeek } from "../utils";
import { SubjectEditModal } from "./SubjectEditModal";

interface SubjectsTabProps {
  /** Matérias existentes das sessões de estudo ou avaliações */
  studySubjects: string[];
  userId: string;
  /** Callback para notificar o pai de mudanças que exijam recarga de dados */
  onRefresh?: () => void;
  // Propriedades da mescla
  moduleMode?: "studies" | "grades";
  grades?: StudyGrade[];
  onEditGrade?: (grade: StudyGrade) => void;
  onDeleteGrade?: (id: number) => void;
  activeSubjects?: string[];
  onToggleActiveSubject?: (subject: string) => void;
}

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

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 26 },
  },
};

export function SubjectsTab({
  studySubjects,
  userId,
  onRefresh,
  moduleMode = "studies",
  grades = [],
  onEditGrade,
  onDeleteGrade,
  activeSubjects,
  onToggleActiveSubject,
}: SubjectsTabProps) {
  const color = getModuleColor(moduleMode);
  const theme = getColorTheme(color);
  const _focusBorderClass = theme.text
    .split(" ")[0]
    .replace("text-", "focus:border-");

  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [formulas, setFormulas] = useState<SubjectFormula[]>([]);
  const [loading, setLoading] = useState(true);

  const { now: simulatedNow } = useTime();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [weekStartDay, setWeekStartDay] = useState(1);

  // Estados de busca e filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");

  // Estado de navegação estilo FileManager (activeGroupId controla pasta atual)
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // Estado de modais internos
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] =
    useState<SubjectGroup | null>(null);
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState<
    string | null
  >(null);
  const [deleteSubjects, setDeleteSubjects] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{
    group: SubjectGroup;
    subject: string;
  } | null>(null);

  // Estado das metas ativas (persistidas no localStorage ou fornecidas por props)
  const [internalActiveSubjects, setInternalActiveSubjects] = useState<
    string[]
  >([]);
  const resolvedActiveSubjects = activeSubjects ?? internalActiveSubjects;

  useEffect(() => {
    if (!activeSubjects && typeof window !== "undefined") {
      const stored = localStorage.getItem(`aegis-active-subjects-${userId}`);
      if (stored) {
        try {
          setInternalActiveSubjects(JSON.parse(stored));
        } catch {
          const old = localStorage.getItem(`aegis-active-subject-${userId}`);
          setInternalActiveSubjects(old ? [old] : []);
        }
      } else {
        const old = localStorage.getItem(`aegis-active-subject-${userId}`);
        setInternalActiveSubjects(old ? [old] : []);
      }
    }
  }, [activeSubjects, userId]);

  const toggleActiveSubject = (subject: string) => {
    if (onToggleActiveSubject) {
      onToggleActiveSubject(subject);
    } else {
      const newVal = resolvedActiveSubjects.includes(subject)
        ? resolvedActiveSubjects.filter((s) => s !== subject)
        : [...resolvedActiveSubjects, subject];
      setInternalActiveSubjects(newVal);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `aegis-active-subjects-${userId}`,
          JSON.stringify(newVal),
        );
      }
    }
  };

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [metas, grps, frms, sess, config] = await Promise.all([
        invoke<SubjectMeta[]>("subjects_list", { userId }),
        invoke<SubjectGroup[]>("subject_groups_list", { userId }),
        invoke<SubjectFormula[]>("subject_formulas_list", { userId }),
        invoke<StudySession[]>("studies_list_sessions", {
          userId,
          monthsBack: 1,
        }),
        invoke<{ weekStartDay: number }>("global_get_app_config"),
      ]);
      setSubjectMetas(metas);
      setGroups(grps);
      setFormulas(frms);
      setSessions(sess);
      setWeekStartDay(config.weekStartDay);
    } catch (err) {
      toast.error(`Erro ao carregar dados: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Combina as matérias passadas com as registradas nas metas
  const allSubjects = useMemo(() => {
    const fromGoals = subjectMetas.map((m) => m.name);
    return Array.from(new Set([...studySubjects, ...fromGoals])).sort();
  }, [studySubjects, subjectMetas]);

  const validActiveSubjects = useMemo(() => {
    return resolvedActiveSubjects.filter((s) => allSubjects.includes(s));
  }, [resolvedActiveSubjects, allSubjects]);

  // Mapeia cor por matéria
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const meta of subjectMetas) {
      m[meta.name] = meta.color;
    }
    return m;
  }, [subjectMetas]);

  // Mapeia fórmula por matéria
  const formulaMap = useMemo(() => {
    const m: Record<string, SubjectFormula> = {};
    for (const f of formulas) {
      m[f.subject] = f;
    }
    return m;
  }, [formulas]);

  // Mapeia metas de horas semanais por matéria
  const weeklyTargetMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const meta of subjectMetas) {
      if (
        meta.weeklyTargetHours !== undefined &&
        meta.weeklyTargetHours !== null
      ) {
        m[meta.name] = meta.weeklyTargetHours;
      }
    }
    return m;
  }, [subjectMetas]);

  // Calcula início da semana atual
  const weekStart = useMemo(() => {
    return isoDate(startOfWeek(simulatedNow, weekStartDay));
  }, [simulatedNow, weekStartDay]);

  // Filtra sessões da semana atual
  const weekSessions = useMemo(() => {
    return sessions.filter((s) => s.date >= weekStart);
  }, [sessions, weekStart]);

  // Mapeia total de horas estudadas na semana por matéria
  const weekHoursBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of weekSessions) {
      map[s.subject] = (map[s.subject] || 0) + s.hours;
    }
    return map;
  }, [weekSessions]);

  // Status e médias calculadas por matéria se houver notas
  const subjectStatuses = useMemo(() => {
    return allSubjects.map((s) => {
      const subjectGrades = grades.filter((g) => g.subject === s);
      return getSubjectStatus(s, subjectGrades, formulaMap[s]);
    });
  }, [allSubjects, grades, formulaMap]);

  const statusMap = useMemo(() => {
    return Object.fromEntries(subjectStatuses.map((s) => [s.subject, s]));
  }, [subjectStatuses]);

  // Filtra as matérias avulsas (não pertencem a nenhum grupo)
  const filteredSubjects = useMemo(() => {
    const isInsideGroup = (sName: string) => {
      return groups.some((g) => g.subjects.includes(sName));
    };

    return allSubjects.filter((s) => {
      const matchSearch = s.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Na raiz, mostramos apenas as matérias que não pertencem a nenhum grupo
      return !isInsideGroup(s);
    });
  }, [allSubjects, groups, searchQuery]);

  // Filtra os grupos conforme a busca
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchGroupName = g.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const hasMatchingSubjects = g.subjects.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      return matchGroupName || hasMatchingSubjects;
    });
  }, [groups, searchQuery]);

  // Busca global de matérias (usada quando há pesquisa ativa)
  const searchedAllSubjects = useMemo(() => {
    return allSubjects.filter((s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allSubjects, searchQuery]);

  const handleOpenEditSubject = (name: string) => {
    setEditingSubject(name);
  };

  const handleOpenCreateSubject = () => {
    setEditingSubject("");
  };

  // Salvar criação do grupo
  const handleGroupCreateSave = async (
    name: string,
    selectedSubjects: string[],
    groupColor?: string,
  ) => {
    try {
      await invoke("subject_groups_upsert", {
        group: { userId, name, subjects: selectedSubjects, color: groupColor },
      });

      // Remove de outros grupos para manter relacionamento 1:N
      for (const otherGroup of groups) {
        const remain = otherGroup.subjects.filter(
          (s) => !selectedSubjects.includes(s),
        );
        if (remain.length !== otherGroup.subjects.length) {
          await invoke("subject_groups_upsert", {
            group: { ...otherGroup, subjects: remain },
          });
        }
      }

      toast.success("Grupo criado!");
      await load();
      onRefresh?.();
    } catch (err) {
      toast.error(`Erro ao criar grupo: ${err}`);
    }
  };

  // Salvar edição do grupo
  const handleGroupEditSave = async (
    id: number,
    name: string,
    selectedSubjects: string[],
    groupColor?: string,
  ) => {
    try {
      for (const otherGroup of groups) {
        if (otherGroup.id !== id) {
          const remain = otherGroup.subjects.filter(
            (s) => !selectedSubjects.includes(s),
          );
          if (remain.length !== otherGroup.subjects.length) {
            await invoke("subject_groups_upsert", {
              group: { ...otherGroup, subjects: remain },
            });
          }
        }
      }

      await invoke("subject_groups_upsert", {
        group: {
          id,
          userId,
          name,
          subjects: selectedSubjects,
          color: groupColor,
        },
      });

      toast.success("Grupo atualizado!");
      await load();
      onRefresh?.();
    } catch (err) {
      toast.error(`Erro ao atualizar grupo: ${err}`);
    }
  };

  // Confirmar exclusão do grupo
  const handleGroupDeleteConfirm = async (deleteSubs: boolean) => {
    if (!deleteConfirmGroup || deleteConfirmGroup.id === undefined) return;
    try {
      if (deleteSubs) {
        for (const s of deleteConfirmGroup.subjects) {
          await invoke("subjects_delete", { userId, name: s });
        }
      }
      await invoke("subject_groups_delete", {
        id: deleteConfirmGroup.id,
        userId,
      });
      toast.success("Grupo removido!");
      if (activeGroupId === deleteConfirmGroup.id) {
        setActiveGroupId(null);
        setFilterGroup("all");
      }
      await load();
      onRefresh?.();
    } catch (err) {
      toast.error(`Erro ao excluir grupo: ${err}`);
    }
  };

  // Vincula/desvincula matéria de grupo
  const toggleSubjectInGroup = async (group: SubjectGroup, subject: string) => {
    const isInGroup = group.subjects.includes(subject);
    let newSubjects = group.subjects;
    if (isInGroup) {
      newSubjects = group.subjects.filter((s) => s !== subject);
    } else {
      newSubjects = [...group.subjects, subject];
      for (const otherGroup of groups) {
        if (
          otherGroup.id !== group.id &&
          otherGroup.subjects.includes(subject)
        ) {
          const cleanSubjects = otherGroup.subjects.filter(
            (s) => s !== subject,
          );
          await invoke("subject_groups_upsert", {
            group: { ...otherGroup, subjects: cleanSubjects },
          });
        }
      }
    }

    try {
      await invoke("subject_groups_upsert", {
        group: { ...group, subjects: newSubjects },
      });
      await load();
      onRefresh?.();
    } catch (err) {
      toast.error(`Erro ao atualizar grupo: ${err}`);
    }
  };

  // Sincroniza o dropdown de filtro com a navegação de pastas
  const handleFilterGroupChange = (val: string) => {
    setFilterGroup(val);
    if (val === "all" || val === "none") {
      setActiveGroupId(null);
    } else {
      setActiveGroupId(Number(val));
    }
  };

  const handleFolderClick = (groupId: number) => {
    setActiveGroupId(groupId);
    setFilterGroup(String(groupId));
  };

  const handleGoBack = () => {
    setActiveGroupId(null);
    setFilterGroup("all");
  };

  // Renderiza o card detalhado da matéria (visual mesclado)
  const renderSubjectCard = (subject: string, group?: SubjectGroup) => {
    const subjectColor = colorMap[subject] ?? "slate";
    const hex = resolveColor(subjectColor);
    const subjectFormula = formulaMap[subject];
    const isStarred = validActiveSubjects.includes(subject);
    const status = statusMap[subject];

    const subjectGrades = grades
      .filter((g) => g.subject === subject)
      .sort((a, b) => b.date.localeCompare(a.date));

    const hasGradesData = grades && subjectGrades.length > 0;
    const isExpanded = expandedSubject === subject;

    // Determina status de aprovação
    const cfg = status
      ? STATUS_CONFIG[status.status] || STATUS_CONFIG["sem-nota"]
      : STATUS_CONFIG["sem-nota"];

    const pct = status ? Math.min(100, (status.average / 10) * 100) : 0;
    const isHovered = hoveredSubject === subject;

    return (
      <motion.div
        key={subject}
        variants={itemVariants}
        initial="hidden"
        animate="show"
        onMouseEnter={() => setHoveredSubject(subject)}
        onMouseLeave={() => setHoveredSubject(null)}
        className="bg-card border border-l-4 rounded-xl overflow-hidden transition-all flex flex-col"
        style={{
          borderLeftColor: hex,
          backgroundColor: isHovered ? `${hex}0c` : `${hex}04`,
          borderTopColor: isHovered ? `${hex}45` : "var(--border)",
          borderRightColor: isHovered ? `${hex}45` : "var(--border)",
          borderBottomColor: isHovered ? `${hex}45` : "var(--border)",
        }}
      >
        <div className="w-full flex items-center pr-4 min-h-19 gap-4">
          {/* Lado Esquerdo Clickable (Expande histórico de avaliações se houver notas) */}
          <button
            type="button"
            onClick={() => {
              if (hasGradesData) {
                setExpandedSubject(isExpanded ? null : subject);
              } else {
                handleOpenEditSubject(subject);
              }
            }}
            className="flex-1 p-4 flex flex-col gap-2.5 cursor-pointer text-left min-w-0"
          >
            {/* Linha Superior: Nome da matéria e status */}
            <div className="flex items-start gap-2.5 min-w-0 w-full">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/10 mt-1.5"
                style={{ backgroundColor: hex }}
              />
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-sm font-bold text-foreground wrap-break-word leading-tight whitespace-normal">
                  {subject}
                </h3>
                {hasGradesData && status && (
                  <span
                    className={cn(
                      "self-start sm:self-auto shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border",
                      cfg.className,
                    )}
                  >
                    {cfg.label}
                  </span>
                )}
              </div>
            </div>

            {/* Linha do Meio: Informações da matéria */}
            <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground font-semibold">
              {group && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md border font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: `${hex}0e`,
                    borderColor: `${hex}25`,
                    color: hex,
                  }}
                >
                  <FolderOpen className="w-2.5 h-2.5" />
                  {group.name}
                </span>
              )}
              {hasGradesData && status && (
                <>
                  <span>
                    {status.gradesCount} avaliaç
                    {status.gradesCount === 1 ? "ão" : "ões"}
                  </span>
                  {status.hitRate > 0 && (
                    <span>{status.hitRate}% de acerto</span>
                  )}
                </>
              )}
              {subjectFormula && (
                <span className="opacity-80">
                  {subjectFormula.formulaType === "simples"
                    ? "média simples"
                    : subjectFormula.formulaType === "ponderada"
                      ? "ponderada"
                      : subjectFormula.formulaType}
                </span>
              )}
              {weeklyTargetMap[subject] !== undefined &&
                weeklyTargetMap[subject] > 0 && (
                  <span className="opacity-80 flex items-center gap-1 font-bold">
                    <Target className="w-3 h-3 text-muted-foreground" />
                    Meta: {formatHours(weeklyTargetMap[subject])}/semana
                  </span>
                )}
            </div>

            {/* Barra de Progresso e Média (se houver notas) */}
            {hasGradesData && status && (
              <div className="w-full flex items-center gap-3 mt-1">
                <div className="flex-1 bg-border/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: hex }}
                  />
                </div>
                <div className="text-right shrink-0 flex items-baseline gap-0.5">
                  <span
                    className="text-base font-black tabular-nums leading-none"
                    style={{ color: hex }}
                  >
                    {status.status === "sem-nota"
                      ? "—"
                      : fmtGrade(status.average)}
                  </span>
                  <span className="text-[9px] text-neutral-600 dark:text-neutral-400 font-bold ml-0.5">
                    / {fmtGrade(status.passingGrade)}
                  </span>
                </div>
              </div>
            )}
          </button>

          {/* Ações Rápidas na Direita */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Meta Ativa Toggle */}
            <ToolTip
              content={
                isStarred
                  ? "Remover das metas ativas"
                  : "Marcar como meta ativa para relatório"
              }
            >
              <button
                type="button"
                onClick={() => toggleActiveSubject(subject)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all cursor-pointer border-border bg-card/60 text-muted-foreground hover:text-foreground"
                style={
                  isStarred
                    ? {
                        color: hex,
                        backgroundColor: `${hex}15`,
                        borderColor: `${hex}30`,
                      }
                    : {}
                }
              >
                <Target
                  className="w-3.5 h-3.5"
                  fill={isStarred ? "currentColor" : "none"}
                />
              </button>
            </ToolTip>

            {/* Configurações da matéria / Fórmula */}
            <ToolTip content="Configurar matéria">
              <button
                type="button"
                onClick={() => handleOpenEditSubject(subject)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground transition-all cursor-pointer hover:text-foreground"
                style={isHovered ? { color: hex } : {}}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </ToolTip>

            {/* Excluir Matéria */}
            <ToolTip content="Excluir matéria">
              <button
                type="button"
                onClick={() => setDeleteConfirmSubject(subject)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </ToolTip>

            {/* Desvincular de Grupo (se aplicável) */}
            {group && (
              <button
                type="button"
                onClick={() => setUnlinkConfirm({ group, subject })}
                className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border bg-card text-[10px] font-bold transition-all hover:bg-rose-500/15 hover:text-rose-500 cursor-pointer text-muted-foreground border-border shrink-0"
                title="Desvincular matéria do grupo"
              >
                <X className="w-3 h-3" />
                Desvincular
              </button>
            )}

            {/* Expandir Avaliações (se houver histórico) */}
            {hasGradesData && (
              <button
                type="button"
                onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/40 text-muted-foreground transition-all cursor-pointer"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Progresso de Horas Semanais (Largura Completa do Card) */}
        {weeklyTargetMap[subject] !== undefined &&
          weeklyTargetMap[subject] > 0 && (
            <div className="px-4 pb-4 -mt-1 flex flex-col gap-1 w-full border-t border-border/10 pt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Progresso de Estudos Semanal
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-bold text-foreground">
                    {formatHours(weekHoursBySubject[subject] || 0)}
                  </span>
                  <span> / {formatHours(weeklyTargetMap[subject])}</span>
                </div>
              </div>
              <div className="w-full bg-border/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((weekHoursBySubject[subject] || 0) / weeklyTargetMap[subject]) * 100)}%`,
                    backgroundColor: hex,
                  }}
                />
              </div>
            </div>
          )}

        {/* Histórico expandido (Somente se expanded) */}
        {isExpanded && hasGradesData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50 bg-background/10"
          >
            <div className="p-4 flex flex-col gap-2.5">
              {subjectGrades.length === 0 ? (
                <div className="text-[10px] text-neutral-600 italic text-center py-2">
                  Nenhuma avaliação lançada nesta matéria.
                </div>
              ) : (
                subjectGrades.map((g) => {
                  const typeClass =
                    GRADE_TYPE_COLORS[g.gradeType] ??
                    "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-background/30 border border-border/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border",
                            typeClass,
                          )}
                        >
                          {g.gradeType}
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {g.title || g.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            {fmtGrade(g.grade)} / {fmtGrade(g.maxGrade)}
                          </span>
                          {g.weight > 1 && (
                            <span className="text-[9px] text-neutral-600 ml-1 font-bold">
                              (Peso {g.weight})
                            </span>
                          )}
                        </div>

                        {(onEditGrade || onDeleteGrade) && (
                          <ButtonGroup className="bg-card rounded-md">
                            {onEditGrade && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => onEditGrade(g)}
                                className="text-neutral-500 hover:text-foreground cursor-pointer h-7"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            )}
                            {onDeleteGrade && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => g.id && onDeleteGrade(g.id)}
                                className="text-neutral-500 hover:text-rose-500 cursor-pointer h-7"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </ButtonGroup>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const activeGroup = useMemo(() => {
    if (activeGroupId === null) return null;
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [activeGroupId, groups]);

  const isSearching = searchQuery.trim() !== "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className={cn("flex items-center gap-2 animate-pulse", theme.text)}
        >
          <Layers className="w-4 h-4" />
          <span className="font-bold text-sm">Carregando matérias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Barra de pesquisa geral + Filtros + Ações */}
      {!activeGroup && (
        <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
          {/* Input de busca */}
          <div className="relative flex-1 w-full h-11">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar matérias ou grupos..."
              className={cn(
                "w-full h-full pl-10 pr-4 text-sm font-medium bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 transition-colors outline-none",
                theme.borderHover.replace("hover:", "focus:"),
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filtro por Grupo */}
          <div className="w-full sm:w-48 shrink-0">
            <Select value={filterGroup} onValueChange={handleFilterGroupChange}>
              <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                <SelectValue placeholder="Filtrar por Grupo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-xs">
                  Todos os grupos
                </SelectItem>
                <SelectItem value="none" className="text-xs">
                  Sem grupo
                </SelectItem>
                {groups.map((g) => {
                  const gHex = resolveColor(g.color || "emerald");
                  return (
                    <SelectItem
                      key={g.id}
                      value={String(g.id)}
                      className="text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-border/20"
                          style={{ backgroundColor: gHex }}
                        />
                        <span>{g.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Botão Nova Matéria */}
            <Button
              onClick={handleOpenCreateSubject}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98]",
                theme.solid,
                theme.solidHover,
              )}
            >
              <Plus className="w-4 h-4" />
              Nova matéria
            </Button>

            {/* Botão Novo Grupo */}
            <Button
              variant="outline"
              onClick={() => setShowNewGroup(true)}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-2 h-11 px-4 rounded-xl border font-bold text-xs transition-all active:scale-[0.98]",
                theme.text,
                theme.bg,
                theme.border,
                theme.bgHover,
              )}
            >
              <FolderPlus className="w-4 h-4" />
              Novo grupo
            </Button>
          </div>
        </div>
      )}

      {/* RENDERIZADOR PRINCIPAL: MODO BUSCA OU NAVEGAÇÃO DE PASTAS */}
      {isSearching ? (
        // MODO BUSCA GLOBAL: Exibe resultados planos de matérias e grupos
        <div className="flex flex-col gap-6">
          {filteredGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Grupos Correspondentes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const groupHex = resolveColor(group.color || "emerald");
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: Nested action buttons require using a div container
                    <div
                      key={group.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        group.id !== undefined && handleFolderClick(group.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (group.id !== undefined)
                            handleFolderClick(group.id);
                        }
                      }}
                      className="group flex items-center justify-between p-4 bg-card/45 hover:bg-card/75 border border-border/60 hover:border-border/80 rounded-xl cursor-pointer transition-all min-h-17"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder
                          className="w-5 h-5 shrink-0"
                          style={{ color: groupHex }}
                          fill={groupHex}
                          fillOpacity={0.2}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {group.subjects.length} matéria
                            {group.subjects.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Matérias Correspondentes
            </h3>
            {searchedAllSubjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nenhuma matéria encontrada"
                description="Verifique a ortografia ou adicione uma nova matéria."
                className="py-12 border border-dashed border-border bg-card/10 rounded-xl"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchedAllSubjects.map((subject) => {
                  const subjectGroup = groups.find((g) =>
                    g.subjects.includes(subject),
                  );
                  return renderSubjectCard(subject, subjectGroup);
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeGroup ? (
        // INTERIOR DA PASTA (GRUPO DE MATÉRIAS)
        <div className="flex flex-col gap-4">
          {/* Cabeçalho da pasta / Breadcrumb */}
          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/60 rounded-xl mb-1.5 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleGoBack}
                className="p-2 rounded-xl hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors cursor-pointer"
                >
                  Matérias
                </button>
                <span className="text-xs text-muted-foreground/40 font-bold">
                  &gt;
                </span>
                <span
                  className="text-sm font-bold truncate flex items-center gap-1.5"
                  style={{
                    color: resolveColor(activeGroup.color || "emerald"),
                  }}
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  {activeGroup.name}
                </span>
              </div>
            </div>

            {/* Ações Rápidas do Grupo Atual */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleOpenCreateSubject}
                className={cn(
                  "flex items-center gap-1.5 font-bold text-xs h-9 px-3 rounded-xl text-white transition-all active:scale-[0.98] cursor-pointer",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Matéria
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingGroup(activeGroup)}
                className="flex items-center gap-1.5 font-bold text-xs h-9 px-3 rounded-xl border border-border bg-card/60 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar Grupo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteSubjects(false);
                  setDeleteConfirmGroup(activeGroup);
                }}
                className="flex items-center gap-1.5 font-bold text-xs h-9 px-3 rounded-xl border border-border hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer text-muted-foreground"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Grupo
              </Button>
            </div>
          </div>

          {/* Matérias de dentro da pasta */}
          {activeGroup.subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Este grupo está vazio"
              description="Clique em 'Editar Grupo' acima para vincular matérias existentes."
              className="py-12 border border-dashed border-border bg-card/10 rounded-xl"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeGroup.subjects.map((subject) =>
                renderSubjectCard(subject, activeGroup),
              )}
            </div>
          )}
        </div>
      ) : (
        // RAIZ (DASHBOARD COM PASTAS E MATÉRIAS AVULSAS)
        <div className="flex flex-col gap-6">
          {/* Grade de Pastas dos Grupos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FolderOpen className={cn("w-4 h-4", theme.text)} />
              Grupos
            </h3>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-600 border border-dashed border-border rounded-xl bg-card/10">
                Nenhum grupo de matérias criado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const groupHex = resolveColor(group.color || "emerald");
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: Nested action buttons require using a div container
                    <div
                      key={group.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        group.id !== undefined && handleFolderClick(group.id)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (group.id !== undefined)
                            handleFolderClick(group.id);
                        }
                      }}
                      className="group flex items-center justify-between p-4 bg-card/45 hover:bg-card/75 border border-border/60 hover:border-border/80 rounded-xl cursor-pointer transition-all min-h-17"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder
                          className="w-5 h-5 shrink-0"
                          style={{ color: groupHex }}
                          fill={groupHex}
                          fillOpacity={0.2}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {group.subjects.length} matéria
                            {group.subjects.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroup(group);
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent/40 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSubjects(false);
                            setDeleteConfirmGroup(group);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Matérias Avulsas */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className={cn("w-4 h-4", theme.text)} />
              Matérias Avulsas
              <span className="text-neutral-500 font-medium text-xs">
                ({filteredSubjects.length})
              </span>
            </h3>

            {filteredSubjects.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="Nenhuma matéria avulsa"
                description="Todas as suas matérias estão em grupos ou nenhuma foi criada ainda."
                className="py-8 bg-transparent border-none"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredSubjects.map((subject) => renderSubjectCard(subject))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Unificado de Edição de Matéria */}
      {editingSubject !== null && (
        <SubjectEditModal
          isOpen
          subjectName={editingSubject}
          userId={userId}
          moduleColor={moduleMode}
          initialGroupId={
            activeGroupId !== null ? String(activeGroupId) : undefined
          }
          onClose={() => setEditingSubject(null)}
          onSave={async () => {
            setEditingSubject(null);
            await load();
            onRefresh?.();
          }}
        />
      )}

      {/* Modal de Criação de Grupo */}
      {showNewGroup && (
        <GroupCreateModal
          isOpen
          allSubjects={allSubjects}
          colorMap={colorMap}
          onClose={() => setShowNewGroup(false)}
          onSave={handleGroupCreateSave}
          themeColor={moduleMode}
        />
      )}

      {/* Modal de Edição de Grupo */}
      {editingGroup !== null && (
        <GroupEditModal
          isOpen
          group={editingGroup}
          allSubjects={allSubjects}
          colorMap={colorMap}
          onClose={() => setEditingGroup(null)}
          onSave={handleGroupEditSave}
          themeColor={moduleMode}
        />
      )}

      {/* Confirmação de exclusão do grupo */}
      {deleteConfirmGroup !== null && (
        <ConfirmModal
          title="Excluir Grupo?"
          description={`Deseja remover o grupo "${deleteConfirmGroup.name}"? As matérias vinculadas não serão deletadas, a menos que você selecione a opção abaixo.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            handleGroupDeleteConfirm(deleteSubjects);
            setDeleteConfirmGroup(null);
          }}
          onCancel={() => setDeleteConfirmGroup(null)}
        >
          <div className="flex items-center gap-2 mt-4 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
            <input
              type="checkbox"
              id="delete-subjects-checkbox"
              checked={deleteSubjects}
              onChange={(e) => setDeleteSubjects(e.target.checked)}
              className="w-4 h-4 text-rose-500 border-border rounded focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="delete-subjects-checkbox"
              className="text-xs text-rose-600 font-bold select-none cursor-pointer"
            >
              Excluir também todas as matérias deste grupo
            </label>
          </div>
        </ConfirmModal>
      )}

      {/* Confirmação de exclusão da matéria */}
      {deleteConfirmSubject !== null && (
        <ConfirmModal
          title="Excluir Matéria?"
          description={`Tem certeza que deseja excluir a matéria "${deleteConfirmSubject}"? Isso removerá as sessões ou notas associadas e a desvinculará de qualquer grupo.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={async () => {
            try {
              await invoke("subjects_delete", {
                userId,
                name: deleteConfirmSubject,
              });
              toast.success("Matéria excluída com sucesso!");
              await load();
              onRefresh?.();
            } catch (err) {
              toast.error(`Erro ao excluir matéria: ${err}`);
            } finally {
              setDeleteConfirmSubject(null);
            }
          }}
          onCancel={() => setDeleteConfirmSubject(null)}
        />
      )}

      {/* Confirmação de desvinculação da matéria */}
      {unlinkConfirm !== null && (
        <ConfirmModal
          title="Desvincular Matéria?"
          description={`Deseja remover a matéria "${unlinkConfirm.subject}" do grupo "${unlinkConfirm.group.name}"? Ela continuará existindo como uma matéria avulsa.`}
          confirmLabel="Desvincular"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={async () => {
            await toggleSubjectInGroup(
              unlinkConfirm.group,
              unlinkConfirm.subject,
            );
            setUnlinkConfirm(null);
          }}
          onCancel={() => setUnlinkConfirm(null)}
        />
      )}
    </div>
  );
}

interface GroupCreateModalProps {
  isOpen: boolean;
  allSubjects: string[];
  colorMap: Record<string, string>;
  onClose: () => void;
  onSave: (
    name: string,
    selectedSubjects: string[],
    color?: string,
  ) => Promise<void>;
  themeColor?: "studies" | "grades";
}

function GroupCreateModal({
  isOpen,
  allSubjects,
  colorMap,
  onClose,
  onSave,
  themeColor = "studies",
}: GroupCreateModalProps) {
  const color = getModuleColor(themeColor);
  const theme = getColorTheme(color);

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupColor, setGroupColor] = useState("emerald");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleSubject = (subject: string) => {
    setSelected((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  const availableSubjects = useMemo(() => {
    return allSubjects.filter((s) => !selected.includes(s));
  }, [allSubjects, selected]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome do grupo é obrigatório");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(name.trim(), selected, groupColor);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl" zIndex="z-[60]">
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Novo Grupo de Matérias
          </h2>
          <p className="text-[11px] text-muted-foreground font-semibold">
            Agrupe suas disciplinas para cálculo e filtros
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-87.5">
          {/* Coluna da Esquerda: Configurações do Grupo e Pesquisa */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Nome do Grupo
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Engenharia, Humanas, Idiomas..."
                className="bg-card border-border rounded-xl"
                autoFocus
              />
            </div>

            {/* Seletor de Cores do Grupo (Dropdown Select) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Cor do Grupo
              </Label>
              <Select value={groupColor} onValueChange={setGroupColor}>
                <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                  <SelectValue placeholder="Selecione uma cor para o grupo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SELECTABLE_COLORS.map((c) => (
                    <SelectItem key={c.key} value={c.key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-border/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pesquisar e Adicionar Matérias */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Adicionar Matérias
              </Label>
              <SearchableSelect
                items={availableSubjects}
                value=""
                onChange={(val) => {
                  const s = typeof val === "string" ? val : String(val);
                  if (s && !selected.includes(s)) {
                    setSelected((prev) => [...prev, s]);
                  }
                }}
                placeholder="Selecionar matéria..."
                searchPlaceholder="Buscar matéria..."
                emptyMessage="Nenhuma matéria disponível"
                getItemKey={(s) => s}
                getItemLabel={(s) => s}
                moduleName="studies"
                mode="combobox"
                inputClass="h-10 text-xs"
              />
            </div>
          </div>

          {/* Coluna da Direita: Matérias Vinculadas */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold text-muted-foreground flex justify-between items-center">
              <span>Matérias Vinculadas</span>
              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold">
                {selected.length}
              </span>
            </Label>
            <div className="flex-1 max-h-90 overflow-y-auto custom-scrollbar border border-border/60 rounded-xl bg-card/25 p-3 flex flex-col gap-2 min-h-62.5">
              {selected.map((subject) => {
                const hex = resolveColor(colorMap[subject] ?? "slate");
                return (
                  <div
                    key={subject}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card text-foreground"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-bold truncate">
                        {subject}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSubject(subject)}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer shrink-0"
                      title="Desvincular matéria"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selected.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-xs font-bold text-muted-foreground">
                    Nenhuma matéria vinculada
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 leading-normal">
                    Busque e selecione matérias na coluna da esquerda para
                    adicioná-las a este grupo.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border shrink-0 bg-background/50 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/40 transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving ? "Salvando..." : "Criar Grupo"}
        </button>
      </div>
    </ModalShell>
  );
}

interface GroupEditModalProps {
  isOpen: boolean;
  group: SubjectGroup;
  allSubjects: string[];
  colorMap: Record<string, string>;
  onClose: () => void;
  onSave: (
    id: number,
    name: string,
    selectedSubjects: string[],
    color?: string,
  ) => Promise<void>;
  themeColor?: "studies" | "grades";
}

function GroupEditModal({
  isOpen,
  group,
  allSubjects,
  colorMap,
  onClose,
  onSave,
  themeColor = "studies",
}: GroupEditModalProps) {
  const color = getModuleColor(themeColor);
  const theme = getColorTheme(color);

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [groupColor, setGroupColor] = useState("emerald");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setSelected(group.subjects);
      setGroupColor(group.color || "emerald");
    }
  }, [group]);

  const handleToggleSubject = (subject: string) => {
    setSelected((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  const availableSubjects = useMemo(() => {
    return allSubjects.filter((s) => !selected.includes(s));
  }, [allSubjects, selected]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome do grupo é obrigatório");
      return;
    }
    if (group.id === undefined) return;
    setIsSaving(true);
    try {
      await onSave(group.id, name.trim(), selected, groupColor);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl" zIndex="z-[60]">
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div>
          <h2 className="text-base font-bold text-foreground">Editar Grupo</h2>
          <p className="text-[11px] text-muted-foreground font-semibold">
            Altere as informações do grupo e suas matérias vinculadas
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-87.5">
          {/* Coluna da Esquerda: Configurações do Grupo e Pesquisa */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Nome do Grupo
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Engenharia, Humanas, Idiomas..."
                className="bg-card border-border rounded-xl"
                autoFocus
              />
            </div>

            {/* Seletor de Cores do Grupo (Dropdown Select) */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Cor do Grupo
              </Label>
              <Select value={groupColor} onValueChange={setGroupColor}>
                <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                  <SelectValue placeholder="Selecione uma cor para o grupo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {SELECTABLE_COLORS.map((c) => (
                    <SelectItem key={c.key} value={c.key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 border border-border/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pesquisar e Adicionar Matérias */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-muted-foreground">
                Adicionar Matérias
              </Label>
              <SearchableSelect
                items={availableSubjects}
                value=""
                onChange={(val) => {
                  const s = typeof val === "string" ? val : String(val);
                  if (s && !selected.includes(s)) {
                    setSelected((prev) => [...prev, s]);
                  }
                }}
                placeholder="Selecionar matéria..."
                searchPlaceholder="Buscar matéria..."
                emptyMessage="Nenhuma matéria disponível"
                getItemKey={(s) => s}
                getItemLabel={(s) => s}
                moduleName="studies"
                mode="combobox"
                inputClass="h-10 text-xs"
              />
            </div>
          </div>

          {/* Coluna da Direita: Matérias Vinculadas */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold text-muted-foreground flex justify-between items-center">
              <span>Matérias Vinculadas</span>
              <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold">
                {selected.length}
              </span>
            </Label>
            <div className="flex-1 max-h-90 overflow-y-auto custom-scrollbar border border-border/60 rounded-xl bg-card/25 p-3 flex flex-col gap-2 min-h-62.5">
              {selected.map((subject) => {
                const hex = resolveColor(colorMap[subject] ?? "slate");
                return (
                  <div
                    key={subject}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card text-foreground"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-bold truncate">
                        {subject}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSubject(subject)}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer shrink-0"
                      title="Desvincular matéria"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selected.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-xs font-bold text-muted-foreground">
                    Nenhuma matéria vinculada
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 leading-normal">
                    Busque e selecione matérias na coluna da esquerda para
                    adicioná-las a este grupo.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border shrink-0 bg-background/50 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/40 transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </ModalShell>
  );
}

export {
  SubjectsTab as MateriasTab,
  type SubjectsTabProps as MateriasTabProps,
  type SubjectsTabProps,
};
