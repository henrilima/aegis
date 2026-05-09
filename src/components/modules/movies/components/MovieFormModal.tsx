"use client";

import {
  AlignLeft,
  Calendar,
  Film,
  Star,
  StarHalf,
  Tag,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Movie, MovieStatus } from "../types";

interface MovieFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie?: Partial<Movie>;
  onSave: (movie: Movie) => void;
}

const DEFAULT_FORM: Partial<Movie> = {
  title: "",
  director: "",
  year: undefined,
  status: "Watched",
  review: "",
  stars: 0,
  thumbnail: "",
  category: "Filme",
};

export function MovieFormModal({
  isOpen,
  onClose,
  movie,
  onSave,
}: MovieFormModalProps) {
  const theme = getColorTheme(getModuleColor("movies"));
  const [formData, setFormData] = useState<Partial<Movie>>(DEFAULT_FORM);

  useEffect(() => {
    if (isOpen) {
      setFormData(movie ? { ...DEFAULT_FORM, ...movie } : { ...DEFAULT_FORM });
    }
  }, [isOpen, movie]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const set = (field: keyof Movie, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const renderStarPicker = () => {
    const current = formData.stars ?? 0;
    return (
      <div className="flex gap-1 py-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const isFullActive = current >= n;
          const isHalfActive = current >= n - 0.5 && current < n;
          return (
            <div key={n} className="relative w-7 h-7 cursor-pointer group">
              {/* Full star background */}
              <Star
                className={cn(
                  "absolute inset-0 w-7 h-7 transition-all",
                  isFullActive
                    ? cn("fill-current", theme.text)
                    : "fill-transparent text-muted-foreground/20",
                )}
              />
              {/* Half star overlay (left half) */}
              {isHalfActive && (
                <StarHalf
                  className={cn(
                    "absolute inset-0 w-7 h-7 fill-current",
                    theme.text,
                  )}
                />
              )}
              {/* Left click zone → half star */}
              <button
                type="button"
                aria-label={`${n - 0.5} estrelas`}
                onClick={() => set("stars", current === n - 0.5 ? 0 : n - 0.5)}
                className="absolute left-0 top-0 w-1/2 h-full z-10 hover:opacity-80 transition-opacity"
              />
              {/* Right click zone → full star */}
              <button
                type="button"
                aria-label={`${n} estrelas`}
                onClick={() => set("stars", current === n ? 0 : n)}
                className="absolute right-0 top-0 w-1/2 h-full z-10 hover:opacity-80 transition-opacity"
              />
            </div>
          );
        })}
        <span className="ml-2 self-center text-xs text-muted-foreground font-bold">
          {current > 0 ? `${current} ★` : "Sem avaliação"}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  const inputClass = cn(
    "h-10 bg-card border-border text-sm font-medium placeholder:text-muted-foreground/40 rounded-xl transition-all",
    theme.borderHover
      .replace("hover:", "focus-visible:ring-1 focus-visible:ring-")
      .replace("hover:", "focus-visible:border-"),
  );
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Film className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {movie?.id ? "Editar Filme" : "Registrar Filme"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detalhes da obra
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Título e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Título</Label>
            <div className="relative">
              <Film className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                value={formData.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="Ex: O Poderoso Chefão"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Status</Label>
            <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/50">
              {(
                [
                  { id: "Watched", label: "Assistido" },
                  { id: "WantToWatch", label: "Quero Assistir" },
                ] as { id: MovieStatus; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("status", opt.id)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                    formData.status === opt.id
                      ? cn(theme.solid, "text-white")
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diretor e Ano */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>Diretor / Estúdio</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                value={formData.director ?? ""}
                onChange={(e) => set("director", e.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="Ex: Francis Ford Coppola"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Ano</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                type="number"
                value={formData.year ?? ""}
                onChange={(e) =>
                  set(
                    "year",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                className={cn(inputClass, "pl-9")}
                placeholder="Ex: 1972"
              />
            </div>
          </div>
        </div>

        {/* Poster e Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className={labelClass}>URL do Poster</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                value={formData.thumbnail ?? ""}
                onChange={(e) => set("thumbnail", e.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className={labelClass}>Categoria / Gênero</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                value={formData.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="Ex: Crime, Drama"
              />
            </div>
          </div>
        </div>

        {/* Avaliação (só se Assistido) */}
        {formData.status === "Watched" && (
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Avaliação - {formData.stars ?? 0}{" "}
              {(formData.stars ?? 0) === 1 ? "estrela" : "estrelas"}
            </Label>
            {renderStarPicker()}
          </div>
        )}

        {/* Resenha */}
        <div className="space-y-1.5">
          <Label className={labelClass}>Resenha / Comentários</Label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground/40" />
            <textarea
              value={formData.review ?? ""}
              onChange={(e) => set("review", e.target.value)}
              className={cn(
                "w-full rounded-xl bg-card border border-border text-sm font-medium p-3 pl-9 min-h-[100px] resize-none outline-none transition-all text-foreground placeholder:text-muted-foreground/40",
                theme.borderHover
                  .replace("hover:", "focus:border-")
                  .replace("hover:", "focus:ring-1 focus:ring-")
                  .replace("500", "500/50")
                  .replace("500", "500/30"),
              )}
              placeholder="Escreva sua opinião sobre o filme..."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 transition-all cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              ...formData,
              title: formData.title || "",
              status: formData.status || "Watched",
              stars: formData.stars ?? 0,
              category: formData.category || "Filme",
              userId: formData.userId || "",
            } as Movie)
          }
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer",
            theme.solid,
            theme.solidHover,
          )}
        >
          {movie?.id ? "Atualizar" : "Salvar no Catálogo"}
        </button>
      </div>
    </ModalShell>
  );
}
