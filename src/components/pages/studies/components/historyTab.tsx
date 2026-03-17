"use client";

import {
  BookOpen,
  ChevronDown,
  Clock,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { StudySession } from "../types";
import { formatHours, hitRate, parseDate } from "../utils";
import { StudyStars } from "./studyStars";

interface HistoryTabProps {
  sessions: StudySession[];
  search: string;
  onSearchChange: (val: string) => void;
  filterMonth: string;
  onFilterMonthChange: (val: string) => void;
  months: string[];
  onEdit: (s: StudySession) => void;
  onDelete: (id: number) => void;
}

export function HistoryTab({
  sessions,
  search,
  onSearchChange,
  filterMonth,
  onFilterMonthChange,
  months,
  onEdit,
  onDelete,
}: HistoryTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input
            className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2  text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-600/20 transition-colors`}
            placeholder="Buscar por matéria, data ou anotação..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className={`appearance-none bg-neutral-900 border border-neutral-800 rounded-xl pl-3 pr-8 py-2  text-white focus:outline-none focus:border-violet-600/20 transition-colors cursor-pointer`}
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
          >
            <option value="all">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {parseDate(`${m}-01`).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma sessão encontrada"
          description="Seu histórico de estudos está vazio ou não corresponde à sua busca atual."
          className="py-12"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const totalQ = s.questions_new + s.questions_review;
            const totalC = s.correct_new + s.correct_review;
            const hRate = hitRate(totalC, totalQ);

            return (
              <div
                key={s.id}
                className={`group bg-neutral-900/50 border border-neutral-800 hover:border-violet-600/30 hover:bg-neutral-900 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-violet-500/5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    {/* Linha Superior: Matéria e Data */}
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-black text-white truncate">
                        {s.subject}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] font-black uppercase text-violet-500 bg-violet-600/10 border border-violet-600/20 px-2.5 py-1 rounded-full shadow-sm`}
                      >
                        {parseDate(s.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>

                    {/* Linha de Métricas: Badges estilizados */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                        <Clock
                          className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-violet-500 transition-colors`}
                        />
                        <span className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">
                          {formatHours(s.hours)}
                        </span>
                      </div>

                      {s.focus_score && s.focus_score > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                          <StudyStars score={s.focus_score} />
                        </div>
                      )}

                      {totalQ > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs font-bold text-neutral-300">
                            {totalQ} questões
                          </div>
                          <div
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all ${
                              hRate >= 70
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : hRate >= 50
                                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            {hRate}% acerto
                          </div>
                        </div>
                      )}

                      {s.pages_read && s.pages_read > 0 ? (
                        <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs font-bold text-neutral-300">
                          {s.pages_read} páginas
                        </div>
                      ) : null}

                      {s.custom_metric_label && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs font-bold text-neutral-300">
                          {s.custom_metric_value} {s.custom_metric_label}
                        </div>
                      )}
                    </div>

                    {/* Nota */}
                    {s.note && (
                      <p className="text-xs text-neutral-500 leading-relaxed italic border-l-2 border-neutral-800 pl-3 py-0.5 mt-1 border-dashed">
                        {s.note}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0 bg-neutral-800/20 p-1 rounded-xl border border-neutral-800/50">
                    <ToolTip content="Editar sessão">
                      <button
                        type="button"
                        onClick={() => onEdit(s)}
                        className={`p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-violet-600 transition-all cursor-pointer shadow-sm active:scale-95`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir sessão">
                      <button
                        type="button"
                        onClick={() => s.id !== undefined && onDelete(s.id)}
                        className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-red-600 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ToolTip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
