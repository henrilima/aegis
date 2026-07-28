"use client";

import { invoke } from "@tauri-apps/api/core";
import { BookOpen, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubjectInput } from "@/components/modules/studies/components/modals/subjectInput";
import type { StudySession } from "@/components/modules/studies/types";
import { isoDate } from "@/components/modules/studies/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface PomodoroLinkStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cyclesCompleted: number;
  workMinutes: number;
  onSuccess?: () => void;
}

export function PomodoroLinkStudyModal({
  isOpen,
  onClose,
  cyclesCompleted,
  workMinutes,
  onSuccess,
}: PomodoroLinkStudyModalProps) {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);

  const totalFocusMinutes = cyclesCompleted * workMinutes;
  const initialH = Math.floor(totalFocusMinutes / 60);
  const initialM = totalFocusMinutes % 60;

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [durH, setDurH] = useState(initialH);
  const [durM, setDurM] = useState(initialM);
  const [note, setNote] = useState("");
  const [focusScore, setFocusScore] = useState<number>(5);
  const [tags, setTags] = useState("pomodoro");
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const wasOpenRef = useRef(false);

  // Inicializa os campos APENAS no momento em que o modal é aberto
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setSubject("");
      setTopic("");
      setDate(isoDate(simulatedNow));
      setDurH(Math.floor((cyclesCompleted * workMinutes) / 60));
      setDurM((cyclesCompleted * workMinutes) % 60);
      setNote("");
      setFocusScore(5);
      setTags("pomodoro");

      if (user) {
        invoke<Array<{ name: string }>>("subjects_list", {
          userId: String(user.id),
        })
          .then((metas) => {
            setExistingSubjects(metas.map((m) => m.name));
          })
          .catch(console.error);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, user, cyclesCompleted, workMinutes, simulatedNow]);

  if (!isOpen) return null;

  const handleToggleTag = (tagToToggle: string) => {
    const currentTags = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    let nextTags: string[];
    if (currentTags.includes(tagToToggle)) {
      nextTags = currentTags.filter((t) => t !== tagToToggle);
    } else {
      nextTags = [...currentTags, tagToToggle];
    }
    setTags(nextTags.join(", "));
  };

  const isTagActive = (tagCheck: string) => {
    const currentTags = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    return currentTags.includes(tagCheck);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!subject.trim()) {
      toast.error("Por favor, selecione ou informe uma matéria.");
      return;
    }

    const totalHours = durH + durM / 60;
    if (totalHours <= 0) {
      toast.error("A duração da sessão de estudos deve ser maior que zero.");
      return;
    }

    setSaving(true);
    try {
      const sessionData: StudySession = {
        userId: String(user.id),
        date: date,
        subject: subject.trim(),
        hours: totalHours,
        questionsNew: 0,
        questionsReview: 0,
        correctNew: 0,
        correctReview: 0,
        topic: topic.trim() || undefined,
        note: note.trim() || undefined,
        focusScore: focusScore,
        tags: tags.trim() || undefined,
        isPomodoro: true,
      };

      await invoke("estudos_add_session", { session: sessionData });
      toast.success("Sessão de estudos do Pomodoro vinculada com sucesso!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao vincular sessão de estudos.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = `w-full bg-card p-3 border-border h-10 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-600 ${theme.borderHover.replace("hover:", "focus:")}`;
  const labelClass = "text-xs font-bold text-muted-foreground ml-0.5";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-full bg-background">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card/40">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                theme.bg,
                theme.text,
                theme.border,
              )}
            >
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Vincular Pomodoro aos estudos
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    theme.bg,
                    theme.text,
                    theme.border,
                  )}
                >
                  {cyclesCompleted} {cyclesCompleted === 1 ? "ciclo" : "ciclos"}{" "}
                  ({totalFocusMinutes} min)
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Registre o tempo acumulado como uma sessão de estudos vinculada
                a uma matéria.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do formulário em duas colunas */}
        <form
          onSubmit={handleSave}
          className="p-6 space-y-6 overflow-y-auto max-h-[75vh]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Coluna esquerda: Identificação, data e tempo */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pomo-subject" className={labelClass}>
                  Matéria de estudos <span className={theme.text}>*</span>
                </Label>
                <SubjectInput
                  value={subject}
                  onChange={setSubject}
                  existingSubjects={existingSubjects}
                  inputClass={inputStyle}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pomo-topic" className={labelClass}>
                  Conteúdo / título estudado
                </Label>
                <Input
                  id="pomo-topic"
                  type="text"
                  className={inputStyle}
                  placeholder="Ex: Resolução de exercícios, Capítulo 4..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pomo-date" className={labelClass}>
                    Data da sessão <span className={theme.text}>*</span>
                  </Label>
                  <Input
                    id="pomo-date"
                    type="date"
                    className={inputStyle}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    Duração registrada <span className={theme.text}>*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div
                      className={cn(
                        "flex-1 flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 h-10",
                        theme.borderHover.replace("hover:", "focus-within:"),
                      )}
                    >
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        className="w-full bg-transparent text-sm text-foreground font-bold border-none p-0 text-center focus:outline-none"
                        value={durH || ""}
                        onChange={(e) =>
                          setDurH(
                            Math.min(24, parseInt(e.target.value, 10) || 0),
                          )
                        }
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        h
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex-1 flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 h-10",
                        theme.borderHover.replace("hover:", "focus-within:"),
                      )}
                    >
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        className="w-full bg-transparent text-sm text-foreground font-bold border-none p-0 text-center focus:outline-none"
                        value={durM || ""}
                        onChange={(e) =>
                          setDurM(
                            Math.min(59, parseInt(e.target.value, 10) || 0),
                          )
                        }
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna direita: Foco e energia, observações e tags */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>Foco e energia</Label>
                <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
                  {[0, 1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFocusScore(score)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                        focusScore === score
                          ? cn(theme.bg, theme.text, theme.border)
                          : "bg-transparent border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <p className="text-center text-[10px] font-bold text-muted-foreground">
                  {[
                    "Totalmente improdutivo",
                    "Exausto / sem foco",
                    "Cansado / distraído",
                    "Razoável",
                    "Bom foco",
                    "Concentração total",
                  ][focusScore] ?? "Não avaliado"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pomo-note" className={labelClass}>
                  Observações da sessão
                </Label>
                <Textarea
                  id="pomo-note"
                  className={cn(
                    "bg-card border-border rounded-xl min-h-22.5 text-xs font-medium resize-none",
                    theme.borderHover.replace("hover:", "focus:"),
                  )}
                  placeholder="Descreva observações sobre o aprendizado durante esse pomodoro..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pomo-tags" className={labelClass}>
                  Tags / marcadores
                </Label>
                <Input
                  id="pomo-tags"
                  type="text"
                  className={inputStyle}
                  placeholder="Ex: pomodoro, revisão, exercícios"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    "pomodoro",
                    "revisão",
                    "teoria",
                    "exercícios",
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
                            : "bg-card border-border text-muted-foreground hover:border-neutral-500",
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé e botões de ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-10 text-xs font-bold text-muted-foreground rounded-xl"
            >
              Agora não
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className={cn(
                "h-10 text-xs font-bold text-white rounded-xl transition-all",
                theme.solid,
                theme.solidHover,
              )}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Salvando..." : "Vincular aos estudos"}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
