"use client";

import { invoke } from "@tauri-apps/api/core";
import { BarChart2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import type {
  SubjectFormula,
  SubjectGroup,
  SubjectMeta,
} from "@/components/modules/grades/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface SubjectEditModalProps {
  isOpen: boolean;
  subjectName: string;
  userId: string;
  moduleColor?: "studies" | "grades";
  onClose: () => void;
  onSave: () => void;
  initialGroupId?: string;
}

const FORMULA_OPTIONS = [
  {
    id: "simples" as const,
    label: "Média Simples",
    desc: "Soma de todas as notas dividida pela quantidade de avaliações.",
  },
  {
    id: "ponderada" as const,
    label: "Ponderada",
    desc: "Cada avaliação tem um peso. Use o campo 'Peso' ao registrar notas.",
  },
  {
    id: "meta" as const,
    label: "Meta de Nota",
    desc: "Mostra a nota que você precisa nas próximas avaliações para atingir a média.",
  },
  {
    id: "personalizada" as const,
    label: "Personalizada",
    desc: "Define sua própria fórmula usando N1, N2, N3... até N15.",
  },
];

export function SubjectEditModal({
  isOpen,
  subjectName,
  userId,
  moduleColor = "studies",
  onClose,
  onSave,
  initialGroupId,
}: SubjectEditModalProps) {
  const color = getModuleColor(moduleColor);
  const theme = getColorTheme(color);
  const focusBorderClass = theme.text
    .split(" ")[0]
    .replace("text-", "focus:border-");

  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editSubjectName, setEditSubjectName] = useState(subjectName);
  const [editSubjectColor, setEditSubjectColor] = useState("blue");
  const [editSubjectGroup, setEditSubjectGroup] = useState<string>("none");
  const [editSubjectFormulaType, setEditSubjectFormulaType] =
    useState<string>("simples");
  const [editSubjectPassingGrade, setEditSubjectPassingGrade] =
    useState<number>(7);
  const [editSubjectCustomFormula, setEditSubjectCustomFormula] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId || !isOpen) return;

    setLoading(true);
    setEditSubjectName(subjectName);

    Promise.all([
      invoke<SubjectMeta[]>("subjects_list", { userId }),
      invoke<SubjectGroup[]>("subject_groups_list", { userId }),
      invoke<SubjectFormula[]>("subject_formulas_list", { userId }),
    ])
      .then(([metas, grps, frms]) => {
        setGroups(grps);

        // Find current color
        const meta = metas.find((m) => m.name === subjectName);
        if (meta) {
          setEditSubjectColor(meta.color);
        } else {
          setEditSubjectColor("blue");
        }

        // Find current group
        const grp = grps.find((g) => g.subjects.includes(subjectName));
        if (grp) {
          setEditSubjectGroup(String(grp.id));
        } else if (initialGroupId) {
          setEditSubjectGroup(initialGroupId);
        } else {
          setEditSubjectGroup("none");
        }

        // Find current formula
        const frm = frms.find((f) => f.subject === subjectName);
        if (frm) {
          setEditSubjectFormulaType(frm.formulaType);
          setEditSubjectPassingGrade(frm.passingGrade);
          setEditSubjectCustomFormula(frm.customFormula ?? "");
        } else {
          setEditSubjectFormulaType("simples");
          setEditSubjectPassingGrade(7);
          setEditSubjectCustomFormula("");
        }
      })
      .catch((err) => {
        toast.error(`Erro ao carregar dados da matéria: ${err}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, subjectName, isOpen, initialGroupId]);

  const handleSaveComplete = async () => {
    const trimmedName = editSubjectName.trim();
    if (!trimmedName) {
      toast.error("O nome da matéria é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      const isRename = subjectName !== trimmedName;

      // 1. Executa o comando de renomeação no backend de forma atômica/transacional se mudou o nome
      if (isRename && subjectName) {
        await invoke("subjects_rename", {
          userId,
          oldName: subjectName,
          newName: trimmedName,
        });
      }

      // 2. Salva ou atualiza a Cor/Meta da Matéria
      await invoke("subjects_upsert", {
        subject: { userId, name: trimmedName, color: editSubjectColor },
      });

      // 3. Atualizar Grupo
      // Remove do grupo antigo se tiver
      for (const group of groups) {
        if (
          group.subjects.includes(subjectName) ||
          group.subjects.includes(trimmedName)
        ) {
          const updated = group.subjects.filter(
            (s) => s !== subjectName && s !== trimmedName,
          );
          await invoke("subject_groups_upsert", {
            group: { ...group, subjects: updated },
          });
        }
      }

      // Adiciona no novo grupo se selecionado
      if (editSubjectGroup !== "none") {
        const targetGroup = groups.find(
          (g) => String(g.id) === editSubjectGroup,
        );
        if (targetGroup) {
          const updated = [
            ...targetGroup.subjects.filter(
              (s) => s !== subjectName && s !== trimmedName,
            ),
            trimmedName,
          ];
          await invoke("subject_groups_upsert", {
            group: { ...targetGroup, subjects: updated },
          });
        }
      }

      // 4. Atualizar Fórmula de Média (usa tipo "personalizada" se selecionado)
      await invoke("subject_formulas_upsert", {
        formula: {
          userId,
          subject: trimmedName,
          formulaType: editSubjectFormulaType,
          passingGrade: editSubjectPassingGrade,
          customFormula:
            editSubjectFormulaType === "personalizada"
              ? editSubjectCustomFormula
              : undefined,
        },
      });

      toast.success(
        subjectName
          ? "Matéria atualizada com sucesso!"
          : "Matéria criada com sucesso!",
      );
      onSave();
    } catch (err) {
      toast.error(`Erro ao salvar matéria: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl" zIndex="z-[60]">
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <h2 className="text-base font-bold text-foreground">
          {subjectName ? "Editar Matéria" : "Nova Matéria"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 animate-pulse text-muted-foreground">
            <BarChart2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold">
              Buscando dados da matéria...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Dados Básicos */}
            <div className="flex flex-col gap-5">
              {/* Nome da matéria */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                  Nome da Matéria
                </Label>
                <Input
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className={cn(
                    "bg-card border-border hover:border-border/80 rounded-xl focus:ring-0 focus-visible:ring-0",
                    focusBorderClass,
                  )}
                  placeholder="Ex: Direito Constitucional..."
                />
              </div>

              {/* Cor */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                  Cor Identidade
                </Label>
                <Select
                  value={editSubjectColor}
                  onValueChange={setEditSubjectColor}
                >
                  <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                    <SelectValue placeholder="Selecione uma cor" />
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

              {/* Grupo de Matérias */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                  Grupo
                </Label>
                <Select
                  value={editSubjectGroup}
                  onValueChange={setEditSubjectGroup}
                >
                  <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                    <SelectValue placeholder="Nenhum Grupo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="none" className="text-xs">
                      Nenhum Grupo
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
            </div>

            {/* Coluna Direita: Regras de Média */}
            <div className="flex flex-col gap-5 border-t md:border-t-0 md:border-l border-border/60 pt-5 md:pt-0 md:pl-6">
              <Label className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <BarChart2 className={cn("w-4 h-4", theme.text)} />
                Configurar Cálculo da Média
              </Label>

              {/* Nota mínima */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                  Nota Mínima de Aprovação
                </Label>
                <div className="flex gap-1.5">
                  {[5.0, 6.0, 7.0, 8.0].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditSubjectPassingGrade(v)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                        editSubjectPassingGrade === v
                          ? cn(theme.bg, theme.border, theme.text)
                          : "bg-card border-border text-muted-foreground hover:bg-accent/40",
                      )}
                    >
                      {v.toFixed(1)}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className={cn(
                      "w-16 text-center bg-card border border-border rounded-lg text-xs font-bold focus:outline-none focus:ring-0 focus-visible:ring-0",
                      focusBorderClass,
                    )}
                    value={editSubjectPassingGrade}
                    onChange={(e) =>
                      setEditSubjectPassingGrade(
                        parseFloat(e.target.value) || 7.0,
                      )
                    }
                  />
                </div>
              </div>

              {/* Fórmula */}
              <div className="flex flex-col gap-1.5 mt-1">
                <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                  Fórmula de Média
                </Label>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {FORMULA_OPTIONS.map((opt) => {
                    const isSelected = editSubjectFormulaType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditSubjectFormulaType(opt.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-center gap-1",
                          isSelected
                            ? cn(theme.bg, theme.border, theme.text)
                            : "bg-card border-border hover:bg-accent/30",
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-bold transition-colors",
                            isSelected
                              ? theme.text.split(" ")[0]
                              : "text-foreground",
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customizada */}
              {editSubjectFormulaType === "personalizada" && (
                <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs font-bold text-muted-foreground ml-0.5">
                    Expressão da Fórmula
                  </Label>
                  <Input
                    placeholder="Ex: (N1*2 + N2*3 + N3*5) / 10"
                    value={editSubjectCustomFormula}
                    onChange={(e) =>
                      setEditSubjectCustomFormula(e.target.value)
                    }
                    className="bg-card border-border rounded-xl font-mono text-xs"
                  />
                  <p className="text-[9px] text-neutral-600 leading-normal">
                    Utilize N1, N2, N3... até N15 para mapear as notas das
                    avaliações na ordem cronológica (serão normalizadas para 0 a
                    10).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
          disabled={isSaving || loading}
          onClick={handleSaveComplete}
          className={cn(
            "flex-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving
            ? "Salvando..."
            : subjectName
              ? "Salvar Alterações"
              : "Criar Matéria"}
        </button>
      </div>
    </ModalShell>
  );
}
