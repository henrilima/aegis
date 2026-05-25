import type { AppAlarm } from "./types";

const DAY_MINUTES = 24 * 60;

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function getNextAlarmDate(alarm: AppAlarm, now = new Date()) {
  const startMinutes = timeToMinutes(alarm.time);
  const todayStart = startOfDay(now);

  if (alarm.alarmType === "interval") {
    const interval = Math.max(1, alarm.intervalMinutes ?? 30);
    const firstToday = addMinutes(todayStart, startMinutes);

    if (now <= firstToday) return firstToday;

    const elapsedMinutes = Math.floor(
      (now.getTime() - firstToday.getTime()) / 60_000,
    );
    const nextOffset = (Math.floor(elapsedMinutes / interval) + 1) * interval;
    const nextToday = addMinutes(firstToday, nextOffset);

    if (nextToday.getTime() < todayStart.getTime() + DAY_MINUTES * 60_000) {
      return nextToday;
    }

    return addMinutes(
      startOfDay(addMinutes(todayStart, DAY_MINUTES)),
      startMinutes,
    );
  }

  const fixedToday = addMinutes(todayStart, startMinutes);
  if (now <= fixedToday) return fixedToday;
  return addMinutes(fixedToday, DAY_MINUTES);
}

export function getNextAlarmSummary(alarm: AppAlarm, now = new Date()) {
  const nextDate = getNextAlarmDate(alarm, now);
  const timeLabel = nextDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const today = startOfDay(now).getTime();
  const nextDay = startOfDay(nextDate).getTime();
  const dayLabel = nextDay === today ? "Hoje" : "Amanha";

  return {
    date: nextDate,
    label: `${dayLabel}, ${timeLabel}`,
    shortLabel: timeLabel,
  };
}

export function sortByNextTrigger(alarms: AppAlarm[], now = new Date()) {
  return [...alarms].sort(
    (a, b) =>
      getNextAlarmDate(a, now).getTime() - getNextAlarmDate(b, now).getTime(),
  );
}
