"use client";

import { FileText, Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NoteCreateModalProps {
  onAdd: (title: string, content: string) => void;
  onClose: () => void;
}

/**
 * Modal para criação de novas notas com suporte a Markdown
 */
export function NoteCreateModal({ onAdd, onClose }: NoteCreateModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
  };

  const ic =
    "bg-neutral-900 border-neutral-800 text-sm font-medium focus:border-orange-500/50 transition-all placeholder:text-neutral-600";
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-create-title"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-[28px] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 id="note-create-title" className="text-base font-bold text-white leading-none">
                Nova nota
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Captura de conhecimento</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="ncm-title" className={lc}>
                Título
              </Label>
              <Input
                id="ncm-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Resumo de estudo, ideias de projeto..."
                className={`${ic} h-11 rounded-xl`}
                autoFocus
                required
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-1.5">
              <Label htmlFor="ncm-content" className={lc}>
                Conteúdo{" "}
                <span className="text-neutral-600 font-normal">(Markdown)</span>
              </Label>
              <Textarea
                id="ncm-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva livremente aqui..."
                className={`${ic} rounded-xl min-h-[160px] resize-none leading-relaxed pt-3`}
                required
              />
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/40 hover:border-orange-400 text-orange-300 hover:text-orange-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Criar nota
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
              >
                Agora não
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
