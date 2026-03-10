"use client";

import { invoke } from "@tauri-apps/api/core";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import type { CalendarEvent } from "../../calendar/types";

export function CalendarWidget() {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const uid = user ? String(user.id) : "";
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await invoke<CalendarEvent[]>("calendar_list_events", {
        userId: uid,
      });
      // Filtrar apenas eventos das próximas 4 semanas
      const now = new Date();
      const fourWeeksLater = new Date();
      fourWeeksLater.setDate(now.getDate() + 28);

      const todayStr = now.toISOString().slice(0, 10);
      const limitStr = fourWeeksLater.toISOString().slice(0, 10);

      const upcoming = data
        .filter((e) => e.date >= todayStr && e.date <= limitStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4);
      setEvents(upcoming);
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
      className="w-full text-left bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 h-full hover:border-green-500/50 transition-all group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
            <CalendarDays className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="text-sm font-bold text-white">
            Eventos (Próximas 4 semanas)
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse w-full">
            <div className="h-10 bg-neutral-800 rounded-xl w-full" />
            <div className="h-10 bg-neutral-800 rounded-xl w-full" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-neutral-600 py-2">
            Sem eventos nas próximas 4 semanas
          </p>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="px-3 py-2 rounded-xl bg-neutral-800/40 border border-neutral-700/50 flex flex-col gap-0.5 w-full group-hover:bg-neutral-800/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-xs font-bold text-neutral-200 truncate">
                  {ev.title}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium shrink-0">
                  {new Date(`${ev.date}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </div>
              {ev.time && (
                <span className="text-[10px] text-neutral-600">{ev.time}</span>
              )}
            </div>
          ))
        )}
      </div>
    </button>
  );
}
