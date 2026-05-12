import { FileText, Pencil, Save, X } from "lucide-react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { resolveColor } from "@/colors.config";
import { MarkdownToolbar } from "@/components/modules/notes/components/MarkdownToolbar";
import type { Note } from "@/components/modules/notes/types";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface NoteExpandModalProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
  initialEditMode?: boolean;
}

export function NoteExpandModal({
  note,
  onSave,
  onClose,
  initialEditMode = false,
}: NoteExpandModalProps) {
  const moduleColor = getModuleColor("notes");
  const theme = getColorTheme(moduleColor);

  const [isEditing, setIsEditing] = useState(initialEditMode);

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [noteColor, setNoteColor] = useState(note.color || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previewColorKey = noteColor || moduleColor;
  const previewHex = resolveColor(previewColorKey);

  const handleSave = () => {
    onSave({
      ...note,
      title: title.trim(),
      content: content.trim(),
      color: noteColor,
    });
    setIsEditing(false);
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      size="full"
      zIndex="z-60"
      disableClose={isEditing}
    >
      <div className="flex items-center justify-between p-5 border-b border-neutral-900 bg-background/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4 flex-1 mr-4">
          <div
            className="p-2.5 bg-card rounded-xl border border-border hidden sm:block transition-colors"
            style={noteColor ? { borderColor: `${previewHex}40` } : {}}
          >
            <FileText className="w-5 h-5" style={{ color: previewHex }} />
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
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer",
                noteColor ? "" : theme.solid,
                noteColor ? "" : theme.solidHover,
              )}
              style={noteColor ? { backgroundColor: previewHex } : {}}
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

      <div
        className={`flex-1 overflow-hidden flex ${isEditing ? "flex-col lg:flex-row" : "flex-col"}`}
      >
        {isEditing ? (
          <>
            <div className="flex-1 relative w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-neutral-900 bg-background flex flex-col">
              <div className="px-8 lg:px-12 pt-4 pb-2 shrink-0">
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  value={content}
                  onChange={setContent}
                  accentHex={previewHex}
                  colorKey={noteColor}
                  onColorChange={setNoteColor}
                />
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full px-8 lg:px-12 pb-8 bg-transparent resize-none outline-none text-muted-foreground font-medium leading-relaxed custom-scrollbar border-0"
                placeholder="Escreva sua nota aqui..."
              />
            </div>
            <div className="flex-1 h-full w-full lg:w-1/2 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-card/10">
              <div
                className={cn(
                  "markdown-preview max-w-none prose prose-invert",
                  `prose-${previewColorKey}`,
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 style={{ color: previewHex }} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 style={{ color: previewHex }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong style={{ color: previewHex }} {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (props.href) open(props.href);
                        }}
                        className={cn(
                          "underline cursor-pointer font-bold inline-block border-none bg-transparent p-0",
                          theme.text,
                          theme.textDarkHover,
                        )}
                        style={{ color: previewHex }}
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
          <div className="flex-1 overflow-y-auto p-8 lg:p-16 custom-scrollbar ">
            <div className="max-w-4xl mx-auto w-full">
              <div
                className={cn(
                  "markdown-preview prose prose-invert lg:prose-xl max-w-none",
                  `prose-${previewColorKey}`,
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 style={{ color: previewHex }} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 style={{ color: previewHex }} {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong style={{ color: previewHex }} {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (props.href) open(props.href);
                        }}
                        className={cn(
                          "underline cursor-pointer font-bold transition-colors inline-block border-none bg-transparent p-0",
                          theme.text,
                          theme.textDarkHover,
                        )}
                        style={{ color: previewHex }}
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
    </ModalShell>
  );
}
