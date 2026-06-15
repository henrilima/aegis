"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { isoDate } from "@/components/modules/studies/utils";
import type { StudyGrade } from "../types";
import { GRADE_TYPE_LABELS } from "../types";
import { Switch } from "@/components/ui/switch";

interface GradeFormProps {
  userId: string;
  initial?: StudyGrade;
  existingSubjects?: string[];
  onSave: (g: StudyGrade) => void;
  onCancel: () => void;
}

const GRADE_TYPES: StudyGrade["gradeType"][] = [
  "prova",
  "simulado",
  "atividade",
  "trabalho",
  "quiz",
];

export function GradeForm({
  userId,
  initial,
  existingSubjects = [],
  onSave,
}: GradeFormProps) {
  const color = getModuleColor("grades");
  const theme = getColorTheme(color);
  const { now: simulatedNow } = useTime();

  const [form, setForm] = useState<Omit<StudyGrade, "id" | "userId" | "createdAt">>({
    subject: initial?.subject ?? "",
    gradeType: initial?.gradeType ?? "prova",
    title: initial?.title ?? "",
    grade: initial?.grade ?? 0,
    maxGrade: initial?.maxGrade ?? 10,
    weight: initial?.weight ?? 1,
    questionsTotal: initial?.questionsTotal ?? 0,
    questionsCorrect: initial?.questionsCorrect ?? 0,
    date: initial?.date ?? isoDate(simulatedNow),
    note: initial?.note ?? "",
    halfGrade: initial?.halfGrade ?? false,
  });

  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState(initial?.subject ?? "");

  const inputStyle = `w-full bg-card p-4 border border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700 focus:outline-none ${theme.borderHover.replace("hover:", "focus:")}`;
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const asterisk = <span className={cn("ml-1", theme.text)}>*</span>;

  const filteredSubjects = existingSubjects
    .filter((s) => s.toLowerCase().includes(subjectQuery.toLowerCase()))
    .slice(0, 8);

  const isNewSubject =
    subjectQuery.trim() !== "" &&
    !existingSubjects.some((s) => s.toLowerCase() === subjectQuery.toLowerCase());

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error("Identifique a matéria.");
      return;
    }
    if (form.grade < 0) {
      toast.error("A nota não pode ser negativa.");
      return;
    }
    if (form.grade > form.maxGrade) {
      toast.error("A nota não pode ser maior que a nota máxima.");
      return;
    }
    onSave({
      ...form,
      id: initial?.id,
      userId,
      title: form.title?.trim() || undefined,
      note: form.note?.trim() || undefined,
    });
  }

  const percentual =
    form.maxGrade > 0
      ? Math.round((form.grade / form.maxGrade) * 100)
      : 0;

  const percentualColor =
    percentual >= 70
      ? "text-emerald-400"
      : percentual >= 50
        ? "text-amber-400"
        : "text-red-400";

  return (
    <form
      id="grades-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo */}
        <div className="flex flex-col gap-5">
          {/* Matéria */}
          <div className="flex flex-col gap-1.5 relative">
            <Label className={lc}>Matéria {asterisk}</Label>
            <input
              className={inputStyle}
              placeholder="Ex: Matemática, Direito Administrativo..."
              value={subjectQuery}
              autoComplete="off"
              onChange={(e) => {
                setSubjectQuery(e.target.value);
                setField("subject", e.target.value);
                setShowSubjectDropdown(true);
              }}
              onFocus={() => setShowSubjectDropdown(true)}
              onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 150)}
              required
            />
            {showSubjectDropdown && (filteredSubjects.length > 0 || isNewSubject) && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-1 flex flex-col gap-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {filteredSubjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => {
                        setSubjectQuery(s);
                        setField("subject", s);
                        setShowSubjectDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-lg transition-all cursor-pointer font-bold"
                    >
                      {s}
                    </button>
                  ))}
                  {isNewSubject && (
                    <button
                      type="button"
                      onMouseDown={() => {
                        setField("subject", subjectQuery.trim());
                        setShowSubjectDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[11px] font-bold rounded-lg transition-all border-t border-border/20 mt-1 cursor-pointer",
                        theme.text,
                        theme.bgHover,
                      )}
                    >
                      + Criar &quot;{subjectQuery.trim()}&quot;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Título e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={lc}>Título</Label>
              <Input
                className={inputStyle}
                placeholder="Ex: P1, Simulado ENEM..."
                value={form.title ?? ""}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={lc}>Data {asterisk}</Label>
              <Input
                type="date"
                className={inputStyle}
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tipo de avaliação */}
          <div className="flex flex-col gap-2">
            <Label className={lc}>Tipo de avaliação</Label>
            <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
              {GRADE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField("gradeType", t)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                    form.gradeType === t
                      ? cn(theme.bg, theme.border, theme.text)
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                  )}
                >
                  {GRADE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <Label className={lc}>Observações</Label>
            <Textarea
              className={cn(
                "bg-card border-border rounded-xl min-h-[100px] resize-none pt-4 text-sm font-medium text-muted-foreground placeholder:text-neutral-700 transition-all",
                theme.borderHover.replace("hover:", "focus:"),
              )}
              placeholder="Considerações sobre o desempenho..."
              value={form.note ?? ""}
              onChange={(e) => setField("note", e.target.value)}
            />
          </div>
        </div>

        {/* Lado Direito */}
        <div className="flex flex-col gap-5">
          {/* Nota e Nota Máxima */}
          <div className="flex flex-col gap-3">
            <Label className={lc}>Nota obtida {asterisk}</Label>
            <div className="flex gap-3 items-center">
              <div
                className={cn(
                  "flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-14 transition-all",
                  theme.borderHover.replace("hover:", "focus-within:"),
                )}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full bg-transparent text-2xl font-black text-foreground focus:outline-none border-none p-0 h-full text-center"
                  placeholder="0"
                  value={form.grade || ""}
                  onChange={(e) =>
                    setField("grade", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <span className="text-neutral-600 font-bold text-lg">/</span>
              <div
                className={cn(
                  "w-24 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-14 transition-all",
                  theme.borderHover.replace("hover:", "focus-within:"),
                )}
              >
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  className="w-full bg-transparent text-lg font-bold text-muted-foreground focus:outline-none border-none p-0 h-full text-center"
                  placeholder="10"
                  value={form.maxGrade || ""}
                  onChange={(e) =>
                    setField("maxGrade", parseFloat(e.target.value) || 10)
                  }
                />
              </div>
            </div>
            {/* Percentual visual */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    percentual >= 70
                      ? "bg-emerald-500"
                      : percentual >= 50
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${Math.min(100, percentual)}%` }}
                />
              </div>
              <span className={cn("text-sm font-black tabular-nums", percentualColor)}>
                {percentual}%
              </span>
            </div>
          </div>

          {/* Peso */}
          <div className="flex flex-col gap-1.5">
            <Label className={lc}>Peso (média ponderada)</Label>
            <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
              {[0.5, 1, 1.5, 2, 2.5, 3].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setField("weight", w)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                    form.weight === w
                      ? cn(theme.bg, theme.border, theme.text)
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Dividir pela metade */}
          <div className="flex items-center justify-between p-3.5 bg-card/65 border border-border rounded-xl gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground">Dividir nota pela metade?</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                Se ativado, esta nota será dividida por 2 no cálculo das médias (ex: 8.0 vira 4.0).
              </span>
            </div>
            <Switch
              checked={!!form.halfGrade}
              onCheckedChange={(checked) => setField("halfGrade", checked)}
            />
          </div>

          {/* Questões */}
          <div className="flex flex-col gap-3">
            <Label className={lc}>Questões (opcional)</Label>
            <div className="bg-card/40 border border-border/60 rounded-xl p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-600">Total</span>
                  <Input
                    type="number"
                    min="0"
                    className={inputStyle}
                    placeholder="0"
                    value={form.questionsTotal || ""}
                    onChange={(e) =>
                      setField(
                        "questionsTotal",
                        Number.parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-green-500/80">Acertos</span>
                  <Input
                    type="number"
                    min="0"
                    className={cn(
                      inputStyle,
                      "text-green-400/90 focus:border-green-500/40",
                    )}
                    placeholder="0"
                    value={form.questionsCorrect || ""}
                    onChange={(e) =>
                      setField(
                        "questionsCorrect",
                        Number.parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
              </div>
              {form.questionsTotal > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((form.questionsCorrect / form.questionsTotal) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-black text-emerald-400 tabular-nums">
                    {Math.round(
                      (form.questionsCorrect / form.questionsTotal) * 100,
                    )}
                    %
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
