"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { GradesTabId, StudyGrade, SubjectFormula, SubjectGroup, SubjectMeta } from "./types";
import { GradeForm } from "./components/gradeForm";
import { GradesHistory } from "./components/gradesHistory";
import { GradesOverview } from "./components/gradesOverview";
import { SubjectEditModal } from "../studies/components/SubjectEditModal";

interface GradesModalProps {
  /** Matérias existentes do módulo de estudos */
  existingSubjects?: string[];
  onClose: () => void;
}

const GRADES_TABS: { id: GradesTabId; label: string; icon: typeof BarChart2 }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: BarChart2 },
  { id: "historico", label: "Histórico", icon: Clock },
];

/**
 * Modal principal do módulo Simulados & Notas.
 * Renderizado como overlay sobre o módulo de Estudos.
 */
export function GradesModal({ existingSubjects = [], onClose }: GradesModalProps) {
  const { user } = useAuth();
  const color = getModuleColor("grades");
  const theme = getColorTheme(color);
  const uid = user ? String(user.id) : "";

  const [tab, setTab] = useState<GradesTabId>("visao-geral");
  const [grades, setGrades] = useState<StudyGrade[]>([]);
  const [formulas, setFormulas] = useState<SubjectFormula[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de modais/formulários
  const [showForm, setShowForm] = useState(false);
  const [editGrade, setEditGrade] = useState<StudyGrade | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do configurador de fórmula
  const [formulaSubject, setFormulaSubject] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [g, f, grps, metas] = await Promise.all([
        invoke<StudyGrade[]>("grades_list", { userId: uid }),
        invoke<SubjectFormula[]>("subject_formulas_list", { userId: uid }),
        invoke<SubjectGroup[]>("subject_groups_list", { userId: uid }),
        invoke<SubjectMeta[]>("subjects_list", { userId: uid }),
      ]);
      setGrades(g);
      setFormulas(f);
      setGroups(grps);
      setSubjectMetas(metas);
    } catch (err) {
      toast.error(`Erro ao carregar dados: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Matérias: combina as do módulo de estudos com as das próprias grades e as criadas na tab de matérias
  const allSubjects = useMemo(() => {
    const fromGrades = grades.map((g) => g.subject);
    const fromMetas = subjectMetas.map((m) => m.name);
    const merged = Array.from(new Set([...existingSubjects, ...fromGrades, ...fromMetas])).sort();
    return merged;
  }, [grades, existingSubjects, subjectMetas]);

  // Salvar grade
  const handleSave = async (g: StudyGrade) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (g.id) {
        await invoke("grades_update", { grade: g });
        toast.success("Avaliação atualizada!");
      } else {
        await invoke("grades_add", { grade: g });
        toast.success("Avaliação registrada!");
      }
      setShowForm(false);
      setEditGrade(undefined);
      await load();
    } catch (err) {
      toast.error(`Erro ao salvar: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("grades_delete", { id, userId: uid });
      toast.success("Avaliação removida");
      setDeleteConfirm(null);
      await load();
    } catch {
      toast.error("Erro ao remover avaliação");
    }
  };

  // Salvar fórmula
  const handleSaveFormula = async (f: SubjectFormula) => {
    try {
      await invoke("subject_formulas_upsert", { formula: f });
      toast.success("Fórmula salva!");
      setFormulaSubject(null);
      await load();
    } catch (err) {
      toast.error(`Erro ao salvar fórmula: ${err}`);
    }
  };

  const formulaForSubject = formulaSubject
    ? formulas.find((f) => f.subject === formulaSubject)
    : undefined;

  return (
    <div className="w-full flex flex-col gap-6 pb-10 animate-in fade-in duration-300">
      <ModuleHeader
        color={getModuleColor("grades")}
        title="Simulados & Notas"
        subtitle="Histórico acadêmico e cálculo de médias"
        icon={BarChart2}
        tabs={GRADES_TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as GradesTabId)}
        onBack={onClose}
        actions={[
          {
            id: "new",
            label: "Nova avaliação",
            icon: Plus,
            tooltip: "Registrar nova avaliação",
            primary: true,
            onClick: () => {
              setEditGrade(undefined);
              setShowForm(true);
            },
          },
        ]}
      />

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={cn("flex items-center gap-2 animate-pulse", theme.text)}>
              <BookOpen className="w-4 h-4" />
              <span className="font-bold text-sm">Carregando notas...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "visao-geral" && (
                <GradesOverview
                  grades={grades}
                  formulas={formulas}
                  groups={groups}
                  allSubjects={allSubjects}
                  onConfigFormula={(s) => setFormulaSubject(s)}
                  onAddGrade={() => setShowForm(true)}
                  onEditGrade={(g) => {
                    setEditGrade(g);
                    setShowForm(true);
                  }}
                  userId={uid}
                />
              )}
              {tab === "historico" && (
                <GradesHistory
                  grades={grades}
                  groups={groups}
                  onEdit={(g) => {
                    setEditGrade(g);
                    setShowForm(true);
                  }}
                  onDelete={setDeleteConfirm}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Modal de formulário de grade */}
      {showForm && (
        <ModalShell isOpen onClose={() => { setShowForm(false); setEditGrade(undefined); }} size="xl" zIndex="z-[60]">
          <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
                <BarChart2 className={cn("w-5 h-5", theme.text)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {editGrade ? "Editar avaliação" : "Nova avaliação"}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Registre seu desempenho acadêmico
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditGrade(undefined); }}
              className="p-2.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <GradeForm
              userId={uid}
              initial={editGrade}
              existingSubjects={allSubjects}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditGrade(undefined); }}
            />
          </div>

          <div className="p-6 border-t border-border shrink-0 bg-background/50 flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditGrade(undefined); }}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="grades-form"
              disabled={isSaving}
              className={cn(
                "flex-[2] px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                theme.solid,
                theme.solidHover,
              )}
            >
              {isSaving
                ? "Salvando..."
                : editGrade
                  ? "Salvar alterações"
                  : "Registrar avaliação"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Modal de configuração de fórmula */}
      {formulaSubject && (
        <SubjectEditModal
          isOpen
          subjectName={formulaSubject}
          userId={uid}
          moduleColor="grades"
          onClose={() => setFormulaSubject(null)}
          onSave={async () => {
            setFormulaSubject(null);
            await load();
          }}
        />
      )}

      {/* Confirmação de exclusão */}
      {deleteConfirm !== null && (
        <ConfirmModal
          title="Excluir avaliação?"
          description="Esta avaliação será removida permanentemente e afetará seus cálculos de média."
          confirmLabel="Excluir"
          cancelLabel="Agora não"
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
