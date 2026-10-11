"use client";

import {
  BookLock,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Note } from "../types";

interface DiaryJournalViewProps {
  notes: Note[];
  onNoteClick: (note: Note, edit?: boolean) => void;
  onCreateEntry: () => void;
  onDeleteNote: (id: number) => void;
}

// Tipo para as visualizações da aba de diário
type ViewMode = "book" | "grid";

export function DiaryJournalView({
  notes,
  onNoteClick,
  onCreateEntry,
  onDeleteNote,
}: DiaryJournalViewProps) {
  const _theme = getColorTheme(getModuleColor("notes"));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("book");

  // Estado da semana atual selecionada (inicia com a data de hoje)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Proteção contra cliques de navegação imediatos após confirmação via teclado
  const handleProtectedNoteClick = (note: Note, edit = false) => {
    if (typeof window !== "undefined") {
      const lastConfirmed = (window as unknown as Record<string, unknown>)
        .__AEGIS_JUST_CONFIRMED__ as number | undefined;
      if (lastConfirmed && Date.now() - lastConfirmed < 500) {
        return;
      }
    }
    onNoteClick(note, edit);
  };

  // Filtra apenas as notas marcadas como diário
  const diaryNotes = useMemo(() => {
    return notes.filter((n) => n.isDiary);
  }, [notes]);

  // Calcula os 7 dias da semana com base no offset da semana
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Segunda...
    // Ajusta para Segunda ser o primeiro dia da semana (0 = Segunda, 6 = Domingo)
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + currentWeekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const dayName = d.toLocaleDateString("pt-BR", { weekday: "short" });
      const capitalizedDay =
        dayName.charAt(0).toUpperCase() + dayName.slice(1).replace(".", "");

      // Verifica se há relatos neste dia
      const hasEntries = diaryNotes.some((n) => {
        const noteDate = new Date(n.createdAt);
        if (Number.isNaN(noteDate.getTime())) return false;
        const noteIso = `${noteDate.getFullYear()}-${String(noteDate.getMonth() + 1).padStart(2, "0")}-${String(noteDate.getDate()).padStart(2, "0")}`;
        return noteIso === isoDate;
      });

      days.push({
        dateObj: d,
        isoDate,
        dayName: capitalizedDay,
        dayNumber: d.getDate(),
        isToday:
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear(),
        hasEntries,
      });
    }
    return days;
  }, [currentWeekOffset, diaryNotes]);

  // Extrai meses disponíveis para filtro
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    diaryNotes.forEach((n) => {
      const d = new Date(n.createdAt);
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthSet.add(key);
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [diaryNotes]);

  // Filtra notas por busca, mês e dia da semana selecionado
  const filteredNotes = useMemo(() => {
    return diaryNotes.filter((n) => {
      const d = new Date(n.createdAt);
      if (Number.isNaN(d.getTime())) return false;

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const matchesMonth =
        selectedMonth === "all" || monthKey === selectedMonth;

      const matchesDay = !selectedDayDate || isoDate === selectedDayDate;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q);

      return matchesMonth && matchesDay && matchesSearch;
    });
  }, [diaryNotes, selectedMonth, selectedDayDate, searchQuery]);

  // Agrupa notas filtradas por Mês/Ano para seções de leitura
  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: Note[] } = {};

    filteredNotes.forEach((n) => {
      const d = new Date(n.createdAt);
      const label = !Number.isNaN(d.getTime())
        ? d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        : "Outras entradas";

      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

      if (!groups[capitalizedLabel]) {
        groups[capitalizedLabel] = [];
      }
      groups[capitalizedLabel].push(n);
    });

    for (const key in groups) {
      groups[key].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return groups;
  }, [filteredNotes]);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Banner de Cabeçalho estilo Livro de Diário Protegido */}
      <div className="p-5 rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-none">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
            <BookLock className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Diário Pessoal
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> AES-256 Criptografado
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Relatos organizados por dias e datas. Todo o conteúdo é
              criptografado localmente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateEntry}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer shrink-0 flex items-center gap-2 shadow-none"
        >
          <Plus className="w-4 h-4" />
          <span>Escrever relato de hoje</span>
        </button>
      </div>

      {/* Calendário Semanal com Navegação */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">
              Calendário semanal
            </h4>
            {selectedDayDate && (
              <button
                type="button"
                onClick={() => setSelectedDayDate(null)}
                className="text-[10px] font-medium text-primary hover:underline ml-2"
              >
                Limpar filtro de dia
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {currentWeekOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentWeekOffset(0);
                  setSelectedDayDate(null);
                }}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors mr-1"
              >
                Hoje
              </button>
            )}
            <ToolTip content="Semana anterior">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </ToolTip>
            <ToolTip content="Próxima semana">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>

        {/* Faixa dos dias da semana */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
          {weekDays.map((day) => {
            const isSelected = selectedDayDate === day.isoDate;

            return (
              <button
                key={day.isoDate}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedDayDate(null);
                  } else {
                    setSelectedDayDate(day.isoDate);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer select-none gap-1",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : day.isToday
                      ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                      : "bg-card/60 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <span className="text-[10px] font-medium leading-none">
                  {day.dayName}
                </span>
                <span className="text-xs font-bold leading-none">
                  {day.dayNumber}
                </span>
                {/* Indicador de relatos salvos no dia */}
                <span className="h-1.5 flex items-center justify-center">
                  {day.hasEntries && (
                    <span
                      className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros, Busca e Alternância de Visualização */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar no diário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {availableMonths.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer shrink-0"
            >
              <option value="all">Todos os meses</option>
              {availableMonths.map((mKey) => {
                const [y, m] = mKey.split("-");
                const dateObj = new Date(Number(y), Number(m) - 1, 1);
                const label = dateObj.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <option key={mKey} value={mKey}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Alternador de Layout + Total de Páginas */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-1 p-0.5 rounded-xl border border-border/60 bg-card/60">
            <ToolTip content="Visão em livro">
              <button
                type="button"
                onClick={() => setViewMode("book")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer",
                  viewMode === "book"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Livro</span>
              </button>
            </ToolTip>

            <ToolTip content="Visão em blocos">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Blocos</span>
              </button>
            </ToolTip>
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Total de{" "}
            <strong className="text-foreground">{diaryNotes.length}</strong>{" "}
            {diaryNotes.length === 1 ? "página escrita" : "páginas escritas"}
          </div>
        </div>
      </div>

      {/* Exibição dos Relatos Diários */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center gap-3 bg-card/20">
          <BookLock className="w-10 h-10 text-muted-foreground/40" />
          <div className="flex flex-col gap-1 max-w-xs">
            <h4 className="text-sm font-bold text-foreground">
              Nenhuma página encontrada
            </h4>
            <p className="text-xs text-muted-foreground">
              {searchQuery || selectedMonth !== "all" || selectedDayDate
                ? "Nenhum relato corresponde aos filtros selecionados."
                : "Sua história começa aqui. Faça seu primeiro relato diário."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateEntry}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            <Plus className="w-3.5 h-3.5" /> Escrever primeiro relato
          </button>
        </div>
      ) : viewMode === "book" ? (
        /* VISÃO EM LIVRO (PÁGINAS DUPLAS ORGANIZADAS CHRONOLOGICAMENTE) */
        <div className="flex flex-col gap-8">
          {Object.entries(groupedByMonth).map(([monthLabel, entryNotes]) => (
            <div key={monthLabel} className="flex flex-col gap-4">
              {/* Cabeçalho da Seção de Mês */}
              <div className="flex items-center gap-3 border-b border-border/50 pb-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {monthLabel}
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                  {entryNotes.length}{" "}
                  {entryNotes.length === 1 ? "relato" : "relatos"}
                </span>
              </div>

              {/* Lista em Formato de Livro Aberto */}
              <div className="flex flex-col gap-6">
                {entryNotes.map((note) => {
                  const dateObj = new Date(note.createdAt);
                  const isValidDate = !Number.isNaN(dateObj.getTime());

                  const dayName = isValidDate
                    ? dateObj.toLocaleDateString("pt-BR", { weekday: "long" })
                    : "";
                  const capitalizedDayName = dayName
                    ? dayName.charAt(0).toUpperCase() + dayName.slice(1)
                    : "";

                  const formattedDate = isValidDate
                    ? dateObj.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "";

                  const formattedTime = isValidDate
                    ? dateObj.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  const wordCount = note.content
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length;

                  return (
                    <div
                      key={note.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleProtectedNoteClick(note, false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleProtectedNoteClick(note, false);
                        }
                      }}
                      className="group relative rounded-2xl border border-border/70 bg-card/60 hover:bg-card/90 hover:border-primary/40 transition-all cursor-pointer flex flex-col md:flex-row overflow-hidden shadow-none backdrop-blur-xs"
                    >
                      {/* Lado Esquerdo do Livro: Data, Título e Metadados */}
                      <div className="md:w-1/3 p-5 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-primary">
                              {capitalizedDayName}
                            </span>
                            {formattedTime && (
                              <span className="text-[10px] font-semibold text-muted-foreground/80 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground/60" />
                                {formattedTime}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {note.title || "Página do diário"}
                          </h4>

                          <p className="text-[11px] font-medium text-muted-foreground/70">
                            {formattedDate}
                          </p>
                        </div>

                        {/* Metadados e ações */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/40 text-[10px] text-muted-foreground/70">
                          <span className="flex items-center gap-1 font-medium">
                            <Lock className="w-3 h-3 text-primary/80" />{" "}
                            Protegido
                          </span>
                          <span>{wordCount} palavras</span>

                          <div className="flex items-center gap-1">
                            <ToolTip content="Editar página">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProtectedNoteClick(note, true);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </ToolTip>
                            <ToolTip content="Excluir página">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (note.id) onDeleteNote(note.id);
                                }}
                                className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </ToolTip>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito do Livro: Conteúdo do Relato */}
                      <div className="md:w-2/3 p-5 flex flex-col justify-between gap-3">
                        <p className="text-xs text-foreground/90 leading-relaxed font-normal whitespace-pre-wrap line-clamp-6">
                          {note.content.trim() ||
                            "Sem conteúdo registrado nesta página..."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISÃO EM BLOCOS */
        <div className="flex flex-col gap-8">
          {Object.entries(groupedByMonth).map(([monthLabel, entryNotes]) => (
            <div key={monthLabel} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-border/50 pb-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {monthLabel}
                </h3>
                <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50 border border-border/40">
                  {entryNotes.length}{" "}
                  {entryNotes.length === 1 ? "relato" : "relatos"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entryNotes.map((note) => {
                  const dateObj = new Date(note.createdAt);
                  const isValidDate = !Number.isNaN(dateObj.getTime());

                  const dayName = isValidDate
                    ? dateObj.toLocaleDateString("pt-BR", { weekday: "long" })
                    : "";
                  const capitalizedDayName = dayName
                    ? dayName.charAt(0).toUpperCase() + dayName.slice(1)
                    : "";

                  const formattedDate = isValidDate
                    ? dateObj.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "";

                  const formattedTime = isValidDate
                    ? dateObj.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={note.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleProtectedNoteClick(note, false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleProtectedNoteClick(note, false);
                        }
                      }}
                      className="group relative p-5 rounded-2xl border border-border/70 bg-card/40 hover:bg-card/70 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-xs shadow-none"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-primary">
                            {capitalizedDayName}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {formattedTime && (
                            <span className="text-[10px] font-semibold text-muted-foreground/70 flex items-center gap-1 mr-1">
                              <Clock className="w-3 h-3 text-muted-foreground/50" />
                              {formattedTime}
                            </span>
                          )}

                          <ToolTip content="Editar página">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProtectedNoteClick(note, true);
                              }}
                              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </ToolTip>

                          <ToolTip content="Excluir página">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (note.id) onDeleteNote(note.id);
                              }}
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ToolTip>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1 min-h-24">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {note.title || "Página do diário"}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 font-normal whitespace-pre-wrap">
                          {note.content.trim() || "Sem conteúdo registrado..."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 pt-2 border-t border-border/30">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-primary/70" /> Protegido
                        </span>
                        <span>
                          {
                            note.content.trim().split(/\s+/).filter(Boolean)
                              .length
                          }{" "}
                          palavras
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
