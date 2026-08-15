"use client";

import { BookOpen, Clock, Coffee, MapPin, Play, User } from "lucide-react";
import { useMemo } from "react";
import type { SubjectMeta } from "@/components/modules/grades/types";
import {
  calcScheduleBreakMinutes,
  calcScheduleNetHours,
} from "@/components/modules/studies/utils";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySchedule, StudySession } from "../../../studies/types";
import { BaseWidget } from "../BaseWidget";

interface ScheduleWidgetProps {
  schedules: StudySchedule[];
  subjects: SubjectMeta[];
  time: Date;
  onAddSession?: (session: StudySession) => Promise<void>;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

function timeToMinutes(tStr: string) {
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

export function ScheduleWidget({
  schedules = [],
  subjects = [],
  time,
  onAddSession,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: ScheduleWidgetProps) {
  const moduleColor = getModuleColor("studies");
  const moduleTheme = getColorTheme(moduleColor);

  // Mapeamento de cores das matérias
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of subjects) {
      map[s.name] = s.color;
    }
    return map;
  }, [subjects]);

  const currentDayId = time.getDay();
  const nowHours = time.getHours();
  const nowMinutes = time.getMinutes();
  const currentMinutes = nowHours * 60 + nowMinutes;

  // Aulas do dia de hoje ordenadas pelo horário de início
  const todaySchedules = useMemo(() => {
    return schedules
      .filter((s) => s.dayOfWeek === currentDayId)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [schedules, currentDayId]);

  // Aula em andamento agora
  const activeClass = useMemo(() => {
    return todaySchedules.find((s) => {
      const start = timeToMinutes(s.startTime);
      const end = timeToMinutes(s.endTime);
      return currentMinutes >= start && currentMinutes < end;
    });
  }, [todaySchedules, currentMinutes]);

  // Verifica se o momento atual está dentro do intervalo da aula ativa
  const isCurrentlyInBreak = useMemo(() => {
    if (!activeClass?.breakStartTime || !activeClass?.breakEndTime)
      return false;
    const bStart = timeToMinutes(activeClass.breakStartTime);
    const bEnd = timeToMinutes(activeClass.breakEndTime);
    return currentMinutes >= bStart && currentMinutes < bEnd;
  }, [activeClass, currentMinutes]);

  // Próximas aulas de hoje que ainda não começaram
  const upcomingTodaySchedules = useMemo(() => {
    return todaySchedules.filter(
      (s) => timeToMinutes(s.startTime) > currentMinutes,
    );
  }, [todaySchedules, currentMinutes]);

  // Próximo dia útil / dia com aulas agendadas se hoje não tiver mais aulas
  const nextDayInfo = useMemo(() => {
    for (let i = 1; i <= 7; i++) {
      const targetDayId = (currentDayId + i) % 7;
      const daySchedules = schedules
        .filter((s) => s.dayOfWeek === targetDayId)
        .sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        );

      if (daySchedules.length > 0) {
        const dayNames = [
          "Domingo",
          "Segunda-feira",
          "Terça-feira",
          "Quarta-feira",
          "Quinta-feira",
          "Sexta-feira",
          "Sábado",
        ];
        const label = i === 1 ? "Amanhã" : dayNames[targetDayId];
        return {
          dayName: label,
          schedules: daySchedules,
        };
      }
    }
    return null;
  }, [schedules, currentDayId]);

