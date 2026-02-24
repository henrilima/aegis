"use client";

import { FileText, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NoteCreateModalProps {
  onAdd: (title: string, content: string) => void;
  onClose: () => void;
}

export function NoteCreateModal({ onAdd, onClose }: NoteCreateModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valida se os campos não estão vazios antes de enviar
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/50 bg-linear-to-br from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Nova Nota</h2>
              <p className="text-[10px] font-bold text-neutral-500 uppercase ">
                Dash Notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Título
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião importante"
              className="bg-neutral-900 border-neutral-800 h-12 text-sm font-bold placeholder:text-neutral-700"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Conteúdo
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva algo brilhante..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-sm text-white min-h-[160px] outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-700 resize-none font-medium"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black h-12 rounded-2xl shadow-lg shadow-orange-500/10 cursor-pointer text-xs uppercase  transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 mr-2" /> Criar Nota
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-full text-neutral-500 hover:text-white hover:bg-neutral-900 h-12 rounded-2xl cursor-pointer text-xs font-bold"
            >
              Agora não
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
