"use client";

import { FileText, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NoteCreateModalProps {
  onAdd: (title: string, content: string) => void;
  onClose: () => void;
}

/**
 * Interface de Ingestão: Criação de novas notas com suporte a markdown
 */
export function NoteCreateModal({ onAdd, onClose }: NoteCreateModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
  };

  const inputStyle =
    "bg-neutral-900 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold focus:border-orange-500/50 shadow-inner";
  const labelStyle = "text-[10px] font-black uppercase text-neutral-600 ml-1";

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Encerrar"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase leading-none">
                Manifestação de Nota
              </h2>
              <p className="text-[10px] font-black text-neutral-600 uppercase mt-1.5">
                Ingestão de Dados ao Bloco Local
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-10 h-10 p-0 rounded-xl hover:bg-neutral-900 text-neutral-600 hover:text-white transition-all border-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Formulário Interativo */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="note-title" className={labelStyle}>
              Designação do Arquivo
            </Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resumo de Estudo, Prototipação de Ideias..."
              className={inputStyle}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="note-content" className={labelStyle}>
              Corpo de Informação
            </Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Sua consciência digital começa aqui..."
              className="bg-neutral-900 border-neutral-800 rounded-2xl min-h-[200px] resize-none pt-4 font-bold text-neutral-400 focus:border-orange-500/30 placeholder:text-neutral-800 transition-all shadow-inner leading-relaxed"
              required
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 py-6 rounded-2xl text-[10px] font-black uppercase text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all border-none"
            >
              Abortar
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="flex-2 py-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-[10px] uppercase shadow-xl shadow-orange-500/10 active:scale-[0.98] transition-all border-none flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Integrar Nota ao Sistema
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
