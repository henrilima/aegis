"use client";

import {
  ArrowLeft,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  List,
  ListOrdered,
  Minus,
  MoreVertical,
  Palette,
  Pin,
  Quote,
  Strikethrough,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveColor } from "@/colors.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Note } from "../types";
import { ColorPicker } from "./ColorPicker";

interface SlashMenuItem {
  tag: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => Promise<void>;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
}

// Converte Markdown cru para HTML limpo
function markdownToHtml(md: string, isEditMode = false): string {
  if (!md || !md.trim()) return "<p><br></p>";

  const lines = md.split("\n");
  let html = "";
  let inList = false;
  let listType: "ul" | "ol" | null = null;
  let inQuote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fecha tags de lista
    if (
      inList &&
      !line.startsWith("- ") &&
      !line.startsWith("* ") &&
      !/^\d+\.\s+/.test(line)
    ) {
      html += `</${listType}>`;
      inList = false;
      listType = null;
    }
    // Fecha blockquote
    if (inQuote && !line.startsWith("> ")) {
      html += "</blockquote>";
      inQuote = false;
    }

    if (line.startsWith("# ")) {
      html += `<h1>${line.substring(2)}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith("### ")) {
      html += `<h3>${line.substring(4)}</h3>`;
    } else if (line.startsWith("#### ")) {
      html += `<h4>${line.substring(5)}</h4>`;
    } else if (line.startsWith("> ")) {
      if (!inQuote) {
        html += "<blockquote>";
        inQuote = true;
      }
      html += `<p>${line.substring(2)}</p>`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += `</${listType}>`;
        html += "<ul>";
        inList = true;
        listType = "ul";
      }
      html += `<li>${line.substring(2)}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== "ol") {
        if (inList) html += `</${listType}>`;
        html += "<ol>";
        inList = true;
        listType = "ol";
      }
      const match = line.match(/^\d+\.\s+/);
      const content = line.substring(match ? match[0].length : 0);
      html += `<li>${content}</li>`;
    } else if (line.trim() === "---") {
      html += "<hr>";
    } else {
      if (line.trim() === "") {
        html += "<p><br></p>";
      } else {
        // Converte negrito, italico inline no HTML inicial
        let formatted = line
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/~~(.*?)~~/g, "<del>$1</del>")
          .replace(/`(.*?)`/g, "<code>$1</code>");
        if (!isEditMode) {
          formatted = formatted.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" class="text-primary underline hover:opacity-80">$1</a>',
          );
        }
        html += `<p>${formatted}</p>`;
      }
    }
  }

  if (inList) html += `</${listType}>`;
  if (inQuote) html += "</blockquote>";

  return html;
}

// Converte HTML editado de volta para Markdown limpo
function htmlToMarkdown(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  let markdown = "";

  const convertNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      let content = "";
      el.childNodes.forEach((child) => {
        content += convertNode(child);
      });

      const tag = el.tagName.toLowerCase();
      switch (tag) {
        case "h1":
          return `# ${content.trim()}\n`;
        case "h2":
          return `## ${content.trim()}\n`;
        case "h3":
          return `### ${content.trim()}\n`;
        case "h4":
          return `#### ${content.trim()}\n`;
        case "blockquote": {
          // Garante que cada linha de paragrafo dentro do blockquote tenha prefixo '> '
          const lines = content.split("\n").filter((l) => l.trim() !== "");
          if (lines.length === 0) return "> \n";
          return `${lines.map((l) => `> ${l}`).join("\n")}\n`;
        }
        case "strong":
        case "b":
          return `**${content.trim()}**`;
        case "em":
        case "i":
          return `*${content.trim()}*`;
        case "del":
        case "strike":
          return `~~${content.trim()}~~`;
        case "code":
          return `\`${content.trim()}\``;
        case "li": {
          const parent = el.parentElement;
          if (parent?.tagName.toLowerCase() === "ol") {
            const index = Array.from(parent.children).indexOf(el) + 1;
            return `${index}. ${content.trim()}\n`;
          }
          return `- ${content.trim()}\n`;
        }
        case "ul":
        case "ol":
          return content;
        case "hr":
          return "---\n";
        case "p":
          if (content.trim() === "" || el.innerHTML === "<br>") {
            return "\n";
          }
          return `${content.trim()}\n`;
        case "div":
          if (content.trim() === "" || el.innerHTML === "<br>") {
            return "\n";
          }
          return `${content.trim()}\n`;
        case "br":
          return "\n";
        case "a":
          return `[${content.trim()}](${el.getAttribute("href") || ""})`;
        default:
          return content;
      }
    }
    return "";
  };

  doc.body.childNodes.forEach((node) => {
    markdown += convertNode(node);
  });

  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

