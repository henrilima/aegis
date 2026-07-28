"use client";

import { Edit3, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/ModalShell";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { Textarea } from "@/components/ui/textarea";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { GlossaryWord } from "../types";

interface EditWordModalProps {
  word: GlossaryWord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: GlossaryWord) => Promise<void>;
}

export function EditWordModal({
  word,
  isOpen,
  onClose,
  onSave,
}: EditWordModalProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (word) {
      setTerm(word.word);
      setDefinition(word.definition);
      setPhonetic(word.phonetic || "");
    }
  }, [word]);

  if (!word || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...word,
        word: term.trim(),
        definition: definition.trim(),
        phonetic: phonetic.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-sky-500/40 transition-all placeholder:text-muted-foreground/50";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="md" zIndex="z-[300]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Edit3 className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Editar termo do glossário
            </h2>
            <p className="text-xs text-muted-foreground">
              Altere a palavra associada ou a definição
            </p>
          </div>
        </div>
        <ToolTip content="Fechar">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors text-muted-foreground cursor-pointer",
              theme.bgHover,
              theme.textDarkHover,
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </ToolTip>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className={lc}>Palavra / Termo associado</Label>
          <Input
            type="text"
            className={inputStyle}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex: Fatídico"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={lc}>Transcrição fonética (opcional)</Label>
          <Input
            type="text"
            className={inputStyle}
            value={phonetic}
            onChange={(e) => setPhonetic(e.target.value)}
            placeholder="Ex: /faˈti.dji.ku/"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={lc}>Definição / Significado</Label>
          <Textarea
            className="bg-card border-border rounded-xl min-h-27.5 resize-none pt-3 text-sm font-medium focus:border-sky-500/40 placeholder:text-muted-foreground/50 transition-all"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Descreva o significado ou a tradução associada..."
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 text-muted-foreground text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !term.trim() || !definition.trim()}
            className={cn(
              "px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2",
              theme.solid,
              theme.solidHover,
            )}
          >
            <Edit3 className="w-4 h-4" />
            Salvar alterações
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
