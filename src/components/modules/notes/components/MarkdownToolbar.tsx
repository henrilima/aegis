"use client";

import {
  Bold,
  ChevronDown,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { resolveColor, SELECTABLE_COLORS } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type InsertMode =
  | { type: "wrap"; before: string; after: string; placeholder: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "block"; template: string; cursorOffset?: number };

interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ElementType;
  insert: InsertMode;
  shortcut?: string;
}

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  accentHex?: string;
  colorKey?: string;
  onColorChange?: (key: string) => void;
  className?: string;
}

// ─── Ações do toolbar ─────────────────────────────────────────────────────────

const ACTIONS: ToolbarAction[] = [
  {
    id: "h1",
    label: "Título H1",
    icon: Heading1,
    insert: { type: "line-prefix", prefix: "# " },
    shortcut: "Ctrl+1",
  },
  {
    id: "h2",
    label: "Subtítulo H2",
    icon: Heading2,
    insert: { type: "line-prefix", prefix: "## " },
    shortcut: "Ctrl+2",
  },
  {
    id: "h3",
    label: "Título H3",
    icon: Heading3,
    insert: { type: "line-prefix", prefix: "### " },
    shortcut: "Ctrl+3",
  },
];

const ACTIONS_FORMAT: ToolbarAction[] = [
  {
    id: "bold",
    label: "Negrito",
    icon: Bold,
    insert: { type: "wrap", before: "**", after: "**", placeholder: "texto" },
    shortcut: "Ctrl+B",
  },
  {
    id: "italic",
    label: "Itálico",
    icon: Italic,
    insert: { type: "wrap", before: "_", after: "_", placeholder: "texto" },
    shortcut: "Ctrl+I",
  },
  {
    id: "strike",
    label: "Tachado",
    icon: Strikethrough,
    insert: { type: "wrap", before: "~~", after: "~~", placeholder: "texto" },
  },
  {
    id: "code",
    label: "Código inline",
    icon: Code,
    insert: { type: "wrap", before: "`", after: "`", placeholder: "código" },
  },
  {
    id: "link",
    label: "Hyperlink",
    icon: Link,
    insert: {
      type: "wrap",
      before: "[",
      after: "](url)",
      placeholder: "texto do link",
    },
    shortcut: "Ctrl+K",
  },
];

const ACTIONS_BLOCK: ToolbarAction[] = [
  {
    id: "quote",
    label: "Citação",
    icon: Quote,
    insert: { type: "line-prefix", prefix: "> " },
  },
  {
    id: "codeblock",
    label: "Bloco de código",
    icon: Code2,
    insert: { type: "block", template: "```\n\n```", cursorOffset: 4 },
  },
  {
    id: "ul",
    label: "Lista com marcadores",
    icon: List,
    insert: { type: "line-prefix", prefix: "- " },
  },
  {
    id: "ol",
    label: "Lista numerada",
    icon: ListOrdered,
    insert: { type: "line-prefix", prefix: "1. " },
  },
  {
    id: "hr",
    label: "Linha separadora",
    icon: Minus,
    insert: { type: "block", template: "\n---\n", cursorOffset: 5 },
  },
];

// ─── Função de inserção ───────────────────────────────────────────────────────

function applyInsert(
  textarea: HTMLTextAreaElement,
  value: string,
  insert: InsertMode,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  let newValue = value;
  let newCursorStart = start;
  let newCursorEnd = end;

  if (insert.type === "wrap") {
    const { before, after, placeholder } = insert;
    const alreadyWrapped =
      value.slice(start - before.length, start) === before &&
      value.slice(end, end + after.length) === after;

    if (alreadyWrapped) {
      newValue =
        value.slice(0, start - before.length) +
        selected +
        value.slice(end + after.length);
      newCursorStart = start - before.length;
      newCursorEnd = end - before.length;
    } else {
      const insertion = selected || placeholder;
      newValue =
        value.slice(0, start) + before + insertion + after + value.slice(end);
      newCursorStart = start + before.length;
      newCursorEnd = start + before.length + insertion.length;
    }
  } else if (insert.type === "line-prefix") {
    const { prefix } = insert;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineContent = value.slice(lineStart);
    const lineEnd = lineContent.indexOf("\n");
    const line = lineEnd === -1 ? lineContent : lineContent.slice(0, lineEnd);

    if (line.startsWith(prefix)) {
      newValue =
        value.slice(0, lineStart) +
        line.slice(prefix.length) +
        value.slice(lineStart + line.length);
      newCursorStart = Math.max(lineStart, start - prefix.length);
      newCursorEnd = Math.max(lineStart, end - prefix.length);
    } else {
      newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      newCursorStart = start + prefix.length;
      newCursorEnd = end + prefix.length;
    }
  } else if (insert.type === "block") {
    const { template, cursorOffset = template.length } = insert;
    newValue = value.slice(0, start) + template + value.slice(end);
    newCursorStart = start + cursorOffset;
    newCursorEnd = start + cursorOffset;
  }

  onChange(newValue);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(newCursorStart, newCursorEnd);
  });
}

