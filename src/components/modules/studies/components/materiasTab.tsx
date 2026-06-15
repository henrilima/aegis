"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FolderOpen,
  FolderPlus,
  Layers,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import type {
  SubjectFormula,
  SubjectGroup,
  SubjectMeta,
} from "@/components/modules/grades/types";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttonGroup";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { Switch } from "@/components/ui/switch";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { SubjectEditModal } from "./SubjectEditModal";

interface MateriasTabProps {
  /** Matérias existentes das sessões de estudo */
  studySubjects: string[];
  userId: string;
}

const _FORMULA_OPTIONS = [
  {
    id: "simples",
    label: "Média Simples",
    desc: "Soma das notas dividida pela quantidade.",
  },
  {
    id: "ponderada",
    label: "Ponderada",
    desc: "Média com pesos configuráveis por avaliação.",
  },
  {
    id: "meta",
    label: "Meta",
    desc: "Nota mínima pendente necessária para aprovação.",
  },
  {
    id: "custom",
    label: "Personalizada",
    desc: "Expressão matemática customizada (ex: N1*0.4 + N2*0.6).",
  },
];

export function MateriasTab({ studySubjects, userId }: MateriasTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [formulas, setFormulas] = useState<SubjectFormula[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de busca
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de grupos
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] =
    useState<SubjectGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [deleteSubjects, setDeleteSubjects] = useState(false);

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Estado do modal de edição unificado
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [metas, grps, frms] = await Promise.all([
        invoke<SubjectMeta[]>("subjects_list", { userId }),
        invoke<SubjectGroup[]>("subject_groups_list", { userId }),
        invoke<SubjectFormula[]>("subject_formulas_list", { userId }),
      ]);
      setSubjectMetas(metas);
      setGroups(grps);
      setFormulas(frms);
    } catch (err) {
      toast.error(`Erro ao carregar dados: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Combina matérias do estudo com as já configuradas
  const allSubjects = useMemo(() => {
    const fromMetas = subjectMetas.map((m) => m.name);
    return Array.from(new Set([...studySubjects, ...fromMetas])).sort();
  }, [studySubjects, subjectMetas]);

  // Set de matérias agrupadas para busca rápida
  const groupedSubjectsSet = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      for (const s of g.subjects) {
        set.add(s);
      }
    }
    return set;
  }, [groups]);

  // Filtra matérias com base na busca (apenas não agrupadas)
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter(
      (s) =>
        !groupedSubjectsSet.has(s) &&
        s.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allSubjects, groupedSubjectsSet, searchQuery]);

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

  // Filtra os grupos conforme a busca (mostra se o grupo bate com a busca ou se contém matérias filtradas)
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

  // Abre o modal unificado de edição da matéria
  const handleOpenEditSubject = (name: string) => {
    setEditingSubject(name);
  };

  // Salvar criação do grupo
  const handleGroupCreateSave = async (
    name: string,
    selectedSubjects: string[],
    color?: string,
  ) => {
    try {
      await invoke("subject_groups_upsert", {
        group: { userId, name, subjects: selectedSubjects, color },
      });

      // Remove as matérias selecionadas de outros grupos
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
    } catch (err) {
      toast.error(`Erro ao criar grupo: ${err}`);
    }
  };

  // Salvar edição do grupo
  const handleGroupEditSave = async (
    id: number,
    name: string,
    selectedSubjects: string[],
    color?: string,
  ) => {
    try {
      // Remove as matérias selecionadas de outros grupos
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
        group: { id, userId, name, subjects: selectedSubjects, color },
      });

      toast.success("Grupo atualizado!");
      await load();
    } catch (err) {
      toast.error(`Erro ao atualizar grupo: ${err}`);
    }
  };

  // Confirmar exclusão do grupo
  const handleGroupDeleteConfirm = async (deleteSubjects: boolean) => {
    if (!deleteConfirmGroup || deleteConfirmGroup.id === undefined) return;
    try {
      if (deleteSubjects) {
        for (const s of deleteConfirmGroup.subjects) {
          await invoke("subjects_delete", { userId, name: s });
        }
      }
      await invoke("subject_groups_delete", {
        id: deleteConfirmGroup.id,
        userId,
      });
      toast.success("Grupo removido!");
      await load();
    } catch (err) {
      toast.error(`Erro ao excluir grupo: ${err}`);
    }
  };

  // Vincula ou desvincula uma matéria específica de um grupo
  const toggleSubjectInGroup = async (group: SubjectGroup, subject: string) => {
    const isInGroup = group.subjects.includes(subject);
    let newSubjects = group.subjects;
    if (isInGroup) {
      newSubjects = group.subjects.filter((s) => s !== subject);
    } else {
      newSubjects = [...group.subjects, subject];
      // Remove de outros grupos para manter relacionamento 1:N
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
    } catch (err) {
      toast.error(`Erro ao atualizar grupo: ${err}`);
    }
  };

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
    <div className="flex flex-col gap-6">
      {/* Barra de pesquisa geral */}
      <div className="relative w-full h-11 shrink-0">
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

      {/* Seção de Grupos */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FolderOpen className={cn("w-4 h-4", theme.text)} />
            Grupos de matérias
          </h3>
          <button
            type="button"
            onClick={() => setShowNewGroup(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95",
              theme.bg,
              theme.border,
              theme.text,
              theme.bgHover,
            )}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Novo grupo
          </button>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-600 border border-dashed border-border rounded-xl bg-card/10">
            {searchQuery
              ? "Nenhum grupo corresponde à busca."
              : "Nenhum grupo criado."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGroups.map((group) => {
              const isExpanded =
                group.id !== undefined && expandedGroups.includes(group.id);
              const groupHex = resolveColor(group.color || "emerald");
              return (
                <div
                  key={group.id}
                  className="bg-card/40 border border-border rounded-xl overflow-hidden shadow-sm hover:shadow transition-colors"
                  style={{ borderLeft: `3px solid ${groupHex}` }}
                >
                  {/* Header do grupo */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/30">
                    <button
                      type="button"
                      onClick={() =>
                        group.id !== undefined && toggleGroupExpanded(group.id)
                      }
                      className="flex-1 flex items-center gap-2 cursor-pointer text-left min-w-0"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-neutral-500 transition-transform duration-200 shrink-0",
                          isExpanded && "rotate-180",
                        )}
                      />
                      <FolderOpen
                        className="w-4 h-4 shrink-0"
                        style={{ color: groupHex }}
                      />
                      <span className="text-sm font-bold text-foreground truncate">
                        {group.name}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-bold px-2 py-0.5 rounded-full bg-muted border border-border/40 shrink-0">
                        {group.subjects.length} matéria
                        {group.subjects.length !== 1 ? "s" : ""}
                      </span>
                    </button>

                    <ButtonGroup className="shrink-0 bg-card rounded-md">
                      <ToolTip content="Editar grupo">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setEditingGroup(group)}
                          className="text-neutral-500 hover:text-foreground cursor-pointer h-7"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </ToolTip>
                      <ToolTip content="Excluir grupo">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setDeleteSubjects(false);
                            setDeleteConfirmGroup(group);
                          }}
                          className="text-neutral-500 hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer h-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </ToolTip>
                    </ButtonGroup>
                  </div>

                  {/* Matérias ativas no grupo (Acordeão) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 flex flex-col gap-2 bg-background/20 border-t border-border/30">
                          {group.subjects.length === 0 ? (
                            <div className="text-[11px] text-neutral-600 italic py-3 text-center">
                              Nenhuma matéria vinculada a este grupo.
                            </div>
                          ) : (
                            group.subjects.map((subject) => {
                              const subjectColor = colorMap[subject] ?? "slate";
                              const hex = resolveColor(subjectColor);
                              const subjectFormula = formulaMap[subject];

                              return (
                                <div
                                  key={subject}
                                  className="group bg-card/40 border border-border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors hover:bg-card hover:border-border/80"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className="w-4 h-4 rounded-full border border-border/80 shrink-0"
                                      style={{ backgroundColor: hex }}
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-bold text-foreground truncate">
                                        {subject}
                                      </span>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] text-neutral-500 bg-muted px-2 py-0.5 rounded-full border border-border/40 font-semibold flex items-center gap-1">
                                          <FolderOpen
                                            className="w-2.5 h-2.5"
                                            style={{ color: groupHex }}
                                          />
                                          {group.name}
                                        </span>
                                        {subjectFormula && (
                                          <span className="text-[10px] text-emerald-400/90 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold">
                                            Média: {subjectFormula.formulaType}{" "}
                                            (min {subjectFormula.passingGrade})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenEditSubject(subject)
                                      }
                                      className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-card text-xs font-bold transition-all hover:bg-accent/40 active:scale-95 cursor-pointer text-muted-foreground",
                                        theme.borderHover,
                                      )}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleSubjectInGroup(group, subject)
                                      }
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-card text-xs font-bold transition-all hover:bg-rose-500/10 hover:text-rose-500 active:scale-95 cursor-pointer text-muted-foreground border-border"
                                      title="Desvincular matéria"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Desvincular
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de Matérias */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Layers className={cn("w-4 h-4", theme.text)} />
          Matérias
          <span className="text-neutral-500 font-medium text-xs">
            ({filteredSubjects.length})
          </span>
        </h3>

        {filteredSubjects.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nenhuma matéria encontrada"
            description={
              searchQuery
                ? "Ajuste os termos de busca."
                : "Registre sessões de estudo para que as matérias apareçam aqui."
            }
            className="py-12 border border-dashed border-border bg-card/10 rounded-xl"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredSubjects.map((subject) => {
              const subjectColor = colorMap[subject] ?? "slate";
              const hex = resolveColor(subjectColor);
              const subjectGroup = groups.find((g) =>
                g.subjects.includes(subject),
              );
              const subjectFormula = formulaMap[subject];

              return (
                <div
                  key={subject}
                  className="group bg-card/40 border border-border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors hover:bg-card hover:border-border/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full border border-border/80 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-foreground truncate">
                        {subject}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {subjectGroup ? (
                          <span className="text-[10px] text-neutral-500 bg-muted px-2 py-0.5 rounded-full border border-border/40 font-semibold flex items-center gap-1">
                            <FolderOpen className="w-2.5 h-2.5" />
                            {subjectGroup.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-600 italic px-2 py-0.5">
                            Sem grupo
                          </span>
                        )}
                        {subjectFormula && (
                          <span className="text-[10px] text-emerald-400/90 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 font-bold">
                            Média: {subjectFormula.formulaType} (min{" "}
                            {subjectFormula.passingGrade})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSubject(subject)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-card text-xs font-bold transition-all hover:bg-accent/40 active:scale-95 cursor-pointer text-muted-foreground",
                        theme.borderHover,
                      )}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Unificado de Edição de Matéria */}
      {editingSubject && (
        <SubjectEditModal
          isOpen
          subjectName={editingSubject}
          userId={userId}
          moduleColor="studies"
          onClose={() => setEditingSubject(null)}
          onSave={async () => {
            setEditingSubject(null);
            await load();
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
        />
      )}

      {/* Modal de Edição de Grupo */}
      {editingGroup && (
        <GroupEditModal
          isOpen
          group={editingGroup}
          allSubjects={allSubjects}
          colorMap={colorMap}
          onClose={() => setEditingGroup(null)}
          onSave={handleGroupEditSave}
        />
      )}

      {/* Modal de Confirmação de Exclusão de Grupo */}
      {deleteConfirmGroup && (
        <ConfirmModal
          title="Excluir Grupo"
          description={`Tem certeza de que deseja excluir o grupo "${deleteConfirmGroup.name}"?`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={async () => {
            await handleGroupDeleteConfirm(deleteSubjects);
            setDeleteConfirmGroup(null);
          }}
          onCancel={() => setDeleteConfirmGroup(null)}
        >
          <div className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl gap-3 text-left">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground">
                Apagar matérias do grupo?
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                Se ativado, todas as matérias deste grupo serão permanentemente
                excluídas. Se desativado, elas serão mantidas e desvinculadas.
              </span>
            </div>
            <Switch
              checked={deleteSubjects}
              onCheckedChange={setDeleteSubjects}
            />
          </div>
        </ConfirmModal>
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
}

function GroupCreateModal({
  isOpen,
  allSubjects,
  colorMap,
  onClose,
  onSave,
}: GroupCreateModalProps) {
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
    <ModalShell isOpen={isOpen} onClose={onClose} size="md" zIndex="z-[60]">
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

      <div className="p-6 overflow-y-auto max-h-[50vh] flex flex-col gap-4 custom-scrollbar">
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

        {/* Seletor de Cores do Grupo */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-muted-foreground">
            Cor do Grupo
          </Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/40 border border-border/50 rounded-xl">
            {SELECTABLE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setGroupColor(c.key)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all cursor-pointer hover:scale-125 flex items-center justify-center",
                  groupColor === c.key
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {groupColor === c.key && (
                  <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-muted-foreground">
            Vincular Matérias (Opcional)
          </Label>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {allSubjects.map((subject) => {
              const isChecked = selected.includes(subject);
              const hex = resolveColor(colorMap[subject] ?? "slate");
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleToggleSubject(subject)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left",
                    isChecked
                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                      : "bg-card border-border hover:bg-accent/45 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs font-bold">{subject}</span>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isChecked
                        ? "bg-emerald-600 border-emerald-500"
                        : "border-border",
                    )}
                  >
                    {isChecked && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
            {allSubjects.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Nenhuma matéria criada ainda.
              </p>
            )}
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs transition-all hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
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
}

function GroupEditModal({
  isOpen,
  group,
  allSubjects,
  colorMap,
  onClose,
  onSave,
}: GroupEditModalProps) {
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
    <ModalShell isOpen={isOpen} onClose={onClose} size="md" zIndex="z-[60]">
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

      <div className="p-6 overflow-y-auto max-h-[50vh] flex flex-col gap-4 custom-scrollbar">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-muted-foreground">
            Nome do Grupo
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-card border-border rounded-xl"
            autoFocus
          />
        </div>

        {/* Seletor de Cores do Grupo */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-muted-foreground">
            Cor do Grupo
          </Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/40 border border-border/50 rounded-xl">
            {SELECTABLE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setGroupColor(c.key)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all cursor-pointer hover:scale-125 flex items-center justify-center",
                  groupColor === c.key
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              >
                {groupColor === c.key && (
                  <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-bold text-muted-foreground">
            Gerenciar Matérias Vinculadas
          </Label>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {allSubjects.map((subject) => {
              const isChecked = selected.includes(subject);
              const hex = resolveColor(colorMap[subject] ?? "slate");
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleToggleSubject(subject)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left",
                    isChecked
                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                      : "bg-card border-border hover:bg-accent/45 text-muted-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs font-bold">{subject}</span>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isChecked
                        ? "bg-emerald-600 border-emerald-500"
                        : "border-border",
                    )}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
            {allSubjects.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Nenhuma matéria disponível.
              </p>
            )}
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs transition-all hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </ModalShell>
  );
}
