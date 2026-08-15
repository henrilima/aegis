"use client";

import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import {
  Calendar,
  Ghost,
  Pencil,
  Plus,
  Search,
  Smile,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { HistoryCard } from "@/components/ui/HistoryCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { SleepDream } from "../types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const _itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    },
  },
};

/**
 * Componente do Diário de Sonhos com formulário de relato e linha do tempo de sonhos.
 */
export function SleepDreamTab() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const { now: simulatedNow } = useTime();

  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);

  const [dreams, setDreams] = useState<SleepDream[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dreamType, setDreamType] = useState("comum");
  const [date, setDate] = useState(() => {
    const y = simulatedNow.getFullYear();
    const m = String(simulatedNow.getMonth() + 1).padStart(2, "0");
    const d = String(simulatedNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [editingDreamDate, setEditingDreamDate] = useState<string | null>(null);
  const [deletingDreamDate, setDeletingDreamDate] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Filtros do diário
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchDreams = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await invoke<SleepDream[]>("sleep_list_dreams", {
        userId: uid,
      });
      setDreams(list);
    } catch (e) {
      console.error("Erro ao carregar sonhos:", e);
    }
  }, [uid]);

  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  // Carrega relato de sonho existente para a data selecionada
  useEffect(() => {
    if (!uid || !date) return;
    invoke<SleepDream | null>("sleep_get_dream", { userId: uid, date })
      .then((res) => {
        if (res) {
          setTitle(res.title || "");
          setContent(res.content);
          setDreamType(res.dreamType);
        } else if (!editingDreamDate) {
          setTitle("");
          setContent("");
          setDreamType("comum");
        }
      })
      .catch((e) => console.error(e));
  }, [uid, date, editingDreamDate]);

  const handleEdit = (dream: SleepDream) => {
    setDate(dream.date);
    setTitle(dream.title || "");
    setContent(dream.content);
    setDreamType(dream.dreamType);
    setEditingDreamDate(dream.date);
  };

  const cancelEdit = () => {
    setEditingDreamDate(null);
    setTitle("");
    setContent("");
    setDreamType("comum");
  };

  const handleDelete = async (targetDate: string) => {
    if (!uid) return;
    try {
      await invoke("sleep_delete_dream", { userId: uid, date: targetDate });
      toast.success("Sonho excluído do diário!");
      if (date === targetDate) {
        setTitle("");
        setContent("");
        setDreamType("comum");
        setEditingDreamDate(null);
      }
      fetchDreams();
    } catch {
      toast.error("Erro ao excluir relato de sonho.");
    } finally {
      setDeletingDreamDate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !uid || !date) return;
    setLoading(true);
    try {
      await invoke("sleep_upsert_dream", {
        dream: {
          userId: uid,
          date,
          title: title.trim() || undefined,
          content: content.trim(),
          dreamType,
        },
      });
      toast.success(
        editingDreamDate
          ? "Sonho atualizado no diário!"
          : "Sonho registrado no diário!",
      );
      setEditingDreamDate(null);
      setTitle("");
      setContent("");
      fetchDreams();
    } catch {
      toast.error("Erro ao salvar relato de sonho.");
    } finally {
      setLoading(false);
    }
  };

  const getDreamIcon = (type: string) => {
    switch (type) {
      case "lúcido":
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case "pesadelo":
        return <Ghost className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Smile className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getDreamTypeLabel = (type: string) => {
    switch (type) {
      case "lúcido":
        return "Lúcido";
      case "pesadelo":
        return "Pesadelo";
      default:
        return "Comum";
    }
  };

  const filteredDreams = useMemo(() => {
    return dreams.filter((d) => {
      const searchLower = search.toLowerCase().trim();
      const formattedDate = d.date.split("-").reverse().join("/");
      const matchesSearch =
        !searchLower ||
        d.title?.toLowerCase().includes(searchLower) ||
        d.content.toLowerCase().includes(searchLower) ||
        formattedDate.includes(searchLower) ||
        d.date.includes(searchLower);

      const matchesType = filterType === "all" || d.dreamType === filterType;

      return matchesSearch && matchesType;
    });
  }, [dreams, search, filterType]);

  const inputStyle =
    "bg-card border-border h-10 rounded-xl text-xs font-medium focus:border-blue-500/40 transition-all text-foreground placeholder:text-muted-foreground/50";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* Modal de confirmação de exclusão */}
      {deletingDreamDate && (
        <ConfirmModal
          title="Excluir relato de sonho"
          description="Tem certeza que deseja apagar este relato de sonho? Esta ação não pode ser desfeita."
          confirmLabel="Sim, excluir relato"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => handleDelete(deletingDreamDate)}
          onCancel={() => setDeletingDreamDate(null)}
        />
      )}

      {/* Formulário de Registro */}
      <div className="lg:col-span-4 bg-card/60 border border-border rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground">
            {editingDreamDate ? "Editar Sonho" : "Relatar Sonho"}
          </h3>
          {editingDreamDate && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className={lc}>Data do Sonho</Label>
            <Input
              type="date"
              className={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={lc}>Título do Sonho (opcional)</Label>
            <Input
              type="text"
              className={inputStyle}
              placeholder="Ex: Voo noturno, Cidade futurista..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={lc}>Tipo de Sonho</Label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-background border border-border rounded-xl">
              {["comum", "lúcido", "pesadelo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDreamType(type)}
                  className={cn(
                    "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border capitalize flex items-center justify-center gap-1",
                    dreamType === type
                      ? type === "pesadelo"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        : type === "lúcido"
                          ? "bg-violet-500/10 border-violet-500/20 text-violet-500"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {getDreamIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={lc}>O que você lembra do sonho?</Label>
            <Textarea
              className="bg-card border-border rounded-xl min-h-32 resize-none pt-3 text-xs font-medium text-foreground focus:border-blue-600/30 placeholder:text-muted-foreground/50 transition-all leading-relaxed"
              placeholder="Descreva detalhes, pessoas, sentimentos, cores..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className={cn(
              "w-full py-2.5 rounded-xl text-xs font-bold text-slate-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
              theme.solid,
              theme.solidHover,
            )}
          >
            {editingDreamDate ? (
              <Pencil className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            {editingDreamDate ? "Salvar Alterações" : "Registrar Sonho"}
          </button>
        </form>
      </div>

      {/* Histórico / Linha do Tempo */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className={cn(
                "w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
                theme.borderHover.replace("hover:", "focus:"),
              )}
              placeholder="Buscar relatos ou títulos de sonhos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-card border-border rounded-xl h-9 text-xs w-full sm:w-44 shrink-0 text-foreground">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-xs">
                Todos os tipos
              </SelectItem>
              <SelectItem value="comum" className="text-xs">
                Comum (😊)
              </SelectItem>
              <SelectItem value="lúcido" className="text-xs">
                Lúcido (✨)
              </SelectItem>
              <SelectItem value="pesadelo" className="text-xs">
                Pesadelo (👻)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Relatos */}
        <div className="flex flex-col gap-3">
          {filteredDreams.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {filteredDreams.map((d) => (
                <HistoryCard
                  key={d.id || d.date}
                  color={
                    d.dreamType === "pesadelo"
                      ? "rose"
                      : d.dreamType === "lúcido"
                        ? "violet"
                        : "emerald"
                  }
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      {d.title && (
                        <h4 className="text-xs font-bold text-foreground/90 truncate max-w-64">
                          {d.title}
                        </h4>
                      )}

                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0",
                          d.dreamType === "pesadelo"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                            : d.dreamType === "lúcido"
                              ? "bg-violet-500/10 border-violet-500/20 text-violet-500"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                        )}
                      >
                        {getDreamIcon(d.dreamType)}
                        {getDreamTypeLabel(d.dreamType)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{d.date.split("-").reverse().join("/")}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <ToolTip content="Editar relato">
                          <button
                            type="button"
                            onClick={() => handleEdit(d)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </ToolTip>
                        <ToolTip content="Excluir relato">
                          <button
                            type="button"
                            onClick={() => setDeletingDreamDate(d.date)}
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ToolTip>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium bg-background/40 border border-border/30 rounded-lg p-3">
                    {d.content}
                  </p>
                </HistoryCard>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Nenhum sonho registrado"
              description="Seu diário de sonhos está vazio ou não corresponde ao filtro atual."
              className="py-12 bg-card/40 border border-border rounded-xl"
            />
          )}
        </div>
      </div>
    </div>
  );
}
