"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { StudySession } from "@/components/pages/studies/types";
import { isoDate } from "@/components/pages/studies/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubjectInput } from "./subjectInput";

interface SessionFormProps {
  userId: string;
  initial?: StudySession;
  existingSubjects?: string[];
  onSave: (s: StudySession) => void;
  onCancel: () => void;
}

/**
 * Formulário Mestre: Registro detalhado de sessões de estudo
 * Monitora tempo, questões, páginas e métricas personalizadas
 */
export function SessionForm({
  userId,
  initial,
  existingSubjects = [],
  onSave,
  onCancel,
}: SessionFormProps) {
  const [form, setForm] = useState<
    Omit<StudySession, "id" | "user_id" | "created_at">
  >({
    date: initial?.date ?? isoDate(new Date()),
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
  });

  // Camadas de registro ativas
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

  // Interface de tempo simplificada para o usuário
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
    });
  }

  const inputStyle =
    "w-full bg-neutral-950 border-neutral-800 h-12 rounded-xl font-bold focus:border-violet-500/40 transition-all placeholder:text-neutral-700";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Identificação da Matéria */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="sf-subject" className={labelStyle}>
            Módulo Acadêmico
          </Label>
          <SubjectInput
            value={form.subject}
            onChange={(v) => setField("subject", v)}
            existingSubjects={existingSubjects}
            inputClass={inputStyle}
          />
        </div>

        {/* Cronograma de Registro */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="sf-date" className={labelStyle}>
            Data da Sessão
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

        {/* Mensuração de Tempo */}
        <div className="flex flex-col gap-2">
          <Label className={labelStyle}>Carga de Foco</Label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-violet-500/40 transition-all">
              <input
                type="number"
                min="0"
                max="24"
                className="w-full bg-transparent text-sm text-white focus:outline-none font-bold placeholder:text-neutral-800"
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
              <span className="text-[10px] font-black text-neutral-700 uppercase">
                H
              </span>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-violet-500/40 transition-all">
              <input
                type="number"
                min="0"
                max="59"
                className="w-full bg-transparent text-sm text-white focus:outline-none font-bold placeholder:text-neutral-800"
                placeholder="0"
                value={durM || ""}
                onChange={(e) =>
                  setDurM(
                    durH === 24
                      ? 0
                      : Math.min(59, Number.parseInt(e.target.value, 10) || 0),
                  )
                }
              />
              <span className="text-[10px] font-black text-neutral-700 uppercase">
                Min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Camadas de Métricas (Toggle) */}
      <div className="flex flex-col gap-2.5">
        <Label className={labelStyle}>Métricas de Performance</Label>
        <div className="flex p-1 bg-neutral-950/50 border border-neutral-800 rounded-2xl gap-1">
          {[
            { id: "questions" as const, label: "Questões" },
            { id: "pages" as const, label: "Páginas" },
            { id: "custom" as const, label: "Extra" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleMode(opt.id)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border ${
                activeModes.includes(opt.id)
                  ? "bg-violet-600/10 border-violet-600/30 text-violet-400"
                  : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detalhamento das Métricas Selecionadas */}
      {activeModes.length > 0 && (
        <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-3xl p-6 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-500">
          {activeModes.includes("questions") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-violet-400/60 uppercase ml-1">
                  Estudo de Inéditas
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1">
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
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      className={`${inputStyle} text-green-400`}
                      placeholder="Hits"
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
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-violet-400/60 uppercase ml-1">
                  Ciclo de Revisão
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1">
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
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      className={`${inputStyle} text-green-400`}
                      placeholder="Hits"
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
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeModes.includes("pages") && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-neutral-600 uppercase ml-1">
                  Volume de Leitura
                </Label>
                <Input
                  type="number"
                  min="0"
                  className={inputStyle}
                  placeholder="Qtd. de Páginas"
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
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-neutral-600 uppercase ml-1">
                  Indicador Adicional
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="custom-label"
                    className={`${inputStyle} flex-1`}
                    placeholder="Ex: Capítulos"
                    value={form.custom_metric_label || ""}
                    onChange={(e) =>
                      setField("custom_metric_label", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    className={`${inputStyle} w-24`}
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
        </div>
      )}

      {/* Observações Gerais */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="sf-note" className={labelStyle}>
          Relatório Bio-Analítico
        </Label>
        <Textarea
          id="sf-note"
          className="bg-neutral-950 border-neutral-800 rounded-2xl min-h-[100px] resize-none pt-4 font-bold text-neutral-400 focus:border-violet-600/30 placeholder:text-neutral-800 transition-all shadow-none"
          placeholder="Dificuldades cognitivas, gatilhos de aprendizagem ou pontos de revisão..."
          value={form.note || ""}
          onChange={(e) => setField("note", e.target.value)}
        />
      </div>

      {/* Ações do Formulário */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl text-xs font-black uppercase text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 transition-all cursor-pointer"
        >
          Descartar
        </button>
        <button
          type="submit"
          className="flex-2 py-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-black uppercase transition-all hover:bg-violet-600/20 active:scale-[0.98] cursor-pointer"
        >
          {initial ? "Salvar Alterações" : "Iniciar Sessão"}
        </button>
      </div>
    </form>
  );
}
