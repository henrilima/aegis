"use client";

import {
  Calendar,
  Check,
  Flag,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type {
  GoalStatus,
  GoalTimeframe,
  HabitGoal,
  HabitMilestone,
} from "../../types";

interface GoalModalProps {
  goal?: HabitGoal | null;
  userId: string;
  onSave: (
    goal: HabitGoal,
    createTasksForNewMilestones?: boolean[],
  ) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = [
  "Carreira",
  "Saúde & fitness",
  "Estudos",
  "Finanças",
  "Projetos",
  "Pessoal",
  "Geral",
];

export function GoalModal({ goal, userId, onSave, onClose }: GoalModalProps) {
  const theme = getColorTheme(getModuleColor("habits"));
  const { now: simulatedNow } = useTime();
  const currentYear = simulatedNow.getFullYear();

  const [title, setTitle] = useState(goal?.title || "");
  const [description, setDescription] = useState(goal?.description || "");
  const [category, setCategory] = useState(goal?.category || "Carreira");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(
    goal?.timeframe || "annual",
  );

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (goal?.periodLabel) {
      const match = goal.periodLabel.match(/\d{4}/);
      if (match) return Math.max(currentYear, Number(match[0]));
    }
    return currentYear;
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    if (goal?.periodLabel) return goal.periodLabel;
    return `${currentYear}`;
  });

  const [status, setStatus] = useState<GoalStatus>(
    goal?.status || "in_progress",
  );

  // Lista de marcos (milestones)
  const [milestones, setMilestones] = useState<
    (HabitMilestone & { shouldCreateTask?: boolean })[]
  >(() => {
    if (goal?.milestones && goal.milestones.length > 0) {
      return goal.milestones.map((m) => ({ ...m, shouldCreateTask: false }));
    }
    return [
      {
        title: "",
        completed: false,
        orderIndex: 0,
        shouldCreateTask: false,
      },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anos sugeridos dinâmicos iniciando no ano atual
  const dynamicYears = [
    currentYear,
    currentYear + 1,
    currentYear + 2,
    currentYear + 3,
  ];

  // Altera timeframe e recalcula período sugerido
  const handleTimeframeChange = (tf: GoalTimeframe) => {
    setTimeframe(tf);
    if (tf === "annual") {
      setSelectedPeriod(`${selectedYear}`);
    } else if (tf === "semiannual") {
      setSelectedPeriod(`S1 ${selectedYear}`);
    } else if (tf === "quarterly") {
      setSelectedPeriod(`Q1 ${selectedYear}`);
    }
  };

  const handleYearChange = (year: number) => {
    const validYear = Math.max(currentYear, year);
    setSelectedYear(validYear);
    if (timeframe === "annual") {
      setSelectedPeriod(`${validYear}`);
    } else if (timeframe === "semiannual") {
      const sem = selectedPeriod.startsWith("S2") ? "S2" : "S1";
      setSelectedPeriod(`${sem} ${validYear}`);
    } else if (timeframe === "quarterly") {
      const q = selectedPeriod.startsWith("Q")
        ? selectedPeriod.split(" ")[0]
        : "Q1";
      setSelectedPeriod(`${q} ${validYear}`);
    }
  };

  const addMilestoneField = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: "",
        completed: false,
        orderIndex: prev.length,
        shouldCreateTask: false,
      },
    ]);
  };

  const updateMilestone = (
    index: number,
    field: keyof HabitMilestone | "shouldCreateTask",
    value: unknown,
  ) => {
    setMilestones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) {
      toast.info("A meta deve ter pelo menos um marco.");
      return;
    }
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da meta.");
      return;
    }

    const validMilestones = milestones
      .filter((m) => m.title.trim().length > 0)
      .map((m, idx) => ({
        id: m.id,
        goalId: goal?.id,
        title: m.title.trim(),
        description: m.description?.trim() || undefined,
        completed: m.completed,
        completedAt: m.completedAt || null,
        dueDate: m.dueDate || null,
        orderIndex: idx,
        taskId: m.taskId || null,
        taskTitle: m.taskTitle || null,
        taskCompleted: m.taskCompleted || null,
        shouldCreateTask: m.shouldCreateTask,
      }));

    if (validMilestones.length === 0) {
      toast.error("Adicione ao menos um marco acionável.");
      return;
    }

    setIsSubmitting(true);
    try {
      const goalData: HabitGoal = {
        id: goal?.id,
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        timeframe,
        periodLabel: selectedPeriod.trim(),
        status,
        createdAt: goal?.createdAt || simulatedNow.toISOString(),
        milestones: validMilestones.map(({ shouldCreateTask: _, ...m }) => m),
      };

      const createTasksFlags = validMilestones.map((m) =>
        Boolean(m.shouldCreateTask && !m.taskId),
      );

      await onSave(goalData, createTasksFlags);
      onClose();
    } catch (err) {
      toast.error(`Erro ao salvar meta: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell isOpen onClose={onClose} size="lg">
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-lg border", theme.bg, theme.border)}
            >
              <Target className={cn("w-5 h-5", theme.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {goal
                  ? "Editar meta de longo prazo"
                  : "Nova meta de longo prazo"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Defina objetivos estratégicos com marcos acionáveis integrados
                às tarefas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          {/* Título & Descrição */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="goal-title-input"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Título da meta *
              </label>
              <Input
                id="goal-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aprender Rust e arquitetura de sistemas"
                required
                className="bg-background border-border text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="goal-desc-input"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Descrição e contexto (opcional)
              </label>
              <textarea
                id="goal-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qual o resultado esperado e motivação para esta meta?"
                rows={2}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Categoria & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-foreground mb-1.5">
                Área ou categoria
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border",
                      category === cat
                        ? cn(theme.bg, theme.text, theme.border, "font-bold")
                        : "bg-background text-muted-foreground border-border hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {goal && (
              <div>
                <span className="block text-xs font-semibold text-foreground mb-1.5">
                  Status da meta
                </span>
                <Tabs
                  value={status}
                  onValueChange={(val) => setStatus(val as GoalStatus)}
                  className="w-full"
                >
                  <TabsList className="h-9 w-full">
                    <TabsTrigger
                      value="in_progress"
                      className="text-xs flex-1 font-semibold cursor-pointer"
                    >
                      Em andamento
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="text-xs flex-1 font-semibold cursor-pointer"
                    >
                      Concluída
                    </TabsTrigger>
                    <TabsTrigger
                      value="paused"
                      className="text-xs flex-1 font-semibold cursor-pointer"
                    >
                      Pausada
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>

          {/* Horizonte Temporal */}
          <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3.5">
            <div>
              <span className="block text-xs font-semibold text-foreground mb-2">
                Horizonte temporal
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "annual", label: "Anual", desc: "12 meses" },
                    { id: "semiannual", label: "Semestral", desc: "6 meses" },
                    { id: "quarterly", label: "Trimestral", desc: "3 meses" },
                  ] as const
                ).map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => handleTimeframeChange(tf.id)}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex flex-col gap-0.5",
                      timeframe === tf.id
                        ? cn(theme.bg, theme.border, theme.text, "font-bold")
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="text-xs font-semibold">{tf.label}</span>
                    <span className="text-[10px] opacity-75">{tf.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção Dinâmica do Ano e Período */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ano:</span>
              </div>

              {/* Botões rápidos dinâmicos a partir do ano atual */}
              <div className="flex items-center gap-1">
                {dynamicYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleYearChange(yr)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors border",
                      selectedYear === yr
                        ? cn(theme.bg, theme.text, theme.border, "font-bold")
                        : "bg-background border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {yr}
                  </button>
                ))}

                {/* Input numérico para anos futuros personalizados */}
                <Input
                  type="number"
                  min={currentYear}
                  value={selectedYear}
                  onChange={(e) =>
                    handleYearChange(Number(e.target.value) || currentYear)
                  }
                  className="w-20 h-7 text-xs bg-background border-border ml-1"
                  title="Digite qualquer ano futuro"
                />
              </div>

              {timeframe === "semiannual" && (
                <div className="flex gap-1 ml-auto">
                  {["S1", "S2"].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() =>
                        setSelectedPeriod(`${sem} ${selectedYear}`)
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors border",
                        selectedPeriod.startsWith(sem)
                          ? cn(theme.solid, "text-white")
                          : "bg-background border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {sem} ({sem === "S1" ? "Jan-Jun" : "Jul-Dez"})
                    </button>
                  ))}
                </div>
              )}

              {timeframe === "quarterly" && (
                <div className="flex gap-1 ml-auto">
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSelectedPeriod(`${q} ${selectedYear}`)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors border",
                        selectedPeriod.startsWith(q)
                          ? cn(theme.solid, "text-white")
                          : "bg-background border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span>Período identificado:</span>
              <span
                className={cn(
                  "font-bold px-2 py-0.5 rounded border bg-background",
                  theme.border,
                  theme.text,
                )}
              >
                {selectedPeriod}
              </span>
            </div>
          </div>

          {/* Marcos Acionáveis (Milestones) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-primary" />
                  Marcos acionáveis (milestones) *
                </span>
                <p className="text-xs text-muted-foreground">
                  Divida a meta em etapas concretas para acompanhar o percentual
                  de progresso
                </p>
              </div>
              <button
                type="button"
                onClick={addMilestoneField}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border",
                  theme.bg,
                  theme.text,
                  theme.border,
                )}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar marco
              </button>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => (
                <div
                  key={m.id || `new-${idx}`}
                  className="p-3 rounded-lg border border-border bg-background flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <Input
                      value={m.title}
                      onChange={(e) =>
                        updateMilestone(idx, "title", e.target.value)
                      }
                      placeholder={`Marco #${idx + 1}: Ex: Concluir módulo 1 e exercícios`}
                      className="flex-1 bg-card border-border text-xs h-8"
                    />

                    <Input
                      type="date"
                      value={m.dueDate || ""}
                      onChange={(e) =>
                        updateMilestone(idx, "dueDate", e.target.value)
                      }
                      className="w-36 bg-card border-border text-xs h-8 text-muted-foreground"
                      title="Prazo limite para conclusão deste marco"
                    />

                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remover este marco"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!m.taskId && (
                    <div className="flex items-center gap-2 pl-7 pt-0.5">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(m.shouldCreateTask)}
                          onChange={(e) =>
                            updateMilestone(
                              idx,
                              "shouldCreateTask",
                              e.target.checked,
                            )
                          }
                          className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Criar e conectar automaticamente como tarefa prática
                          no módulo de tarefas
                        </span>
                      </label>
                    </div>
                  )}

                  {m.taskId && (
                    <div className="pl-7 pt-0.5 text-xs text-emerald-500 font-medium flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      <span>
                        Conectado à tarefa #{m.taskId}
                        {m.taskTitle ? `: "${m.taskTitle}"` : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5",
              theme.solid,
              isSubmitting && "opacity-50 cursor-not-allowed",
            )}
          >
            {isSubmitting ? (
              "Salvando..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                {goal ? "Salvar alterações" : "Criar meta"}
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