  // Determinar a aula principal (Primary) e a aula secundária (Secondary)
  const {
    primaryClass,
    primaryBadgeText,
    isActiveClass,
    secondaryClass,
    secondaryBadgeText,
  } = useMemo(() => {
    // Caso 1: Aula acontecendo agora
    if (activeClass) {
      const nextToday = upcomingTodaySchedules[0];
      const nextDayFirst = nextDayInfo?.schedules[0];

      let secClass: StudySchedule | null = null;
      let secText = "";

      if (nextToday) {
        secClass = nextToday;
        secText = "Próxima aula hoje";
      } else if (nextDayFirst) {
        secClass = nextDayFirst;
        secText = `Próxima aula (${nextDayInfo?.dayName})`;
      }

      return {
        primaryClass: activeClass,
        primaryBadgeText: isCurrentlyInBreak
          ? `Intervalo até ${activeClass.breakEndTime}`
          : "Aula de agora",
        isActiveClass: true,
        secondaryClass: secClass,
        secondaryBadgeText: secText,
      };
    }

    // Caso 2: Não há aula agora, mas há aulas hoje mais tarde
    if (upcomingTodaySchedules.length > 0) {
      const firstUpcoming = upcomingTodaySchedules[0];
      const secondUpcoming = upcomingTodaySchedules[1];
      const nextDayFirst = nextDayInfo?.schedules[0];

      let secClass: StudySchedule | null = null;
      let secText = "";

      if (secondUpcoming) {
        secClass = secondUpcoming;
        secText = "Aula seguinte (hoje)";
      } else if (nextDayFirst) {
        secClass = nextDayFirst;
        secText = `Próxima aula (${nextDayInfo?.dayName})`;
      }

      return {
        primaryClass: firstUpcoming,
        primaryBadgeText: "Próxima aula hoje",
        isActiveClass: false,
        secondaryClass: secClass,
        secondaryBadgeText: secText,
      };
    }

    // Caso 3: Sem mais aulas hoje (Fim de semana ou pós-aulas)
    if (nextDayInfo && nextDayInfo.schedules.length > 0) {
      const firstNext = nextDayInfo.schedules[0];
      const secondNext = nextDayInfo.schedules[1];

      return {
        primaryClass: firstNext,
        primaryBadgeText: `Próxima aula (${nextDayInfo.dayName})`,
        isActiveClass: false,
        secondaryClass: secondNext || null,
        secondaryBadgeText: secondNext
          ? `Aula seguinte (${nextDayInfo.dayName})`
          : "",
      };
    }

    return {
      primaryClass: null,
      primaryBadgeText: "",
      isActiveClass: false,
      secondaryClass: null,
      secondaryBadgeText: "",
    };
  }, [activeClass, upcomingTodaySchedules, nextDayInfo, isCurrentlyInBreak]);

  const handleQuickRegister = async (item: StudySchedule) => {
    if (!onAddSession) return;
    const durationHours = calcScheduleNetHours(item);
    const breakMin = calcScheduleBreakMinutes(
      item.breakStartTime,
      item.breakEndTime,
    );

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const breakNote =
      breakMin > 0 ? ` (intervalo de ${breakMin} min descontado)` : "";

    const newSession = {
      userId: item.userId || "",
      date: dateStr,
      subject: item.subject,
      hours: durationHours > 0 ? durationHours : 1,
      questionsNew: 0,
      questionsReview: 0,
      correctNew: 0,
      correctReview: 0,
      note: `Presença registrada via grade de horários${breakNote}.`,
    };

    await onAddSession(newSession);
  };

  const renderWidgetContent = () => {
    if (schedules.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs font-bold text-foreground">Grade vazia</p>
          <p className="text-[11px] text-muted-foreground font-normal max-w-50 mt-1">
            Cadastre suas aulas no módulo de estudos para acompanhar sua rotina
            aqui.
          </p>
        </div>
      );
    }

