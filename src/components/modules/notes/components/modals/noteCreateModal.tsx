import { Eye, FileText, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveColor } from "@/colors.config";
import { ColorPicker } from "@/components/global/ColorPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { Textarea } from "@/components/ui/textarea";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface NoteCreateModalProps {
  onAdd: (title: string, content: string, color?: string) => void;
  onClose: () => void;
}

/**
 * Modal para criação de novas notas com visualização em tempo real (Markdown).
 */
export function NoteCreateModal({ onAdd, onClose }: NoteCreateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteColor, setNoteColor] = useState("");

  const moduleColor = getModuleColor("notes");
  const theme = getColorTheme(moduleColor);

  // A cor de destaque do preview usa a cor selecionada ou a cor padrão do módulo
  const previewColorKey = noteColor || moduleColor;
  const previewHex = resolveColor(previewColorKey);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim(), noteColor);
  };

  const ic = cn(
    "bg-card border-border text-sm font-medium transition-all placeholder:text-neutral-700",
    theme.borderHover.replace("hover:", "focus:"),
  );
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  const modalContent = (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-create-title"
    >
      <div className="relative w-full max-w-[950px]! bg-background border border-border rounded-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl border transition-colors",
                noteColor ? "" : theme.bg,
                noteColor ? "" : theme.border,
              )}
              style={
                noteColor
                  ? {
                      backgroundColor: `${previewHex}15`,
                      borderColor: `${previewHex}30`,
                    }
                  : {}
              }
            >
              <FileText
                className={cn("w-5 h-5", noteColor ? "" : theme.text)}
                style={noteColor ? { color: previewHex } : {}}
              />
            </div>
            <div>
              <h2
                id="note-create-title"
                className="text-lg font-bold text-foreground leading-none"
              >
                Nova Nota
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Captura rápida de conhecimento com visualização em tempo real
              </p>
            </div>
          </div>
          <ToolTip content="Fechar">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </ToolTip>
        </div>

        {/* Área de Conteúdo Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Esquerda: Editor */}
          <form
            id="note-form"
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col p-6 space-y-6 border-r border-border/50 overflow-y-auto custom-scrollbar"
          >
            {/* Título e Cor Lado a Lado */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="flex-1 space-y-2.5 w-full">
                <Label htmlFor="ncm-title" className={lc}>
                  Título da Nota
                </Label>
                <Input
                  id="ncm-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Resumo de estudo, ideias de projeto..."
                  className={cn(ic, "h-12 rounded-xl px-4 w-full")}
                  autoFocus
                  required
                />
              </div>

              <div className="w-full sm:w-[180px] space-y-2.5 relative">
                <Label className={lc}>Cor</Label>
                <ColorPicker
                  value={noteColor}
                  onChange={setNoteColor}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-2 pb-2">
              <Label htmlFor="ncm-content" className={lc}>
                Conteúdo{" "}
                <span className="text-neutral-600 font-normal">(Markdown)</span>
              </Label>
              <Textarea
                id="ncm-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva livremente aqui..."
                className={cn(
                  ic,
                  "flex-1 rounded-xl min-h-[250px] resize-none leading-relaxed p-4",
                )}
                required
              />
            </div>
          </form>

          {/* Direita: Preview */}
          <div className="flex-1 bg-black/20 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-border/40 flex items-center gap-2 shrink-0">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground">
                Visualização prévia
              </span>
            </div>

            <ScrollArea className="flex-1 p-8">
              <div
                className={cn(
                  "prose prose-invert max-w-none",
                  `prose-${noteColor || moduleColor}`,
                )}
              >
                {title && (
                  <h1 className="text-2xl font-bold mb-6 text-foreground leading-tight">
                    {title}
                  </h1>
                )}
                {content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
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
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-700 py-20 bg-card/10 rounded-3xl border-2 border-dashed border-border/30">
                    <FileText className="w-12 h-12 mb-4 opacity-10" />
                    <p className="text-sm font-medium">
                      O preview aparecerá aqui
                    </p>
                    <p className="text-[10px] mt-1 opacity-50">
                      Comece a escrever no editor ao lado
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="p-6 border-t border-border shrink-0 bg-background/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="note-form"
            disabled={!title.trim() || !content.trim()}
            className={cn(
              "flex-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40",
              noteColor ? "" : theme.solid,
              noteColor ? "" : theme.solidHover,
            )}
            style={noteColor ? { backgroundColor: previewHex } : {}}
          >
            <Plus className="w-4 h-4" /> Criar nota
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
