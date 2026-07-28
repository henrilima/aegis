// src/components/modules/settings/automationsTab.tsx
"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, Cpu, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "@/components/global/ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

type TriggerType =
  | "study_hours"
  | "sleep_hours"
  | "pomodoros_completed"
  | "tasks_completed"
  | "reading_pages"
  | "current_time";
type TriggerOperator = ">" | ">=" | "<" | "<=" | "=";
type ActionType =
  | "mark_habit"
  | "create_task"
  | "send_notification"
  | "change_theme";

interface AutomationRule {
  id?: number;
  userId: string;
  name: string;
  triggerType: TriggerType;
  triggerOperator: TriggerOperator;
  triggerValue: number;
  actionType: ActionType;
  actionTargetId: string;
  actionTargetName?: string;
  active: boolean;
  createdAt?: string;
}

interface Habit {
  id: number;
  name: string;
  habitType: string;
}

const triggerTypeLabels: Record<TriggerType, string> = {
  study_hours: "Horas de estudo diárias",
  sleep_hours: "Horas de sono registradas",
  pomodoros_completed: "Pomodoros concluídos hoje",
  tasks_completed: "Tarefas concluídas hoje",
  reading_pages: "Páginas lidas hoje",
  current_time: "Horário do dia (24h)",
};

const operatorLabels: Record<TriggerOperator, string> = {
  ">": "Maior que (>)",
  ">=": "Maior ou igual (>=)",
  "<": "Menor que (<)",
  "<=": "Menor ou igual (<=)",
  "=": "Igual a (=)",
};

