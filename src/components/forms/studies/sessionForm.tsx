"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudySession } from "@/components/pages/studies/types";
import { isoDate } from "@/components/pages/studies/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTime } from "@/context/TimeContext";
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
  const [form, setForm] = useState<
    Omit<StudySession, "id" | "user_id" | "created_at">
  >({
    date: initial?.date ?? isoDate(simulatedNow),
    subject: initial?.subject ?? "",
    hours: initial?.hours ?? 0,
    questions_new: initial?.questions_new ?? 0,
    questions_review: initial?.questions_review ?? 0,
    correct_new: initial?.correct_new ?? 0,
    correct_review: initial?.correct_review ?? 0,
    note: initial?.note ?? "",
    pages_read: initial?.pages_read ?? 0,
    custom_metric_label: initial?.custom_metric_label ?? "",
    custom_metric_value: initial?.custom_metric_value ?? 0,
    focus_score: initial?.focus_score ?? 0,
  });

  const [activeModes, setActiveModes] = useState<
    ("questions" | "pages" | "custom")[]
  >(() => {
    const modes: ("questions" | "pages" | "custom")[] = [];
    if (initial?.questions_new || initial?.questions_review)
      modes.push("questions");
    if (initial?.pages_read) modes.push("pages");
    if (initial?.custom_metric_label) modes.push("custom");
    return modes.length ? modes : ["questions"];
  });

  const [durH, setDurH] = useState(Math.floor(initial?.hours || 0));
  const [durM, setDurM] = useState(
    Math.round(((initial?.hours || 0) - Math.floor(initial?.hours || 0)) * 60),
  );

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

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
      user_id: userId,
      id: initial?.id,
      hours: totalHours,
      questions_new: activeModes.includes("questions") ? form.questions_new : 0,
      questions_review: activeModes.includes("questions")
        ? form.questions_review
        : 0,
      correct_new: activeModes.includes("questions") ? form.correct_new : 0,
      correct_review: activeModes.includes("questions")
        ? form.correct_review
        : 0,
      pages_read: activeModes.includes("pages") ? form.pages_read : 0,
      custom_metric_label: activeModes.includes("custom")
        ? form.custom_metric_label || ""
        : "",
      custom_metric_value: activeModes.includes("custom")
        ? form.custom_metric_value
        : 0,
      focus_score: form.focus_score || 0,
    });
  }

  const inputStyle =
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-violet-600/20 transition-all placeholder:text-neutral-700";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

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
                Matéria <span className="text-violet-500 ml-1">*</span>
              </Label>
              <SubjectInput
                value={form.subject}
                onChange={(v) => setField("subject", v)}
                existingSubjects={existingSubjects}
                inputClass={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sf-date" className={lc}>
                  Data <span className="text-violet-500 ml-1">*</span>
                </Label>
                <Input
                  id="sf-date"
                  type="date"
                  className={`${inputStyle} cursor-pointer`}
                  value={form.date}
                  onClick={(e) => {
                    if ("showPicker" in HTMLInputElement.prototype) {
                      e.currentTarget.showPicker();
                    }
                  }}
                  onChange={(e) => setField("date", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={lc}>
                  Duração <span className="text-violet-500 ml-1">*</span>
                </Label>
                <div className="flex gap-2">
                  <div
                    className={`flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11 focus-within:border-violet-600/20 transition-all`}
                  >
                    <input
                      type="number"
                      min="0"
                      max="24"
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none font-bold placeholder:text-neutral-700"
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
                    className={`flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-11 focus-within:border-violet-600/20 transition-all`}
                  >
                    <input
                      type="number"
                      min="0"
                      max="59"
                      className="w-full bg-transparent text-sm text-foreground focus:outline-none font-bold placeholder:text-neutral-700"
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
              className={`bg-card border-border rounded-xl min-h-[140px] resize-none pt-4 text-sm font-medium text-muted-foreground focus:border-violet-600/20 placeholder:text-neutral-700 transition-all`}
              placeholder="Notas sobre o aprendizado, dificuldades ou revisões futuras..."
              value={form.note || ""}
              onChange={(e) => setField("note", e.target.value)}
            />
          </div>

          {/* Seletor de Foco e Energia */}
          <div className="flex flex-col gap-3">
            <Label className={lc}>Foco e Energia</Label>
            <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField("focus_score", s)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    form.focus_score === s
                      ? "bg-violet-600/10 border-violet-600/30 text-violet-600 dark:text-violet-400"
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-bold text-neutral-600 uppercase">
              {form.focus_score !== undefined
                ? [
                    "Totalmente Improdutivo",
                    "Exausto / Sem Foco",
                    "Cansado / Distraído",
                    "Razoável",
                    "Bom Foco",
                    "Concentração Total",
                  ][form.focus_score]
                : "Não avaliado"}
            </p>
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
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    activeModes.includes(opt.id)
                      ? "bg-violet-600/10 border-violet-500/30 text-violet-500"
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground"
                  }`}
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
                        className={`text-[10px] font-bold text-violet-500/80 ml-0.5 uppercase`}
                      >
                        Questões inéditas
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          className={inputStyle}
                          placeholder="Total"
                          value={form.questions_new || ""}
                          onChange={(e) =>
                            setField(
                              "questions_new",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={`${inputStyle} text-green-400/90 focus:border-green-500/40`}
                          placeholder="Acertos"
                          value={form.correct_new || ""}
                          onChange={(e) =>
                            setField(
                              "correct_new",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-3 font-bold">
                      <Label
                        className={`text-[10px] font-bold text-violet-500/80 ml-0.5 uppercase`}
                      >
                        Questões de revisão
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          className={inputStyle}
                          placeholder="Total"
                          value={form.questions_review || ""}
                          onChange={(e) =>
                            setField(
                              "questions_review",
                              Number.parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={`${inputStyle} text-green-400/90 focus:border-green-500/40`}
                          placeholder="Acertos"
                          value={form.correct_review || ""}
                          onChange={(e) =>
                            setField(
                              "correct_review",
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
                        value={form.pages_read || ""}
                        onChange={(e) =>
                          setField(
                            "pages_read",
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
                          className={`${inputStyle} flex-1`}
                          placeholder="Ex: Flashcards"
                          value={form.custom_metric_label || ""}
                          onChange={(e) =>
                            setField("custom_metric_label", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          className={`${inputStyle} w-20 px-2 text-center`}
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
        </div>
      </div>
    </form>
  );
}
