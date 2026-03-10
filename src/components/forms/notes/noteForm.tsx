"use client";

import { Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NoteFormProps {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  onAdd: () => void;
}

/**
 * Formulário simples para criação rápida de notas
 */
export function NoteForm({
  title,
  setTitle,
  content,
  setContent,
  onAdd,
}: NoteFormProps) {
  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Seção de Cabeçalho Visual */}
      <div className="flex items-center gap-3 pb-2 border-b border-neutral-800/50">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <StickyNote className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="font-black text-white uppercase text-xs">
            Memória Digital
          </h3>
          <p className="text-[9px] font-black text-neutral-600 uppercase mt-0.5">
            Captura de Conhecimento
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Campo de Título */}
        <div className="space-y-2">
          <Label
            htmlFor="note-title"
            className="text-[10px] font-black uppercase text-neutral-500 ml-1"
          >
            Identificação da Nota
          </Label>
          <Input
            id="note-title"
            placeholder="Ex: Resumo de Aula, Ideias de Projeto..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-900 border-neutral-800 h-12 rounded-2xl font-bold focus:border-amber-500/50 transition-all placeholder:text-neutral-700 shadow-inner"
          />
        </div>

        {/* Campo de Conteúdo (Markdown compatível) */}
        <div className="space-y-2">
          <Label
            htmlFor="note-content"
            className="text-[10px] font-black uppercase text-neutral-500 ml-1"
          >
            Fluxo de Pensamento (Markdown)
          </Label>
          <Textarea
            id="note-content"
            placeholder="Escreva livremente aqui..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-neutral-900 border-neutral-800 min-h-[180px] rounded-2xl resize-none leading-relaxed font-medium focus:border-amber-500/50 transition-all placeholder:text-neutral-700 shadow-inner"
          />
        </div>

        {/* Botão de Ação Primária */}
        <Button
          type="button"
          onClick={onAdd}
          className="w-full py-7 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase transition-all shadow-xl shadow-amber-500/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border-none"
        >
          <Plus className="w-4 h-4" /> Consolidar Registro
        </Button>
      </div>
    </div>
  );
}