export function NoteEditor({
  note,
  onSave,
  onClose,
  onDelete,
}: NoteEditorProps) {
  const moduleColor = getModuleColor("notes");

  const [title, setTitle] = useState(note.title);
  const [noteColor, setNoteColor] = useState(note.color || "");
  const [pinned, setPinned] = useState(note.pinned);

  // Menu "/" para comandos
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });

  // Bubble Toolbar de selecao de text
  const [selectionActive, setSelectionActive] = useState(false);
  const [bubbleCoords, setBubbleCoords] = useState({ top: 0, left: 0 });

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );

  const colorHex = noteColor
    ? resolveColor(noteColor)
    : resolveColor(moduleColor);

  const editorRef = useRef<HTMLDivElement>(null);
  const lastLoadedNoteIdRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const slashMenuOpenRef = useRef(false);
  const selectedSlashIndexRef = useRef(0);
  const slashMenuItemsRef = useRef<SlashMenuItem[]>([]);

  // Autofoco no título ao criar nota vazia
  useEffect(() => {
    if (note.title === "" && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [note.title]);

  // Garante que o separador de parágrafos padrão seja a tag 'p' ao iniciar
  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");

  const handleManualSave = async () => {
    if (!editorRef.current) return;
    setSaveStatus("saving");
    try {
      const html = editorRef.current.innerHTML;
      const content = htmlToMarkdown(html);
      await onSave({
        ...note,
        title: title.trim() || "Nota sem título",
        content,
        color: noteColor || undefined,
        pinned,
      });
      setSaveStatus("saved");
      toast.success("Nota salva com sucesso!");
    } catch (_err) {
      setSaveStatus("unsaved");
      toast.error("Erro ao salvar nota");
    }
  };

  const handleModeChange = async (mode: "edit" | "preview") => {
    if (!editorRef.current) return;

    // Converte o conteúdo atual para markdown
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);

    // Salva o estado atual imediatamente ao trocar de modo
    setSaveStatus("saving");
    try {
      await onSave({
        ...note,
        title: title.trim() || "Nota sem título",
        content: markdown,
        color: noteColor || undefined,
        pinned,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }

    // Atualiza o modo
    setEditorMode(mode);

    // Repassa o HTML convertido para o editor com a regra do modo novo
    editorRef.current.innerHTML = markdownToHtml(markdown, mode === "edit");
  };

  // Carrega nota inicial convertida para HTML
  useEffect(() => {
    const isDifferentNote = note.id !== lastLoadedNoteIdRef.current;
    lastLoadedNoteIdRef.current = note.id || null;

    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const currentMarkdown = htmlToMarkdown(currentHtml);

      // Só atualiza o HTML se for uma nota diferente (mudou de ID) ou se o conteúdo backend mudou externamente
      if (isDifferentNote || currentMarkdown !== note.content) {
        const html = markdownToHtml(note.content, editorMode === "edit");
        editorRef.current.innerHTML = html;
      }
    }

    setTitle(note.title);
    setNoteColor(note.color || "");
    setPinned(note.pinned);
  }, [note, editorMode]);

  // Salva nota debounced
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus("saving");
      try {
        const html = editorRef.current?.innerHTML || "";
        const content = htmlToMarkdown(html);
        await onSave({
          ...note,
          title: title.trim() || "Nota sem título",
          content,
          color: noteColor || undefined,
          pinned,
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
        toast.error("Erro ao salvar nota");
      } finally {
        isSavingRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, noteColor, pinned, saveStatus, note, onSave]);

  const triggerChange = () => {
    setSaveStatus("unsaved");
  };

  const handleBack = async () => {
    if (saveStatus === "unsaved" || saveStatus === "saving") {
      setSaveStatus("saving");
      try {
        const html = editorRef.current?.innerHTML || "";
        const content = htmlToMarkdown(html);
        await onSave({
          ...note,
          title: title.trim() || "Nota sem título",
          content,
          color: noteColor || undefined,
          pinned,
        });
        setSaveStatus("saved");
      } catch {
        toast.error("Erro ao salvar ao sair");
      }
    }
    onClose();
  };

  // Converte a linha ativa (bloco) diretamente no DOM de forma 100% robusta
  const convertActiveBlockTo = (tagName: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let node: Node | null = selection.anchorNode;

    // Encontra o elemento de bloco ancestral direto
    while (
      node &&
      node !== editorRef.current &&
      node.nodeName !== "P" &&
      node.nodeName !== "H1" &&
      node.nodeName !== "H2" &&
      node.nodeName !== "H3" &&
      node.nodeName !== "H4" &&
      node.nodeName !== "BLOCKQUOTE"
    ) {
      node = node.parentNode;
    }

    if (node && node !== editorRef.current) {
      const parent = node.parentNode;
      if (parent) {
        const newBlock = document.createElement(tagName);
        let textContent = node.textContent || "";

        // Remove atalhos Markdown se presentes no inicio do texto
        textContent = textContent.replace(/^(#{1,4}|>|-|\*|1\.)\s*/, "");

        if (textContent.trim() === "") {
          newBlock.innerHTML = "<br>";
        } else {
          newBlock.textContent = textContent;
        }

        // Substitui o bloco fisicamente no DOM (sem perder selecao ou focar acima)
        parent.replaceChild(newBlock, node);

        // Reposiciona o cursor no fim do bloco novo
        const newRange = document.createRange();
        if (
          newBlock.firstChild &&
          newBlock.firstChild.nodeType === Node.TEXT_NODE
        ) {
          newRange.setStart(
            newBlock.firstChild,
            newBlock.firstChild.textContent?.length || 0,
          );
        } else {
          newRange.setStart(newBlock, 0);
        }
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        triggerChange();
      }
    }
  };

  // Monitora digitação e barra "/"
  const handleInput = () => {
    triggerChange();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      const text = textNode.textContent || "";
      const offset = range.startOffset;

      const beforeCursor = text.substring(0, offset);
      const slashIndex = beforeCursor.lastIndexOf("/");

      const isSlashCommand =
        slashIndex !== -1 &&
        (slashIndex === 0 || /\s/.test(beforeCursor[slashIndex - 1]));

      if (isSlashCommand) {
        const query = beforeCursor.substring(slashIndex + 1);
        console.log("[handleInput] Slash command detected. Query:", query);
        setSlashQuery(query);
        setSlashMenuOpen(true);
        setSelectedSlashIndex(0);

        const rect = range.getBoundingClientRect();
        setSlashCoords({
          top: rect.bottom + window.scrollY + 6,
          left: Math.min(rect.left + window.scrollX, window.innerWidth - 270),
        });
      } else {
        setSlashMenuOpen(false);
      }
    }
  };

  // Executa formatação de bloco (H1, H2, blockquote, etc.)
  const handleBlockTypeSelect = (tag: string) => {
    setSlashMenuOpen(false);

    // Remove o caractere "/" digitado antes de formatar
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      const text = textNode.textContent || "";
      const offset = range.startOffset;
      const slashIndex = text.substring(0, offset).lastIndexOf("/");

      if (slashIndex !== -1 && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent =
          text.substring(0, slashIndex) + text.substring(offset);
        range.setStart(textNode, slashIndex);
        range.setEnd(textNode, slashIndex);
      }
    }

    if (tag === "hr") {
      document.execCommand("insertHorizontalRule");
    } else if (tag === "ul") {
      document.execCommand("insertUnorderedList");
    } else if (tag === "ol") {
      document.execCommand("insertOrderedList");
    } else {
      convertActiveBlockTo(tag);
    }

    triggerChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atalho Ctrl+S para salvar manualmente
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
      return;
    }

    const isMenuOpen = slashMenuOpenRef.current;
    const items = slashMenuItemsRef.current;
    const currentIndex = selectedSlashIndexRef.current;

    if (isMenuOpen) {
      if (e.key === "ArrowDown" && items.length > 0) {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        console.log(
          "[handleKeyDown] ArrowDown. Current index:",
          currentIndex,
          "Next index:",
          nextIndex,
        );
        setSelectedSlashIndex(nextIndex);
        document
          .getElementById(`slash-item-${nextIndex}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "ArrowUp" && items.length > 0) {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + items.length) % items.length;
        console.log(
          "[handleKeyDown] ArrowUp. Current index:",
          currentIndex,
          "Next index:",
          nextIndex,
        );
        setSelectedSlashIndex(nextIndex);
        document
          .getElementById(`slash-item-${nextIndex}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "Enter") {
        const selected = items[currentIndex];
        if (selected) {
          e.preventDefault();
          handleBlockTypeSelect(selected.tag);
          return;
        }
        // Se não houver comando válido, fecha o menu e permite a quebra de linha normal
        setSlashMenuOpen(false);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    // Atalhos de Markdown em tempo real ao digitar Espaço (Ex: '# ', '## ', '--- ', '- ', etc.)
    if (e.key === " ") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode;

        // Encontra o elemento de bloco ancestral direto da seleção atual
        while (
          node &&
          node !== editorRef.current &&
          node.nodeName !== "P" &&
          node.nodeName !== "H1" &&
          node.nodeName !== "H2" &&
          node.nodeName !== "H3" &&
          node.nodeName !== "H4" &&
          node.nodeName !== "BLOCKQUOTE" &&
          node.nodeName !== "LI"
        ) {
          node = node.parentNode;
        }

        if (node && node !== editorRef.current) {
          const text = node.textContent || "";
          let tagToApply = "";

          if (text === "#") {
            tagToApply = "h1";
          } else if (text === "##") {
            tagToApply = "h2";
          } else if (text === "###") {
            tagToApply = "h3";
          } else if (text === "####") {
            tagToApply = "h4";
          } else if (text === ">") {
            tagToApply = "blockquote";
          } else if (text === "-" || text === "*") {
            tagToApply = "ul";
          } else if (text === "1.") {
            tagToApply = "ol";
          } else if (text === "---") {
            tagToApply = "hr";
          }

          if (tagToApply) {
            e.preventDefault(); // Impede a digitação do caractere de espaço

            // Executa a conversão baseada em manipulação DOM direta de forma 100% segura
            if (tagToApply === "hr") {
              document.execCommand("insertHorizontalRule");
            } else if (tagToApply === "ul") {
              document.execCommand("insertUnorderedList");
            } else if (tagToApply === "ol") {
              document.execCommand("insertOrderedList");
            } else {
              convertActiveBlockTo(tagToApply);
            }

            triggerChange();
          }
        }
      }
    }

    // Intercepta Enter em blocos formatados (H1-H4, Blockquote) para quebrar criando um parágrafo comum <p> fora dele
    if (e.key === "Enter" && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        let specialBlock: HTMLElement | null = null;

        // Varre a árvore em busca de blockquote ou h1-h4
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (
              tag === "h1" ||
              tag === "h2" ||
              tag === "h3" ||
              tag === "h4" ||
              tag === "blockquote"
            ) {
              specialBlock = el;
              break;
            }
          }
          node = node.parentNode;
        }

        if (specialBlock) {
          e.preventDefault(); // Evita a duplicidade nativa do estilo

          const p = document.createElement("p");
          p.innerHTML = "<br>";

          // Insere o parágrafo logo após o bloco especial
          specialBlock.parentNode?.insertBefore(p, specialBlock.nextSibling);

          // Move o cursor de forma suave para dentro do novo parágrafo
          const newRange = document.createRange();
          newRange.setStart(p, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          triggerChange();
        }
      }
    }
  };

  // Monitora selecao de texto
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        setBubbleCoords({
          top: rect.top - 46,
          left: rect.left + rect.width / 2 - 100,
        });
        setSelectionActive(true);
      }
    } else {
      setSelectionActive(false);
    }
  };

  // Formatação rápida via execCommand
  const formatText = (command: string, value = "") => {
    document.execCommand(command, false, value);
    triggerChange();
  };

  // Código inline customizado
  const formatCodeInline = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement("code");
      code.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(code);
      triggerChange();
    }
  };

  const rawSlashMenuItems = [
    {
      tag: "p",
      label: "Texto normal",
      description: "Escreva texto comum",
      icon: Type,
    },
    {
      tag: "h1",
      label: "Título 1",
      description: "Cabeçalho grande",
      icon: Heading1,
    },
    {
      tag: "h2",
      label: "Título 2",
      description: "Cabeçalho médio",
      icon: Heading2,
    },
    {
      tag: "h3",
      label: "Título 3",
      description: "Cabeçalho pequeno",
      icon: Heading3,
    },
    {
      tag: "h4",
      label: "Título 4",
      description: "Cabeçalho minúsculo",
      icon: Heading4,
    },
    {
      tag: "ul",
      label: "Lista simples",
      description: "Lista com marcadores",
      icon: List,
    },
    {
      tag: "ol",
      label: "Lista numerada",
      description: "Lista em ordem",
      icon: ListOrdered,
    },
    {
      tag: "blockquote",
      label: "Citação",
      description: "Bloco de citação destacado",
      icon: Quote,
    },
    {
      tag: "hr",
      label: "Divisor",
      description: "Linha separadora horizontal",
      icon: Minus,
    },
  ];

  const slashMenuItems = rawSlashMenuItems.filter(
    (item) =>
      item.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(slashQuery.toLowerCase()),
  );
  console.log(
    "[NoteEditor Render] selectedSlashIndex:",
    selectedSlashIndex,
    "slashMenuOpen:",
    slashMenuOpen,
    "slashMenuItems count:",
    slashMenuItems.length,
  );

  slashMenuOpenRef.current = slashMenuOpen;
  selectedSlashIndexRef.current = selectedSlashIndex;
  slashMenuItemsRef.current = slashMenuItems;

  return (
    <div className="w-full flex-1 flex flex-col h-full bg-background animate-in fade-in duration-200">
      {/*  BARRA COMPACTA SUPERIOR  */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/10 z-20 shrink-0 select-none">
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerChange();
            }}
            placeholder="Digite um título..."
            className="w-full bg-transparent border-b border-dashed border-border/40 hover:border-border/80 focus:border-solid focus:border-border text-base font-bold outline-none text-foreground placeholder-muted-foreground/30 pb-1 h-auto focus:ring-0 focus-visible:ring-0 truncate transition-colors"
            style={colorHex ? { color: colorHex } : {}}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 select-none">
          {/* Alternador de Modo (Editar vs Visualizar) */}
          <div className="flex items-center gap-0.5 bg-muted/65 p-1 rounded-xl border border-border/20 select-none mr-2">
            <button
              type="button"
              onClick={() => handleModeChange("edit")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                editorMode === "edit"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("preview")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                editorMode === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Visualizar
            </button>
          </div>

          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium mr-2">
            {saveStatus === "saving" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Salvando...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Salvo
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Alterações pendentes
              </>
            )}
          </span>

          {/* Fixar Nota */}
          <button
            type="button"
            onClick={() => {
              setPinned((p) => !p);
              triggerChange();
              toast.success(pinned ? "Nota desfixada" : "Nota fixada");
            }}
            className={cn(
              "p-2 rounded-xl border border-border/30 hover:bg-muted/40 transition-colors cursor-pointer",
              pinned
                ? "text-amber-500 border-amber-500/20 bg-amber-500/5"
                : "text-muted-foreground",
            )}
          >
            <Pin className="w-4 h-4" fill={pinned ? "currentColor" : "none"} />
          </button>

          {/* ColorPicker */}
          <ColorPicker
            value={noteColor}
            onChange={(color) => {
              setNoteColor(color);
              triggerChange();
            }}
          >
            <span className="p-2 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer flex items-center justify-center animate-in fade-in">
              <Palette className="w-4 h-4" />
            </span>
          </ColorPicker>

          {/* Opções extras */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border text-foreground min-w-[150px] rounded-xl">
              <DropdownMenuItem
                onClick={() => note.id && onDelete(note.id)}
                className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg m-1"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/*  BUBBLE TOOLBAR FLUTUANTE (SELEÇÃO)  */}
      {selectionActive && (
        <div
          className="fixed bg-card border border-border text-foreground px-2.5 py-1.5 rounded-xl z-50 flex items-center gap-1 duration-150 animate-in fade-in zoom-in-95 shadow-lg select-none"
          style={{
            top: Math.max(10, bubbleCoords.top),
            left: Math.max(
              10,
              Math.min(
                bubbleCoords.left,
                typeof window !== "undefined" ? window.innerWidth - 220 : 200,
              ),
            ),
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("bold");
            }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Negrito"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("italic");
            }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Itálico"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("strikeThrough");
            }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Tachado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatCodeInline();
            }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Código inline"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Área de edição do conteúdo  */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click on wrapper area is a focus forwarding convenience helper, keyboard users focus the editor directly */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Click on wrapper area is a focus forwarding convenience helper, keyboard users focus the editor directly */}
      <div
        className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background/5"
        onClick={() => editorRef.current?.focus()}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Event propagation interception does not require keyboard events */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Event propagation interception does not require a specific role */}
        <div
          className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* biome-ignore lint/a11y/useSemanticElements: Rich text editor must use contentEditable div instead of native inputs */}
          <div
            ref={editorRef}
            contentEditable={editorMode === "edit"}
            role="textbox"
            aria-multiline="true"
            tabIndex={editorMode === "edit" ? 0 : -1}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className={cn(
              "w-full h-full min-h-[300px] outline-none editor-content select-text font-sans text-foreground pb-20",
              editorMode === "preview" && "pointer-events-auto",
            )}
            style={
              {
                userSelect: "text",
                WebkitUserSelect: "text",
                "--color-hex": colorHex || "currentColor",
              } as React.CSSProperties
            }
          />
        </div>
      </div>

      {/*  PALETA DE COMANDOS FLUTUANTE "/"  */}
      {slashMenuOpen && (
        <div
          className="fixed bg-card/95 backdrop-blur-md border border-border text-foreground w-64 rounded-2xl z-50 overflow-hidden p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            top: slashCoords.top,
            left: slashCoords.left,
          }}
        >
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
            <div className="px-2.5 py-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider select-none">
              Comandos de Formatação
            </div>
            {slashMenuItems.length === 0 ? (
              <div className="px-2.5 py-2 text-xs text-muted-foreground/60">
                Nenhum comando encontrado
              </div>
            ) : (
              slashMenuItems.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    id={`slash-item-${idx}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => handleBlockTypeSelect(item.tag)}
                    className={cn(
                      "w-full flex items-center gap-3 text-left px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer",
                      idx === selectedSlashIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-lg shrink-0",
                        idx === selectedSlashIndex
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/65 text-muted-foreground",
                      )}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[11px] leading-tight text-foreground">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground/80 leading-tight mt-0.5 truncate">
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        .editor-content {
          font-size: 0.875rem; /* 14px */
          line-height: 1.625;
        }
        .editor-content h1 {
          font-size: 1.875rem; /* 30px */
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
          color: var(--color-hex);
          letter-spacing: -0.025em;
        }
        .editor-content h2 {
          font-size: 1.5rem; /* 24px */
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
          letter-spacing: -0.025em;
        }
        .editor-content h3 {
          font-size: 1.25rem; /* 20px */
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
          line-height: 1.35;
        }
        .editor-content h4 {
          font-size: 1.125rem; /* 18px */
          font-weight: 500;
          margin-top: 0.875rem;
          margin-bottom: 0.35rem;
        }
        .editor-content p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .editor-content blockquote {
          font-style: italic;
          border-left: 4px solid var(--color-hex);
          padding-left: 1rem;
          margin: 1rem 0;
          color: #a3a3a3;
        }
        .editor-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .editor-content li {
          margin: 0.25rem 0;
        }
        .editor-content hr {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 1.5rem 0;
        }
        .editor-content code {
          font-family: monospace;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.375rem;
          font-size: 0.8em;
        }
        .editor-content:empty::before,
        .editor-content > p:first-child:only-child:empty::before,
        .editor-content > p:first-child:only-child:has(> br:only-child)::before {
          content: "${editorMode === "edit" ? "Escreva algo ou '/' para comandos..." : "Sem conteúdo"}";
          color: #a3a3a3;
          opacity: 0.45;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
    </div>
  );
}
