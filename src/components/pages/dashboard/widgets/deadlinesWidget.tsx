"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import type { CalendarEvent, DeadlineCategory } from "../../calendar/types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  daysUntil,
} from "../../calendar/types";

export function DeadlinesWidget() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const uid = user ? String(user.id) : "";
  const [deadlines, setDeadlines] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await invoke<CalendarEvent[]>("calendar_list_events", {
        userId: uid,
      });

      const now = new Date();
      const fourWeeksLater = new Date();
      fourWeeksLater.setDate(now.getDate() + 28);

      const todayStr = now.toISOString().slice(0, 10);
      const limitStr = fourWeeksLater.toISOString().slice(0, 10);

      const dls = data
        .filter(
          (e) =>
            e.event_type === "deadline" &&
            e.date >= todayStr &&
            e.date <= limitStr,
        )
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);

      setDeadlines(dls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <button
      type="button"
      onClick={() => navigate("calendar")}
      className="w-full text-left bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 h-full hover:border-red-500/50 transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Deadlines (Próximas 4 semanas)
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse w-full">
            <div className="h-12 bg-neutral-800 rounded-xl w-full" />
            <div className="h-12 bg-neutral-800 rounded-xl w-full" />
          </div>
        ) : deadlines.length === 0 ? (
          <p className="text-xs text-neutral-600 py-2 text-center">
            Nenhum deadline pendente
          </p>
        ) : (
          deadlines.map((ev) => {
            const days = daysUntil(ev.date);
            const color = ev.deadline_category
              ? DEADLINE_COLORS[ev.deadline_category as DeadlineCategory]
              : "#ef4444";

            return (
              <div
                key={ev.id}
                className="px-3 py-2 rounded-xl bg-neutral-800/40 border border-neutral-700/50 flex items-center justify-between gap-3 w-full group-hover:bg-neutral-800/60 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-bold text-neutral-200 truncate">
                    {ev.title}
                  </span>
                  {ev.deadline_category && (
                    <span
                      className="text-[9px] font-black uppercase"
                      style={{ color }}
                    >
                      {
                        DEADLINE_LABELS[
                          ev.deadline_category as DeadlineCategory
                        ]
                      }
                    </span>
                  )}
                </div>
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-black shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {days === 0 ? "HOJE" : days === 1 ? "AMANHÃ" : `${days} d`}
                </div>
              </div>
            );
          })
        )}
      </div>
    </button>
  );
}
