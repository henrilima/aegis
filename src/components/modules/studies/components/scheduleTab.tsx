"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Calendar,
  Clock,
  Coffee,
  MapPin,
  Pencil,
  Play,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveColor } from "@/colors.config";
import type { SubjectMeta } from "@/components/modules/grades/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
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
import type { StudySchedule } from "../types";
import {
  calcScheduleBreakMinutes,
  calcScheduleNetHours,
  formatHours,
} from "../utils";
import { SubjectInput } from "./modals/subjectInput";

interface ScheduleTabProps {
  schedules: StudySchedule[];
  existingSubjects: string[];
  subjectMetas: SubjectMeta[];
  onRefresh: () => void;
  userId: string;
  showSaturday: boolean;
  showSunday: boolean;
  onStudyClass?: (schedule: StudySchedule) => void;
  onQuickRegisterClass?: (schedule: StudySchedule) => void;
}

export function ScheduleTab({
  schedules,
  existingSubjects,
  subjectMetas,
  onRefresh,
  userId,
  showSaturday,
  showSunday,
  onStudyClass,
  onQuickRegisterClass: _onQuickRegisterClass,
}: ScheduleTabProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<StudySchedule | null>(null);

  const DAYS_OF_WEEK = useMemo(() => {
    const list = [
      { id: 1, name: "Segunda" },
      { id: 2, name: "Terça" },
      { id: 3, name: "Quarta" },
      { id: 4, name: "Quinta" },
      { id: 5, name: "Sexta" },
    ];
    if (showSaturday) list.push({ id: 6, name: "Sábado" });
    if (showSunday) list.push({ id: 0, name: "Domingo" });
    return list;
  }, [showSaturday, showSunday]);

  // Estados do formulário
  const [subject, setSubject] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakStartTime, setBreakStartTime] = useState("");
  const [breakEndTime, setBreakEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [teacher, setTeacher] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Mapeamento de cor da matéria
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of subjectMetas) {
      map[s.name] = s.color;
    }
    return map;
  }, [subjectMetas]);

  const handleAddClick = () => {
    setEditingItem(null);
    setSubject("");
    setDayOfWeek("1");
    setStartTime("");
    setEndTime("");
    setBreakStartTime("");
    setBreakEndTime("");
    setLocation("");
    setTeacher("");
    setShowModal(true);
  };

  const handleEditClick = (item: StudySchedule) => {
    setEditingItem(item);
    setSubject(item.subject);
    setDayOfWeek(String(item.dayOfWeek));
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setBreakStartTime(item.breakStartTime ?? "");
    setBreakEndTime(item.breakEndTime ?? "");
    setLocation(item.location ?? "");
    setTeacher(item.teacher ?? "");
    setShowModal(true);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime) {
      toast.error("Por favor, preencha a matéria e os horários.");
      return;
    }

    if (
      (breakStartTime && !breakEndTime) ||
      (!breakStartTime && breakEndTime)
    ) {
      toast.error("Por favor, preencha o início e o fim do intervalo.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: StudySchedule = {
        id: editingItem?.id ?? undefined,
        userId,
        subject,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        breakStartTime: breakStartTime.trim() || undefined,
        breakEndTime: breakEndTime.trim() || undefined,
        location: location.trim() || undefined,
        teacher: teacher.trim() || undefined,
      };

      await invoke("studies_add_schedule", { schedule: payload });
      toast.success(
        editingItem
          ? "Aula atualizada com sucesso!"
          : "Aula cadastrada com sucesso!",
      );
      setShowModal(false);

      // Limpar formulário
      setSubject("");
      setDayOfWeek("1");
      setStartTime("");
      setEndTime("");
      setBreakStartTime("");
      setBreakEndTime("");
      setLocation("");
      setTeacher("");
      setEditingItem(null);

      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar aula.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await invoke("studies_delete_schedule", { id: deleteId, userId });
      toast.success("Aula removida da grade.");
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao deletar aula.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Ações */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleAddClick}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer",
            theme.solid,
            theme.solidHover,
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Aula
        </button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Grade vazia"
          description="Você ainda não cadastrou nenhuma aula em sua grade semanal de horários."
          className="py-16"
        />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-6 md:gap-4",
            DAYS_OF_WEEK.length === 5 && "md:grid-cols-5",
            DAYS_OF_WEEK.length === 6 && "md:grid-cols-6",
            DAYS_OF_WEEK.length === 7 && "md:grid-cols-7",
          )}
        >
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = schedules
              .filter((s) => s.dayOfWeek === day.id)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day.id}
                className="flex flex-col gap-4 min-h-40 pb-4 md:border-r border-border md:pr-4 last:pr-0 last:border-r-0"
              >
                <div className="border-b border-border pb-2.5">
                  <p className="text-sm font-bold text-foreground">
                    {day.name}
                  </p>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {daySchedules.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 font-semibold italic ml-0.5">
                      Sem aulas
                    </p>
                  ) : (
                    daySchedules.map((item) => {
                      const subjectColor = colorMap[item.subject] || "slate";
                      const hex = resolveColor(subjectColor);

                      return (
                        <div
                          key={
                            item.id ??
                            `${item.subject}-${item.startTime}-${item.endTime}`
                          }
                          style={{ borderLeftColor: hex }}
                          className="group relative flex flex-col gap-1.5 pl-3 py-2 border-l-[3px] hover:bg-muted/15 rounded-r-xl transition-all text-left w-full"
                        >
                          {/* Cabeçalho do Card: Matéria + Ações */}
                          <div className="flex items-start justify-between gap-1.5 w-full">
                            <span className="text-sm font-bold text-foreground leading-tight whitespace-normal wrap-break-word flex-1">
                              {item.subject}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 -mt-0.5 -mr-1">
                              {onStudyClass && (
                                <button
                                  type="button"
                                  onClick={() => onStudyClass(item)}
                                  className="p-1 hover:text-indigo-500 text-neutral-500 hover:bg-indigo-500/10 rounded-md transition-all cursor-pointer"
                                  title="Estudar aula"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditClick(item)}
                                className="p-1 hover:text-neutral-900 dark:hover:text-white text-neutral-500 hover:bg-muted/50 rounded-md transition-all cursor-pointer"
                                title="Editar aula"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.id !== undefined)
                                    setDeleteId(item.id);
                                }}
                                className="p-1 hover:text-red-500 text-neutral-500 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                                title="Excluir aula"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground font-semibold">
                            <div className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                              <span>
                                {item.startTime} - {item.endTime}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">
                              {formatHours(calcScheduleNetHours(item))}
                            </span>
                          </div>
                          {item.breakStartTime && item.breakEndTime && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                              <Coffee className="w-2.5 h-2.5 shrink-0 text-muted-foreground" />
                              <span>
                                Intervalo: {item.breakStartTime} -{" "}
                                {item.breakEndTime} (
                                {calcScheduleBreakMinutes(
                                  item.breakStartTime,
                                  item.breakEndTime,
                                )}
                                min)
                              </span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium whitespace-normal wrap-break-word text-left">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span>{item.location}</span>
                            </div>
                          )}
                          {item.teacher && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium whitespace-normal wrap-break-word text-left">
                              <User className="w-2.5 h-2.5 shrink-0" />
                              <span>{item.teacher}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro */}
      <ModalShell
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size="xl"
      >
        <form onSubmit={handleAddSchedule} className="flex flex-col h-full">
          <div className="p-6 border-b border-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
              >
                <Calendar className={cn("w-5 h-5", theme.text)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {editingItem ? "Editar aula" : "Nova aula"}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  {editingItem
                    ? "Modifique as informações e horários da aula"
                    : "Cadastre uma matéria e seus horários na grade"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-2.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Coluna 1: Dados Gerais da Aula */}
            <div className="space-y-4">
              {/* Seleção de Matéria */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Matéria / Disciplina
                </Label>
                <SubjectInput
                  value={subject}
                  onChange={setSubject}
                  existingSubjects={existingSubjects}
                  inputClass="bg-card border border-border rounded-xl h-11 text-xs w-full px-4 animate-none"
                />
              </div>

              {/* Dia da Semana */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Dia da Semana
                </Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="w-full bg-card border border-border rounded-xl h-11 text-xs">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem
                        key={d.id}
                        value={String(d.id)}
                        className="text-xs"
                      >
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sala / Local */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Local / Sala de Aula
                </Label>
                <Input
                  type="text"
                  placeholder="Ex: Bloco B, Sala 302 (opcional)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-card border-border rounded-xl h-11 text-xs px-4"
                />
              </div>

              {/* Professor */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Professor(a)
                </Label>
                <Input
                  type="text"
                  placeholder="Nome do docente (opcional)"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className="bg-card border-border rounded-xl h-11 text-xs px-4"
                />
              </div>
            </div>

            {/* Coluna 2: Horários & Intervalo */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Horário Início / Fim */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Início da aula
                    </Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-card border-border rounded-xl h-11 text-xs px-4"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Término da aula
                    </Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-card border-border rounded-xl h-11 text-xs px-4"
                    />
                  </div>
                </div>

                {/* Intervalo (Opcional) */}
                <div className="rounded-xl border border-border/70 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className={cn("w-3.5 h-3.5", theme.text)} />
                      <span className="text-xs font-bold text-foreground">
                        Intervalo (Opcional)
                      </span>
                    </div>
                    {(breakStartTime || breakEndTime) && (
                      <button
                        type="button"
                        onClick={() => {
                          setBreakStartTime("");
                          setBreakEndTime("");
                        }}
                        className="text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground">
                        Início do intervalo
                      </Label>
                      <Input
                        type="time"
                        value={breakStartTime}
                        onChange={(e) => setBreakStartTime(e.target.value)}
                        className="bg-card border-border rounded-xl h-10 text-xs px-3"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground">
                        Fim do intervalo
                      </Label>
                      <Input
                        type="time"
                        value={breakEndTime}
                        onChange={(e) => setBreakEndTime(e.target.value)}
                        className="bg-card border-border rounded-xl h-10 text-xs px-3"
                      />
                    </div>
                  </div>

                  {/* Resumo de Duração Líquida */}
                  {startTime && endTime && (
                    <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Duração líquida de estudo:</span>
                      <span className={cn("font-bold", theme.text)}>
                        {formatHours(
                          calcScheduleNetHours({
                            startTime,
                            endTime,
                            breakStartTime,
                            breakEndTime,
                          }),
                        )}
                        {breakStartTime && breakEndTime && (
                          <span className="text-muted-foreground font-normal ml-1">
                            (descontado{" "}
                            {calcScheduleBreakMinutes(
                              breakStartTime,
                              breakEndTime,
                            )}{" "}
                            min)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/50 flex gap-3 bg-card/20 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-border/50 text-neutral-600 font-bold text-xs hover:bg-muted cursor-pointer transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-white font-bold text-xs cursor-pointer transition-all",
                theme.solid,
                theme.solidHover,
              )}
            >
              {isSaving
                ? "Salvando..."
                : editingItem
                  ? "Salvar alterações"
                  : "Adicionar à grade"}
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Modal de Confirmação de Exclusão */}
      {deleteId !== null && (
        <ConfirmModal
          title="Excluir aula?"
          description="Você tem certeza que deseja excluir esta aula da sua grade horária?"
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
