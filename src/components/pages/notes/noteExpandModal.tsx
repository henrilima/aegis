"use client";

import { open } from "@tauri-apps/plugin-shell";
import { Maximize2, Minimize2, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Note } from "./types";

interface NoteExpandModalProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

/**
 * Interface de Análise e Edição: Visualização em Markdown com modo tela cheia
 */
export function NoteExpandModal({
  note,
  onSave,
  onClose,
}: NoteExpandModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    onSave({
      ...note,
      title: title.trim(),
      content: content.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <button
        type="button"
        aria-label="Encerrar"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />
      <div
        className={`bg-neutral-950 border border-neutral-800 flex flex-col overflow-hidden transition-all duration-500 relative ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-6xl h-[90vh] rounded-[40px]"
        }`}
      >
        {/* Barra de Ferramentas Superior */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-xl z-20">
          <div className="flex-1 mr-8">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none text-2xl font-black outline-none text-white placeholder-neutral-800 p-0 h-auto focus-visible:ring-0 shadow-none uppercase"
                placeholder="Título da nota corporativa..."
              />
            ) : (
              <h2 className="text-2xl font-black truncate text-neutral-200 uppercase">
                {title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="h-12 px-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-black text-[10px] uppercase transition-all hover:bg-orange-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" /> Consolidar Alterações
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-orange-400 hover:bg-neutral-800 transition-all flex items-center justify-center cursor-pointer"
                title="Habilitar Edição"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all flex items-center justify-center cursor-pointer"
              title={
                isFullscreen ? "Sair da Tela Cheia" : "Maximizar Interface"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-all flex items-center justify-center cursor-pointer"
              title="Encerrar Visualização"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área de Visualização/Edição */}
        <div
          className={`flex-1 overflow-hidden flex ${isEditing ? "flex-col lg:flex-row" : "flex-col"}`}
        >
          {isEditing ? (
            <>
              {/* Editor de Texto (Sintaxe) */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 h-full w-full lg:w-1/2 p-10 bg-neutral-950 resize-none outline-none text-neutral-400 font-mono text-sm leading-relaxed border-b lg:border-b-0 lg:border-r border-neutral-900 custom-scrollbar"
                placeholder="Aperte o fluxo de consciência digital aqui... (Markdown Habilitado)"
              />
              {/* Preview em Tempo Real */}
              <div className="flex-1 h-full w-full lg:w-1/2 overflow-auto p-10 custom-scrollbar bg-neutral-900/10">
                <div className="markdown-preview max-w-none prose prose-invert prose-orange">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      a: ({ node, ...props }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (props.href) open(props.href);
                          }}
                          className="text-orange-400 hover:text-orange-300 underline cursor-pointer font-bold inline-block border-none bg-transparent p-0"
                        >
                          {props.children}
                        </button>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          ) : (
            /* Modo Leitura Exclusiva */
            <div className="flex-1 overflow-auto p-10 lg:p-16 custom-scrollbar bg-neutral-900/20">
              <div className="max-w-4xl mx-auto w-full">
                <div className="markdown-preview prose prose-invert prose-orange lg:prose-xl max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      a: ({ node, ...props }) => (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (props.href) open(props.href);
                          }}
                          className="text-orange-400 hover:text-orange-300 underline cursor-pointer font-bold transition-colors inline-block border-none bg-transparent p-0"
                        >
                          {props.children}
                        </button>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