// ─── Color Picker compacto (inline no toolbar) ───────────────────────────────

interface InlineColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function InlineColorPicker({ value, onChange }: InlineColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedColor = SELECTABLE_COLORS.find((c) => c.key === value);
  const colorHex = value ? resolveColor(value) : null;

  return (
    <div className="relative" ref={containerRef}>
      <ToolTip content="Cor da nota">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "h-9 flex items-center gap-2 px-3 rounded-xl border transition-all cursor-pointer",
            "bg-card border-border hover:border-border/80 text-foreground",
            isOpen && "ring-2 ring-primary/20 border-primary/50",
          )}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0"
            style={{ backgroundColor: colorHex ?? "transparent" }}
          />
          <span className="text-xs font-medium truncate max-w-[60px]">
            {selectedColor?.label ?? "Padrão"}
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </ToolTip>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-44 bg-card border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-medium text-foreground",
                !value ? "bg-muted/60" : "hover:bg-muted/40",
              )}
            >
              <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-transparent shrink-0" />
              <span>Nenhuma</span>
            </button>
            <div className="h-px bg-border/40 my-1 mx-1" />
            {SELECTABLE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c.key);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-medium text-foreground",
                  value === c.key ? "bg-muted/60" : "hover:bg-muted/40",
                )}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: resolveColor(c.key) }}
                />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  accentHex: _accentHex,
  colorKey,
  onColorChange,
  className,
}: MarkdownToolbarProps) {
  const handleAction = (action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    applyInsert(ta, value, action.insert, onChange);
  };

  // Botão maior (w-9 h-9 em vez de w-7 h-7)
  const btnClass = cn(
    "w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground",
    "hover:text-foreground hover:bg-white/10 transition-all cursor-pointer active:scale-95",
  );

  const divider = <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 rounded-xl border border-border/70 bg-neutral-900/50 backdrop-blur-sm",
        "w-fit",
        className,
      )}
    >
      {/* Headings */}
      {ACTIONS.map((action) => (
        <ToolTip
          key={action.id}
          content={
            action.shortcut
              ? `${action.label} (${action.shortcut})`
              : action.label
          }
        >
          <button
            type="button"
            className={btnClass}
            onClick={() => handleAction(action)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <action.icon className="w-4 h-4" />
          </button>
        </ToolTip>
      ))}

      {divider}

      {/* Formatação inline */}
      {ACTIONS_FORMAT.map((action) => (
        <ToolTip
          key={action.id}
          content={
            action.shortcut
              ? `${action.label} (${action.shortcut})`
              : action.label
          }
        >
          <button
            type="button"
            className={btnClass}
            onClick={() => handleAction(action)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <action.icon className="w-4 h-4" />
          </button>
        </ToolTip>
      ))}

      {divider}

      {/* Blocos */}
      {ACTIONS_BLOCK.map((action) => (
        <ToolTip key={action.id} content={action.label}>
          <button
            type="button"
            className={btnClass}
            onClick={() => handleAction(action)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <action.icon className="w-4 h-4" />
          </button>
        </ToolTip>
      ))}

      {/* Seletor de cor */}
      {onColorChange && (
        <>
          {divider}
          <InlineColorPicker value={colorKey ?? ""} onChange={onColorChange} />
        </>
      )}
    </div>
  );
}
