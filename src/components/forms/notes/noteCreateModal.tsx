"use client";

import { FileText, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { Textarea } from "@/components/ui/textarea";

interface NoteCreateModalProps {
  onAdd: (title: string, content: string) => void;
  onClose: () => void;
}

/**
 * Modal para criação de novas notas com suporte a Markdown.
 * Utiliza Portals para garantir que fique acima de qualquer elemento do grid.
 */
export function NoteCreateModal({ onAdd, onClose }: NoteCreateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
  };

  const ic =
    "bg-neutral-900 border-neutral-800 text-sm font-medium focus:border-orange-500/50 transition-all placeholder:text-neutral-700";
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-create-title"
    >
      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2
                id="note-create-title"
                className="text-lg font-bold text-white leading-none"
              >
                Nova Nota
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Captura rápida de conhecimento
              </p>
            </div>
          </div>
          <ToolTip content="Fechar">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </ToolTip>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="ncm-title" className={lc}>
                Título da Nota
              </Label>
              <Input
                id="ncm-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Resumo de estudo, ideias de projeto..."
                className={`${ic} h-12 rounded-xl px-4`}
                autoFocus
                required
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="ncm-content" className={lc}>
                Conteúdo{" "}
                <span className="text-neutral-600 font-normal">(Markdown)</span>
              </Label>
              <Textarea
                id="ncm-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva livremente aqui..."
                className={`${ic} rounded-xl min-h-[200px] resize-none leading-relaxed p-4`}
                required
              />
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/40 hover:border-orange-400 text-orange-300 hover:text-orange-200 text-sm font-black transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> Criar nota
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
