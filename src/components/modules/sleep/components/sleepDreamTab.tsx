"use client";

import { invoke } from "@tauri-apps/api/core";
import { Calendar, Ghost, Plus, Smile, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { SleepDream } from "../types";

export function SleepDreamTab() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const { now: simulatedNow } = useTime();

  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);

  const [dreams, setDreams] = useState<SleepDream[]>([]);
  const [content, setContent] = useState("");
  const [dreamType, setDreamType] = useState("comum");
  const [date, setDate] = useState(() => {
    const y = simulatedNow.getFullYear();
    const m = String(simulatedNow.getMonth() + 1).padStart(2, "0");
    const d = String(simulatedNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [loading, setLoading] = useState(false);

  const fetchDreams = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await invoke<SleepDream[]>("sono_list_dreams", {
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

  // Load existing dream for selected date
  useEffect(() => {
    if (!uid || !date) return;
    invoke<SleepDream | null>("sono_get_dream", { userId: uid, date })
      .then((res) => {
        if (res) {
          setContent(res.content);
          setDreamType(res.dreamType);
        } else {
          setContent("");
          setDreamType("comum");
        }
      })
      .catch((e) => console.error(e));
  }, [uid, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !uid || !date) return;
    setLoading(true);
    try {
      await invoke("sono_upsert_dream", {
        dream: {
          userId: uid,
          date,
          content: content.trim(),
          dreamType,
        },
      });
      toast.success("Sonho registrado no diário!");
      fetchDreams();
    } catch {
      toast.error("Erro ao registrar sonho.");
    } finally {
      setLoading(false);
    }
  };

  const getDreamIcon = (type: string) => {
    switch (type) {
      case "lúcido":
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      case "pesadelo":
        return <Ghost className="w-4 h-4 text-rose-400" />;
      default:
        return <Smile className="w-4 h-4 text-emerald-400" />;
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

  const inputStyle =
    "bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-blue-500/40 transition-all placeholder:text-muted-foreground/50";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full font-medium">
      {/* Formulário de Registro */}
      <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 flex flex-col gap-5 shadow-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-sm text-foreground">Relatar Sonho</h3>
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
            <Label className={lc}>Tipo de Sonho</Label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-background border border-border rounded-xl">
              {["comum", "lúcido", "pesadelo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDreamType(type)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border capitalize",
                    dreamType === type
                      ? type === "pesadelo"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                        : type === "lúcido"
                          ? "bg-violet-500/10 border-violet-500/20 text-violet-500"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={lc}>O que você lembra do sonho?</Label>
            <Textarea
              className="bg-card border-border rounded-xl min-h-[140px] resize-none pt-4 text-sm font-medium focus:border-blue-600/30 placeholder:text-muted-foreground/50 transition-all"
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
              "w-full py-3 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
              theme.solid,
              theme.solidHover,
            )}
          >
            <Plus className="w-4 h-4" /> Registrar Sonho
          </button>
        </form>
      </div>

      {/* Histórico / Linha do Tempo */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-sm text-foreground">
            Diário de Sonhos
          </h3>
        </div>

        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {dreams.length > 0 ? (
            dreams.map((d) => (
              <div
                key={d.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 group relative hover:border-sky-500/20 transition-all"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    {getDreamIcon(d.dreamType)}
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        d.dreamType === "pesadelo"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          : d.dreamType === "lúcido"
                            ? "bg-violet-500/10 border-violet-500/20 text-violet-500"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                      )}
                    >
                      {getDreamTypeLabel(d.dreamType)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/60">
                    {d.date.split("-").reverse().join("/")}
                  </span>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                  {d.content}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-card border border-border rounded-xl">
              <p className="text-xs text-neutral-600 font-bold">
                Sem Sonhos Registrados
              </p>
              <p className="text-[10px] text-neutral-600 font-medium max-w-[220px] mt-1">
                Relate seu primeiro sonho utilizando o formulário ao lado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
