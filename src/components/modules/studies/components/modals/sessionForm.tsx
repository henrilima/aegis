"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudySession } from "@/components/modules/studies/types";
import { isoDate } from "@/components/modules/studies/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { SubjectInput } from "./subjectInput";

interface SessionFormProps {
  userId: string;
  initial?: StudySession;
  existingSubjects?: string[];
  onSave: (s: StudySession) => void;
  onCancel: () => void;
}

export function SessionForm({
  userId,
  initial,
  existingSubjects = [],
  onSave,
}: SessionFormProps) {
  const { now: simulatedNow } = useTime();
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const [form, setForm] = useState<
    Omit<StudySession, "id" | "userId" | "createdAt">
  >({
    date: initial?.date ?? isoDate(simulatedNow),
    subject: initial?.subject ?? "",
    hours: initial?.hours ?? 0,
    questionsNew: initial?.questionsNew ?? 0,
    questionsReview: initial?.questionsReview ?? 0,
    correctNew: initial?.correctNew ?? 0,
    correctReview: initial?.correctReview ?? 0,
    note: initial?.note ?? "",
    pagesRead: initial?.pagesRead ?? 0,
    custom_metric_label: initial?.custom_metric_label ?? "",
    custom_metric_value: initial?.custom_metric_value ?? 0,
    focusScore: initial?.focusScore ?? 0,
    topic: initial?.topic ?? "",
    tags: initial?.tags ?? "",
  });

  const [activeModes, setActiveModes] = useState<
    ("questions" | "pages" | "custom")[]
  >(() => {
    const modes: ("questions" | "pages" | "custom")[] = [];
    if (initial?.questionsNew || initial?.questionsReview)
      modes.push("questions");
    if (initial?.pagesRead) modes.push("pages");
    if (initial?.custom_metric_label) modes.push("custom");
    return modes.length ? modes : [];
  });

  const [durH, setDurH] = useState(Math.floor(initial?.hours || 0));
  const [durM, setDurM] = useState(
    Math.round(((initial?.hours || 0) - Math.floor(initial?.hours || 0)) * 60),
  );

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const handleToggleTag = (tag: string) => {
    const currentTags = form.tags
      ? form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    let nextTags: string[];
    if (currentTags.includes(tag)) {
      nextTags = currentTags.filter((t) => t !== tag);
    } else {
      nextTags = [...currentTags, tag];
    }
    setField("tags", nextTags.join(", "));
  };

  const isTagActive = (tag: string) => {
    const currentTags = form.tags
      ? form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    return currentTags.includes(tag);
  };

  function toggleMode(mode: "questions" | "pages" | "custom") {
    setActiveModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error("Identifique a matéria de estudo.");
      return;
    }

    if (durH === 0 && durM === 0) {
      toast.error("A duração do estudo deve ser maior que zero.");
      return;
    }

    const totalHours = durH + durM / 60;

    onSave({
      ...form,
      userId: userId,
      id: initial?.id,
      hours: totalHours,
      questionsNew: activeModes.includes("questions") ? form.questionsNew : 0,
      questionsReview: activeModes.includes("questions")
        ? form.questionsReview
        : 0,
      correctNew: activeModes.includes("questions") ? form.correctNew : 0,
      correctReview: activeModes.includes("questions") ? form.correctReview : 0,
      pagesRead: activeModes.includes("pages") ? form.pagesRead : 0,
      custom_metric_label: activeModes.includes("custom")
        ? form.custom_metric_label || ""
        : "",
      custom_metric_value: activeModes.includes("custom")
        ? form.custom_metric_value
        : 0,
      focusScore: form.focusScore || 0,
    });
  }

  const inputStyle = `w-full bg-card p-4 border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700 ${theme.borderHover.replace("hover:", "focus:")}`;
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const asterisk = <span className={cn("ml-1", theme.text)}>*</span>;

  return (
    <form
      id="studies-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo: Identificação e Tempo */}
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-subject" className={lc}>
                Matéria {asterisk}
              </Label>
              <SubjectInput
                value={form.subject}
                onChange={(v) => setField("subject", v)}
                existingSubjects={existingSubjects}
                inputClass={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sf-topic" className={lc}>
                Conteúdo Estudado
              </Label>
              <Input
                id="sf-topic"
                type="text"
                className={inputStyle}
                placeholder="Ex: Teoria dos Atos Administrativos, Geometria Espacial..."
                value={form.topic || ""}
                onChange={(e) => setField("topic", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sf-date" className={lc}>
                  Data {asterisk}
                </Label>
                <Input
                  id="sf-date"
                  type="date"
                  className={inputStyle}
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sf-dur" className={lc}>
                  Duração {asterisk}
                </Label>
                <div className="flex gap-2">
                  <div
                    className={cn(
                      `flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11 transition-all`,
                      theme.borderHover.replace("hover:", "focus-within:"),
                    )}
                  >
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none font-bold placeholder:text-neutral-700 border-none p-0 h-full text-center"
                      placeholder="0"
                      value={durH || ""}
                      onChange={(e) => {
                        const val = Math.min(
                          24,
                          Number.parseInt(e.target.value, 10) || 0,
                        );
                        setDurH(val);
                        if (val === 24) setDurM(0);
                      }}
                    />
                    <span className="text-[10px] font-bold text-neutral-600">
                      h
                    </span>
                  </div>
                  <div
                    className={cn(
                      `flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11 transition-all`,
                      theme.borderHover.replace("hover:", "focus-within:"),
                    )}
                  >
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none font-bold placeholder:text-neutral-700 border-none p-0 h-full text-center"
                      placeholder="0"
                      value={durM || ""}
                      onChange={(e) =>
                        setDurM(
                          durH === 24
                            ? 0
                            : Math.min(
                                59,
                                Number.parseInt(e.target.value, 10) || 0,
                              ),
                        )
                      }
                    />
                    <span className="text-[10px] font-bold text-neutral-600">
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-note" className={lc}>
              Observações
            </Label>
            <Textarea
              id="sf-note"
              className={cn(
                "bg-card border-border rounded-xl min-h-[100px] resize-none pt-4 text-sm font-medium text-muted-foreground placeholder:text-neutral-700 transition-all",
                theme.borderHover.replace("hover:", "focus:"),
              )}
              placeholder="Notas sobre o aprendizado, dificuldades ou revisões futuras..."
              value={form.note || ""}
              onChange={(e) => setField("note", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-tags" className={lc}>
              Tags / Marcadores
            </Label>
            <Input
              id="sf-tags"
              type="text"
              className={inputStyle}
              placeholder="Ex: revisão, teoria, exercícios"
              value={form.tags || ""}
              onChange={(e) => setField("tags", e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {[
                "revisão",
                "teoria",
                "exercícios",
                "simulado",
                "lei seca",
                "resumo",
              ].map((tag) => {
                const active = isTagActive(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer",
                      active
                        ? cn(theme.bg, theme.border, theme.text)
                        : "bg-card border-border text-neutral-600 hover:border-neutral-500",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lado Direito: Métricas */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className={lc}>Métricas de desempenho</Label>
            <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
              {[
                { id: "questions" as const, label: "Questões" },
                { id: "pages" as const, label: "Páginas" },
                { id: "custom" as const, label: "Extra" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMode(opt.id)}
                  className={cn(
                    `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border`,
                    activeModes.includes(opt.id)
                      ? cn(theme.bg, theme.border, theme.text)
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card/40 border border-border/60 rounded-xl p-5 flex flex-col gap-6 min-h-[295px]">
            {activeModes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-neutral-600 font-medium">
                  Nenhuma métrica ativa
                </p>
                <p className="text-[10px] text-neutral-700 mt-1">
                  Selecione acima para monitorar
                </p>
              </div>
            ) : (
              <>
                {activeModes.includes("questions") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3 font-bold">
                      <Label
                        className={cn(
                          "text-[10px] font-bold ml-0.5 uppercase opacity-80",
                          theme.text,
                        )}
                      >
                        Questões inéditas
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          className={inputStyle}
                          placeholder="Total"
                          value={form.questionsNew || ""}
                          onChange={(e) =>
                            setField(
                              "questionsNew",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={cn(
                            inputStyle,
                            "text-green-400/90 focus:border-green-500/40",
                          )}
                          placeholder="Acertos"
                          value={form.correctNew || ""}
                          onChange={(e) =>
                            setField(
                              "correctNew",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-3 font-bold">
                      <Label
                        className={cn(
                          "text-[10px] font-bold ml-0.5 uppercase opacity-80",
                          theme.text,
                        )}
                      >
                        Questões de revisão
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          className={inputStyle}
                          placeholder="Total"
                          value={form.questionsReview || ""}
                          onChange={(e) =>
                            setField(
                              "questionsReview",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={cn(
                            inputStyle,
                            "text-green-400/90 focus:border-green-500/40",
                          )}
                          placeholder="Acertos"
                          value={form.correctReview || ""}
                          onChange={(e) =>
                            setField(
                              "correctReview",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {activeModes.includes("pages") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5 uppercase">
                        Páginas lidas
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        className={inputStyle}
                        placeholder="Qtd. de páginas"
                        value={form.pagesRead || ""}
                        onChange={(e) =>
                          setField(
                            "pagesRead",
                            Number.parseInt(e.target.value, 10) || 0,
                          )
                        }
                      />
                    </div>
                  )}
                  {activeModes.includes("custom") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <Label className="text-[10px] font-bold text-muted-foreground ml-0.5 uppercase">
                        Métrica personalizada
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-label"
                          className={cn(inputStyle, "flex-1")}
                          placeholder="Ex: Flashcards"
                          value={form.custom_metric_label || ""}
                          onChange={(e) =>
                            setField("custom_metric_label", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={cn(inputStyle, "w-28 px-3 text-center")}
                          placeholder="Qtd"
                          value={form.custom_metric_value || ""}
                          onChange={(e) =>
                            setField(
                              "custom_metric_value",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Seletor de Foco e Energia */}
          <div className="flex flex-col gap-3">
            <Label className={lc}>Foco e Energia</Label>
            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField("focusScore", s)}
                  className={cn(
                    `flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border`,
                    form.focusScore === s
                      ? cn(theme.bg, theme.border, theme.text)
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold text-neutral-600 uppercase">
              {form.focusScore !== undefined
                ? [
                    "Totalmente Improdutivo",
                    "Exausto / Sem Foco",
                    "Cansado / Distraído",
                    "Razoável",
                    "Bom Foco",
                    "Concentração Total",
                  ][form.focusScore]
                : "Não avaliado"}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
