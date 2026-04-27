"use client";
import { open } from "@tauri-apps/plugin-shell";
import { FileText, Maximize2, Minimize2, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Note } from "@/components/pages/notes/types";
import { Input } from "@/components/ui/input";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface NoteExpandModalProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

export function NoteExpandModal({
  note,
  onSave,
  onClose,
}: NoteExpandModalProps) {
  useLockBodyScroll();
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    onSave({ ...note, title: title.trim(), content: content.trim() });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-background border border-border flex flex-col overflow-hidden transition-all duration-500 relative ${isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-6xl h-[90vh] rounded-xl"}`}
      >
        {/* Barra de Ferramentas Superior */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-900 bg-background/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 flex-1 mr-4">
            <div className="p-2.5 bg-card rounded-xl border border-border hidden sm:block">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none text-lg font-bold outline-none text-foreground placeholder-neutral-800 p-0 h-auto focus-visible:ring-0 -ml-0.5"
                  placeholder="Título da nota..."
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold truncate text-foreground">
                  {title}
                </h2>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Save className="w-4 h-4" /> Salvar alterações
              </button>
            ) : (
              <ToolTip content="Editar">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
            <ToolTip
              content={isFullscreen ? "Sair da tela cheia" : "Maximizar"}
            >
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </ToolTip>
            <ToolTip content="Fechar">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-accent/50 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>
        {/* Área de Visualização/Edição */}
        <div
          className={`flex-1 overflow-hidden flex ${isEditing ? "flex-col lg:flex-row" : "flex-col"}`}
        >
          {isEditing ? (
            <>
              {/* Editor de Texto */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 h-full w-full lg:w-1/2 p-8 lg:p-12 bg-background resize-none outline-none text-muted-foreground font-medium  leading-relaxed border-b lg:border-b-0 lg:border-r border-neutral-900 custom-scrollbar "
                placeholder="Escreva sua nota aqui..."
              />
              {/* Preview */}
              <div className="flex-1 h-full w-full lg:w-1/2 overflow-auto p-8 lg:p-12 custom-scrollbar bg-card/10">
                <div className="markdown-preview max-w-none prose prose-invert prose-teal">
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
                          className="text-teal-600 dark:text-teal-400 hover:text-teal-300 underline cursor-pointer font-bold inline-block border-none bg-transparent p-0"
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
            /* Modo Leitura */
            <div className="flex-1 overflow-auto p-8 lg:p-16 custom-scrollbar ">
              <div className="max-w-4xl mx-auto w-full">
                <div className="markdown-preview prose prose-invert prose-teal lg:prose-xl max-w-none">
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
                          className="text-teal-600 dark:text-teal-400 hover:text-teal-300 underline cursor-pointer font-bold transition-colors inline-block border-none bg-transparent p-0"
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