    if (!primaryClass) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-xs font-bold text-foreground">Sem mais aulas</p>
          <p className="text-[11px] text-muted-foreground font-normal mt-1">
            Nenhuma aula agendada para os próximos dias.
          </p>
        </div>
      );
    }

    const primaryColorKey = (colorMap[primaryClass.subject] ||
      moduleColor) as ThemeColorKey;
    const primaryTheme = getColorTheme(primaryColorKey);

    const secondaryColorKey = (
      secondaryClass
        ? colorMap[secondaryClass.subject] || moduleColor
        : moduleColor
    ) as ThemeColorKey;
    const secondaryTheme = getColorTheme(secondaryColorKey);

    // Progresso se for aula ativa
    let progressPercent = 0;
    let minutesRemaining = 0;
    if (isActiveClass) {
      const start = timeToMinutes(primaryClass.startTime);
      const end = timeToMinutes(primaryClass.endTime);
      const total = Math.max(1, end - start);
      const elapsed = currentMinutes - start;
      progressPercent = Math.max(0, Math.min(100, (elapsed / total) * 100));
      minutesRemaining = Math.max(0, end - currentMinutes);
    }

    const minutesToStart =
      timeToMinutes(primaryClass.startTime) - currentMinutes;

    return (
      <div className="flex flex-col justify-between h-full gap-3 py-1 text-left">
        {/* Seção da Aula Principal */}
        <div className="space-y-2">
          {/* Badge do Status da Aula */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                isCurrentlyInBreak
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : isActiveClass
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : `${moduleTheme.bg} ${moduleTheme.text} ${moduleTheme.border}`,
              )}
            >
              {isCurrentlyInBreak ? (
                <Coffee className="w-3 h-3 text-amber-500" />
              ) : isActiveClass ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              ) : (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    moduleTheme.solid,
                  )}
                />
              )}
              {primaryBadgeText}
            </span>
          </div>

          {/* Nome da Matéria e Informações */}
          <div className="space-y-2">
            <h4 className="text-base font-bold text-foreground leading-snug wrap-break-word">
              {primaryClass.subject}
            </h4>

            {/* Informações de Horário e Local */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-foreground shrink-0">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>
                  {primaryClass.startTime} - {primaryClass.endTime}
                </span>
                {!isActiveClass && minutesToStart > 0 && (
                  <span
                    className={cn(
                      "ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0",
                      moduleTheme.bg,
                      moduleTheme.text,
                      moduleTheme.border,
                    )}
                  >
                    em {formatMinutes(minutesToStart)}
                  </span>
                )}
              </span>

              {primaryClass.location && (
                <span className="flex items-center gap-1 text-muted-foreground font-medium shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>{primaryClass.location}</span>
                </span>
              )}
            </div>

            {/* Professor(es) - permite quebra de linha suave para múltiplos nomes */}
            {primaryClass.teacher && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground font-medium pt-0.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                <span className="leading-relaxed wrap-break-word">
                  {primaryClass.teacher}
                </span>
              </div>
            )}

            {/* Intervalo */}
            {primaryClass.breakStartTime && primaryClass.breakEndTime && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 pt-0.5">
                <Coffee className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Intervalo: {primaryClass.breakStartTime} -{" "}
                  {primaryClass.breakEndTime}
                </span>
              </div>
            )}
          </div>

          {/* Barra de Progresso se estiver acontecendo agora */}
          {isActiveClass && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px]">
                  <Clock className="w-3 h-3" /> Termina em{" "}
                  {formatMinutes(minutesRemaining)}
                </span>
                <span className={cn("font-bold text-xs", primaryTheme.text)}>
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    primaryTheme.solid,
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Seção da Aula Secundária ("Aula seguinte") */}
        {secondaryClass && (
          <div className="pt-2.5 border-t border-border/40 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-bold", moduleTheme.text)}>
                {secondaryBadgeText}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {secondaryClass.startTime} - {secondaryClass.endTime}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  secondaryTheme.solid,
                )}
              />
              <span className="text-xs font-bold text-foreground wrap-break-word">
                {secondaryClass.subject}
              </span>
              {secondaryClass.location && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  ({secondaryClass.location})
                </span>
              )}
            </div>
            {secondaryClass.teacher && (
              <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                <User className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                <span className="leading-snug wrap-break-word">
                  {secondaryClass.teacher}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botão de Registro Interativo se ativado */}
        {isInteractive && primaryClass && (
          <Button
            size="sm"
            onClick={() => handleQuickRegister(primaryClass)}
            className={cn(
              "w-full h-8 text-xs font-bold gap-1.5 cursor-pointer text-white border-0 mt-2 rounded-xl transition-all active:scale-[0.98]",
              moduleTheme.solid,
              moduleTheme.solidHover,
            )}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isActiveClass ? "Registrar aula estudada" : "Estudar matéria"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <BaseWidget
      title="Grade Horária"
      icon={BookOpen}
      color={moduleColor}
      route="studies"
      searchParams="tab=horarios"
      isEditMode={isEditMode}
      isInteractive={isInteractive}
      onToggleInteractive={onToggleInteractive}
    >
      <div className="h-full flex flex-col justify-center">
        {renderWidgetContent()}
      </div>
    </BaseWidget>
  );
}