export function AutomationsTab() {
  const { user } = useAuth();
  const { themeStyles: theme } = useTheme();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do formulário de criação
  const [showForm, setShowForm] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("study_hours");
  const [triggerOperator, setTriggerOperator] = useState<TriggerOperator>(">=");
  const [triggerValue, setTriggerValue] = useState<number>(2);
  const [timeString, setTimeString] = useState<string>("20:00");
  const [actionType, setActionType] = useState<ActionType>("mark_habit");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("midnight");
  const [selectedAccent, setSelectedAccent] = useState<string>("blue");
  const [actionTargetValue, setActionTargetValue] = useState<string>("");

  const uid = user?.id ? String(user.id) : "";

  // Carrega regras e hábitos
  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      setIsLoading(true);
      const [rulesList, habitsList] = await Promise.all([
        invoke<AutomationRule[]>("automation_list_rules", { userId: uid }),
        invoke<Habit[]>("habit_list_habits", { userId: uid }).catch(() => []),
      ]);

      setRules(rulesList);
      setHabits(habitsList);

      // Define hábito padrão selecionado se houver
      if (habitsList.length > 0) {
        setSelectedHabitId(String(habitsList[0].id));
      }
    } catch {
      toast.error("Erro ao carregar regras e hábitos");
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Alterna o estado de ativação de uma regra
  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await invoke("automation_toggle_rule", { id, active: !currentActive });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, active: !currentActive } : r)),
      );
      toast.success(
        !currentActive ? "Regra ativada com sucesso!" : "Regra desativada!",
      );
    } catch {
      toast.error("Erro ao atualizar regra");
    }
  };

  // Exclui uma regra
  const handleDeleteRule = async (id: number) => {
    try {
      await invoke("automation_delete_rule", { id });
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success("Regra removida!");
    } catch {
      toast.error("Erro ao remover regra");
    }
  };

  // Salva uma nova regra
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    if (!ruleName.trim()) {
      toast.error("Por favor, digite um nome descritivo para a regra");
      return;
    }

    let actionTargetId = "";
    let actionTargetName = "";

    if (actionType === "mark_habit") {
      if (!selectedHabitId) {
        toast.error(
          "Você precisa selecionar um hábito. Crie um se não houver.",
        );
        return;
      }
      const foundHabit = habits.find((h) => String(h.id) === selectedHabitId);
      actionTargetId = selectedHabitId;
      actionTargetName = foundHabit ? foundHabit.name : "Hábito";
    } else if (actionType === "create_task") {
      if (!actionTargetValue.trim()) {
        toast.error("Por favor, informe o título da tarefa a ser criada");
        return;
      }
      actionTargetId = actionTargetValue.trim();
      actionTargetName = actionTargetValue.trim();
    } else if (actionType === "send_notification") {
      if (!actionTargetValue.trim()) {
        toast.error("Por favor, escreva a mensagem da notificação");
        return;
      }
      actionTargetId = actionTargetValue.trim();
      actionTargetName = actionTargetValue.trim();
    } else if (actionType === "change_theme") {
      if (!selectedThemeId) {
        toast.error("Por favor, selecione um tema");
        return;
      }
      const foundTheme = CHROMATIC_THEMES.find((t) => t.id === selectedThemeId);
      const themeLabel = foundTheme ? foundTheme.label : selectedThemeId;

      const isDynamic = ["default", "midnight", "light"].includes(
        selectedThemeId,
      );
      if (isDynamic) {
        actionTargetId = `${selectedThemeId}:${selectedAccent}`;
        actionTargetName = `${themeLabel} (${selectedAccent})`;
      } else {
        actionTargetId = selectedThemeId;
        actionTargetName = themeLabel;
      }
    }

    const newRule: AutomationRule = {
      userId: uid,
      name: ruleName.trim(),
      triggerType,
      triggerOperator,
      triggerValue: Number(triggerValue),
      actionType,
      actionTargetId,
      actionTargetName,
      active: true,
    };

    try {
      await invoke("automation_add_rule", { rule: newRule });
      toast.success("Regra de automação criada com sucesso!");
      setRuleName("");
      setActionTargetValue("");
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(`Falha ao salvar regra: ${err}`);
    }
  };

  // Ao alterar o tipo de ação, limpa/reseta valores
  const handleActionTypeChange = (val: ActionType) => {
    setActionType(val);
    setActionTargetValue("");
  };

  // Atualiza valores padrão ao trocar o gatilho
  const handleTriggerTypeChange = (val: TriggerType) => {
    setTriggerType(val);
    if (val === "study_hours") {
      setTriggerValue(2);
    } else if (val === "sleep_hours") {
      setTriggerValue(6);
    } else if (val === "pomodoros_completed") {
      setTriggerValue(4);
    } else if (val === "tasks_completed") {
      setTriggerValue(5);
    } else if (val === "current_time") {
      setTriggerValue(20.0); // 20:00 padrão
      setTimeString("20:00");
    }
  };

  const handleTimeChange = (timeVal: string) => {
    setTimeString(timeVal);
    if (timeVal) {
      const [h, m] = timeVal.split(":").map(Number);
      setTriggerValue(h + m / 60.0);
    }
  };

  const getTriggerDesc = (rule: AutomationRule) => {
    const label = triggerTypeLabels[rule.triggerType] || rule.triggerType;
    const op = rule.triggerOperator || ">=";
    const val = rule.triggerValue;

    if (rule.triggerType === "current_time") {
      const hrs = Math.floor(val);
      const mins = Math.round((val - hrs) * 60);
      const timeFormatted = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
      return `Se horário for ${op} ${timeFormatted}`;
    }

    let unit = "";
    if (
      rule.triggerType === "study_hours" ||
      rule.triggerType === "sleep_hours"
    ) {
      unit = "h";
    } else if (rule.triggerType === "pomodoros_completed") {
      unit = " pomodoros";
    } else if (rule.triggerType === "tasks_completed") {
      unit = " tarefas";
    }

    return `Se ${label.toLowerCase()} for ${op} ${val}${unit}`;
  };

  return (
    <div className="space-y-6">
      {showForm && (
        <form
          onSubmit={handleSaveRule}
          className="p-5 border border-border/60 rounded-xl bg-card/30 space-y-5 animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Configurar gatilho sem código
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold h-8 px-3 rounded-xl"
            >
              Cancelar
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-name" className="text-xs font-bold">
              Nome da regra
            </Label>
            <Input
              id="rule-name"
              placeholder="Ex: Hábito de estudos automatizado"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="h-10 text-xs font-medium focus-visible:ring-primary rounded-xl"
            />
          </div>

          {/* Builder Visual de Sentenças */}
          <div className="p-4 rounded-xl bg-background border border-border/50 space-y-4">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Sentença da automação
            </span>

            <div className="flex flex-col gap-4">
              {/* Gatilho (Estudos, Sono, Pomodoros, Tarefas, Horário) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-xs font-bold text-primary shrink-0 sm:w-12 sm:text-right">
                  Se
                </span>
                <div className="flex-1 min-w-0">
                  <Select
                    value={triggerType}
                    onValueChange={(val) =>
                      handleTriggerTypeChange(val as TriggerType)
                    }
                  >
                    <SelectTrigger className="w-full h-10 text-xs bg-card border-border font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(triggerTypeLabels).map(([key, value]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-xs cursor-pointer rounded-lg"
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Operador (>, >=, <, <=, =) e Valor */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground shrink-0 sm:w-12 sm:text-right">
                  For
                </span>
                <div className="w-full sm:w-56">
                  <Select
                    value={triggerOperator}
                    onValueChange={(val) =>
                      setTriggerOperator(val as TriggerOperator)
                    }
                  >
                    <SelectTrigger className="w-full h-10 text-xs bg-card border-border font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(operatorLabels).map(([key, value]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-xs cursor-pointer rounded-lg"
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  {triggerType === "current_time" ? (
                    <Input
                      type="time"
                      value={timeString}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-32 h-10 text-xs font-bold bg-card border-border text-center focus-visible:ring-primary rounded-xl"
                    />
                  ) : (
                    <>
                      <Input
                        type="number"
                        step={
                          triggerType === "study_hours" ||
                          triggerType === "sleep_hours"
                            ? "0.5"
                            : "1"
                        }
                        min="0"
                        max={
                          triggerType === "study_hours" ||
                          triggerType === "sleep_hours"
                            ? "24"
                            : "1000"
                        }
                        value={triggerValue}
                        onChange={(e) =>
                          setTriggerValue(Number(e.target.value))
                        }
                        className="w-24 h-10 text-xs font-bold bg-card border-border text-center focus-visible:ring-primary rounded-xl"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {triggerType === "study_hours" ||
                        triggerType === "sleep_hours"
                          ? "horas"
                          : triggerType === "pomodoros_completed"
                            ? "pomodoros"
                            : "tarefas"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Ação e Alvo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t border-border/10 pt-3">
                <span className="text-xs font-bold text-primary shrink-0 sm:w-12 sm:text-right">
                  Então
                </span>
                <div className="w-full sm:w-64">
                  <Select
                    value={actionType}
                    onValueChange={(val) =>
                      handleActionTypeChange(val as ActionType)
                    }
                  >
                    <SelectTrigger className="w-full h-10 text-xs bg-card border-border font-bold rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem
                        value="mark_habit"
                        className="text-xs cursor-pointer rounded-lg"
                      >
                        Marcar hábito como feito
                      </SelectItem>
                      <SelectItem
                        value="create_task"
                        className="text-xs cursor-pointer rounded-lg"
                      >
                        Criar uma tarefa de apoio
                      </SelectItem>
                      <SelectItem
                        value="send_notification"
                        className="text-xs cursor-pointer rounded-lg"
                      >
                        Enviar notificação personalizada
                      </SelectItem>
                      <SelectItem
                        value="change_theme"
                        className="text-xs cursor-pointer rounded-lg"
                      >
                        Ativar tema visual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-0">
                  {actionType === "mark_habit" ? (
                    habits.length > 0 ? (
                      <Select
                        value={selectedHabitId}
                        onValueChange={setSelectedHabitId}
                      >
                        <SelectTrigger className="w-full h-10 text-xs bg-card border-border font-bold rounded-xl">
                          <SelectValue placeholder="Selecione o hábito..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {habits.map((h) => (
                            <SelectItem
                              key={h.id}
                              value={String(h.id)}
                              className="text-xs cursor-pointer rounded-lg"
                            >
                              {h.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Crie hábitos primeiro!</span>
                      </div>
                    )
                  ) : actionType === "create_task" ? (
                    <Input
                      type="text"
                      placeholder="Título da tarefa..."
                      value={actionTargetValue}
                      onChange={(e) => setActionTargetValue(e.target.value)}
                      className="h-10 text-xs font-bold bg-card border-border focus-visible:ring-primary rounded-xl"
                    />
                  ) : actionType === "change_theme" ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-full sm:w-64">
                        <Select
                          value={selectedThemeId}
                          onValueChange={setSelectedThemeId}
                        >
                          <SelectTrigger className="w-full h-10 text-xs bg-card border-border font-bold rounded-xl">
                            <SelectValue placeholder="Selecione o tema..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {CHROMATIC_THEMES.map((t) => (
                              <SelectItem
                                key={t.id}
                                value={t.id}
                                className="text-xs cursor-pointer rounded-lg"
                              >
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {["default", "midnight", "light"].includes(
                        selectedThemeId,
                      ) && (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                            DESTAQUE:
                          </span>
                          <ColorPicker
                            value={selectedAccent}
                            onChange={(c) => setSelectedAccent(c || "blue")}
                            placeholder="Padrão"
                            defaultColor="blue"
                            className="h-10 text-xs font-bold rounded-xl border border-border"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      placeholder="Mensagem da notificação..."
                      value={actionTargetValue}
                      onChange={(e) => setActionTargetValue(e.target.value)}
                      className="h-10 text-xs font-bold bg-card border-border focus-visible:ring-primary rounded-xl"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full font-bold text-xs text-white rounded-xl cursor-pointer transition-all",
              theme.solid,
              theme.solidHover,
            )}
            disabled={actionType === "mark_habit" && habits.length === 0}
          >
            Salvar regra
          </Button>
        </form>
      )}

      {/* Lista de Regras existentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground block">
            Regras ativas ({rules.length})
          </span>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className={cn(
                "gap-2 font-bold cursor-pointer transition-all text-white text-xs rounded-xl",
                theme.solid,
                theme.solidHover,
              )}
              size="sm"
            >
              <Plus className="w-4 h-4" /> Nova regra
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center text-xs text-muted-foreground font-bold">
            Carregando regras...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-accent/10">
            <Cpu className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground font-bold">
              Nenhuma automação configurada
            </p>
            <p className="text-[11px] text-muted-foreground/60 max-w-sm">
              Crie gatilhos no-code no botão acima para acionar tarefas e
              hábitos automaticamente a partir do seu progresso diário.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rules.map((rule) => {
              const triggerDesc = getTriggerDesc(rule);

              let actionDesc = "";
              if (rule.actionType === "mark_habit") {
                actionDesc = `Marcar hábito: "${rule.actionTargetName || rule.actionTargetId}"`;
              } else if (rule.actionType === "create_task") {
                actionDesc = `Criar tarefa: "${rule.actionTargetName || rule.actionTargetId}"`;
              } else if (rule.actionType === "send_notification") {
                actionDesc = `Enviar notificação: "${rule.actionTargetId}"`;
              } else if (rule.actionType === "change_theme") {
                actionDesc = `Ativar tema: "${rule.actionTargetName || rule.actionTargetId}"`;
              }

              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/25 hover:bg-card/50 transition-all gap-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {rule.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold">
                        {triggerDesc}
                      </span>
                      <span>➔</span>
                      <span className="bg-accent/60 text-accent-foreground px-1.5 py-0.5 rounded-md font-semibold">
                        {actionDesc}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={() =>
                        rule.id && handleToggleActive(rule.id, rule.active)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => rule.id && handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent"
                      title="Excluir regra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
