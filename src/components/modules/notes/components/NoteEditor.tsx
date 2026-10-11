"use client";

import {
  ArrowLeft,
  Bold,
  Code,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  MoreVertical,
  Palette,
  Pin,
  Quote,
  Sparkles,
  Strikethrough,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { CreateFlashcardFromNoteModal } from "./modals/CreateFlashcardFromNoteModal";

interface SlashMenuItem {
  tag: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NoteEditorProps {
  note: Note;
  allNotes?: Note[];
  onSave: (note: Note) => Promise<void>;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
  onNavigateWikiLink?: (noteTitle: string) => void;
}

// Auxiliar para converter formatação inline (negrito, itálico, tachado, código, links e WikiLinks)
function formatInline(text: string, isEditMode: boolean): string {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    .replace(/`(.*?)`/g, "<code>$1</code>");

  // No modo de edição pura, mantemos [[...]] como texto para não prender o cursor
  if (!isEditMode) {
    formatted = formatted.replace(
      /\[\[(.*?)\]\]/g,
      '<span class="wiki-link inline-flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded-md text-[13px]" data-wiki="$1">[[ $1 ]]</span>',
    );
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-primary underline hover:opacity-80">$1</a>',
    );
  }
  return formatted;
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
      html += `<h1>${formatInline(line.substring(2), isEditMode)}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${formatInline(line.substring(3), isEditMode)}</h2>`;
    } else if (line.startsWith("### ")) {
      html += `<h3>${formatInline(line.substring(4), isEditMode)}</h3>`;
    } else if (line.startsWith("#### ")) {
      html += `<h4>${formatInline(line.substring(5), isEditMode)}</h4>`;
    } else if (line.startsWith("> ")) {
      if (!inQuote) {
        html += "<blockquote>";
        inQuote = true;
      }
      const innerLine = line.substring(2);
      if (innerLine.startsWith("# ")) {
        html += `<h1>${formatInline(innerLine.substring(2), isEditMode)}</h1>`;
      } else if (innerLine.startsWith("## ")) {
        html += `<h2>${formatInline(innerLine.substring(3), isEditMode)}</h2>`;
      } else if (innerLine.startsWith("### ")) {
        html += `<h3>${formatInline(innerLine.substring(4), isEditMode)}</h3>`;
      } else if (innerLine.startsWith("#### ")) {
        html += `<h4>${formatInline(innerLine.substring(5), isEditMode)}</h4>`;
      } else if (innerLine.startsWith("- ") || innerLine.startsWith("* ")) {
        html += `<ul><li>${formatInline(innerLine.substring(2), isEditMode)}</li></ul>`;
      } else if (/^\d+\.\s+/.test(innerLine)) {
        const match = innerLine.match(/^\d+\.\s+/);
        const content = innerLine.substring(match ? match[0].length : 0);
        html += `<ol><li>${formatInline(content, isEditMode)}</li></ol>`;
      } else if (innerLine.trim() === "") {
        html += "<p><br></p>";
      } else {
        html += `<p>${formatInline(innerLine, isEditMode)}</p>`;
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += `</${listType}>`;
        html += "<ul>";
        inList = true;
        listType = "ul";
      }
      html += `<li>${formatInline(line.substring(2), isEditMode)}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== "ol") {
        if (inList) html += `</${listType}>`;
        html += "<ol>";
        inList = true;
        listType = "ol";
      }
      const match = line.match(/^\d+\.\s+/);
      const content = line.substring(match ? match[0].length : 0);
      html += `<li>${formatInline(content, isEditMode)}</li>`;
    } else if (line.trim() === "---") {
      html += "<hr>";
    } else {
      if (line.trim() === "") {
        html += "<p><br></p>";
      } else {
        html += `<p>${formatInline(line, isEditMode)}</p>`;
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
      if (el.hasAttribute("data-wiki")) {
        const wiki = el.getAttribute("data-wiki") || el.textContent || "";
        return `[[${wiki.replace(/^\[\[\s*|\s*\]\]$/g, "").trim()}]]`;
      }

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
  allNotes = [],
  onSave,
  onClose,
  onDelete,
  onNavigateWikiLink,
}: NoteEditorProps) {
  const moduleColor = getModuleColor("notes");

  const [title, setTitle] = useState(note.title);
  const [noteColor, setNoteColor] = useState(note.color || "");
  const [pinned, setPinned] = useState(note.pinned);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");

  // Menu "/" para comandos
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });

  // Menu "[[" para WikiLinks
  const [wikiMenuOpen, setWikiMenuOpen] = useState(false);
  const [wikiQuery, setWikiQuery] = useState("");
  const [selectedWikiIndex, setSelectedWikiIndex] = useState(0);
  const [wikiCoords, setWikiCoords] = useState({ top: 0, left: 0 });

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

  const wikiMenuOpenRef = useRef(false);
  const selectedWikiIndexRef = useRef(0);
  const filteredWikiNotesRef = useRef<Note[]>([]);

  // Escuta tecla Escape para sair do Modo Zen
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [isZenMode]);

  const handleOpenFlashcard = () => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setFlashcardFront(selection);
      setFlashcardBack("");
    } else {
      setFlashcardFront(title || "Conceito");
      const plain = editorRef.current?.innerText?.trim() || "";
      setFlashcardBack(plain.slice(0, 400));
    }
    setIsFlashcardModalOpen(true);
  };

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

    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);

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

    setEditorMode(mode);
    editorRef.current.innerHTML = markdownToHtml(markdown, mode === "edit");
  };

  // Carrega nota inicial convertida para HTML
  useEffect(() => {
    const isDifferentNote = note.id !== lastLoadedNoteIdRef.current;
    lastLoadedNoteIdRef.current = note.id || null;

    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const currentMarkdown = htmlToMarkdown(currentHtml);

      if (isDifferentNote || currentMarkdown !== note.content) {
        const html = markdownToHtml(note.content, editorMode === "edit");
        editorRef.current.innerHTML = html;
      }
    }
  }, [note.id, note.content, editorMode]);

  // Salvamento automático com debounce de 1.5s
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(async () => {
      if (!editorRef.current || isSavingRef.current) return;
      isSavingRef.current = true;
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
      } catch (_err) {
        setSaveStatus("unsaved");
      } finally {
        isSavingRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [saveStatus, title, noteColor, pinned, onSave, note]);

  // Salva imediatamente ao fechar / voltar
  const handleBack = async () => {
    if (saveStatus === "unsaved" && editorRef.current) {
      const html = editorRef.current.innerHTML;
      const content = htmlToMarkdown(html);
      await onSave({
        ...note,
        title: title.trim() || "Nota sem título",
        content,
        color: noteColor || undefined,
        pinned,
      });
    }
    onClose();
  };

  const triggerChange = () => {
    if (saveStatus !== "unsaved") setSaveStatus("unsaved");
  };

  // Formatação de texto padrão
  const formatText = (
    command: string,
    value: string | undefined = undefined,
  ) => {
    document.execCommand(command, false, value);
    triggerChange();
  };

  // Formatação inline de código <code>
  const formatCodeInline = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText.length > 0) {
      let parent: Node | null = range.commonAncestorContainer;
      if (parent.nodeType === Node.TEXT_NODE) parent = parent.parentNode;

      if (parent && (parent as HTMLElement).tagName?.toLowerCase() === "code") {
        const textNode = document.createTextNode(selectedText);
        parent.parentNode?.replaceChild(textNode, parent);
      } else {
        const codeElement = document.createElement("code");
        codeElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(codeElement);
      }
      triggerChange();
    }
  };

  // Converte o bloco atual para um tipo de cabeçalho ou bloco
  const convertActiveBlockTo = (tagName: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;

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
        textContent = textContent.replace(/^(#{1,4}|>|-|\*|1\.)\s*/, "");

        if (textContent.trim() === "") {
          newBlock.innerHTML = "<br>";
        } else {
          newBlock.textContent = textContent;
        }

        parent.replaceChild(newBlock, node);

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

  // Monitora digitação, menu "/" e WikiLinks "[["
  const handleInput = () => {
    triggerChange();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      const text = textNode.textContent || "";
      const offset = range.startOffset;
      const beforeCursor = text.substring(0, offset);

      // 1. Detecta menu WikiLink "[["
      const lastWikiOpen = beforeCursor.lastIndexOf("[[");
      const isWikiCommand =
        lastWikiOpen !== -1 &&
        !beforeCursor.substring(lastWikiOpen).includes("]]");

      if (isWikiCommand) {
        const query = beforeCursor.substring(lastWikiOpen + 2);
        setWikiQuery(query);
        setWikiMenuOpen(true);
        setSelectedWikiIndex(0);
        setSlashMenuOpen(false);

        const rect = range.getBoundingClientRect();
        setWikiCoords({
          top: rect.bottom + window.scrollY + 6,
          left: Math.min(rect.left + window.scrollX, window.innerWidth - 300),
        });
        return;
      }
      setWikiMenuOpen(false);

      // 2. Detecta menu "/"
      const slashIndex = beforeCursor.lastIndexOf("/");
      const isSlashCommand =
        slashIndex !== -1 &&
        (slashIndex === 0 || /\s/.test(beforeCursor[slashIndex - 1]));

      if (isSlashCommand) {
        const query = beforeCursor.substring(slashIndex + 1);
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

  // Executa inserção de WikiLink a partir do menu
  const handleWikiSelect = (targetNoteTitle: string) => {
    setWikiMenuOpen(false);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      const text = textNode.textContent || "";
      const offset = range.startOffset;
      const lastOpen = text.substring(0, offset).lastIndexOf("[[");

      if (lastOpen !== -1 && textNode.nodeType === Node.TEXT_NODE) {
        const before = text.substring(0, lastOpen);
        const after = text.substring(offset);
        const insertStr = `[[${targetNoteTitle}]] `;
        textNode.textContent = before + insertStr + after;

        const newRange = document.createRange();
        newRange.setStart(textNode, before.length + insertStr.length);
        newRange.setEnd(textNode, before.length + insertStr.length);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    triggerChange();
  };

  // Executa formatação de bloco (H1, H2, blockquote, etc.)
  const handleBlockTypeSelect = (tag: string) => {
    setSlashMenuOpen(false);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const scripts = Array.from(doc.body.getElementsByTagName("script"));
        for (const s of scripts) s.remove();
        const styles = Array.from(doc.body.getElementsByTagName("style"));
        for (const s of styles) s.remove();

        const allElements = Array.from(doc.body.getElementsByTagName("*"));
        for (const el of allElements) {
          el.removeAttribute("style");
          el.removeAttribute("class");
          el.removeAttribute("color");
          el.removeAttribute("bgcolor");
        }

        const cleanHtml = doc.body.innerHTML;
        document.execCommand("insertHTML", false, cleanHtml);
        triggerChange();
      } catch (err) {
        console.error("Erro ao processar HTML colado:", err);
        if (text) {
          document.execCommand("insertText", false, text);
          triggerChange();
        }
      }
    } else if (text) {
      document.execCommand("insertText", false, text);
      triggerChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
      return;
    }

    // Controle do menu de WikiLinks "[["
    if (wikiMenuOpenRef.current) {
      const items = filteredWikiNotesRef.current;
      const currentIndex = selectedWikiIndexRef.current;

      if (e.key === "ArrowDown" && items.length > 0) {
        e.preventDefault();
        const next = (currentIndex + 1) % items.length;
        setSelectedWikiIndex(next);
        document
          .getElementById(`wiki-item-${next}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "ArrowUp" && items.length > 0) {
        e.preventDefault();
        const next = (currentIndex - 1 + items.length) % items.length;
        setSelectedWikiIndex(next);
        document
          .getElementById(`wiki-item-${next}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (items[currentIndex]) {
          e.preventDefault();
          handleWikiSelect(items[currentIndex].title);
          return;
        }
        setWikiMenuOpen(false);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setWikiMenuOpen(false);
        return;
      }
    }

    // Controle do menu "/"
    if (slashMenuOpenRef.current) {
      const items = slashMenuItemsRef.current;
      const currentIndex = selectedSlashIndexRef.current;

      if (e.key === "ArrowDown" && items.length > 0) {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        setSelectedSlashIndex(nextIndex);
        document
          .getElementById(`slash-item-${nextIndex}`)
          ?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (e.key === "ArrowUp" && items.length > 0) {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + items.length) % items.length;
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
        setSlashMenuOpen(false);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    // Atalhos de Markdown em tempo real ao digitar Espaço
    if (e.key === " ") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode;

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
          } else if (text === "- " || text === "* ") {
            tagToApply = "ul";
          }

          if (tagToApply) {
            e.preventDefault();
            convertActiveBlockTo(tagToApply);
            return;
          }
        }
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setSelectionActive(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0) {
      setBubbleCoords({
        top: rect.top - 48,
        left: rect.left + rect.width / 2 - 80,
      });
      setSelectionActive(true);
    } else {
      setSelectionActive(false);
    }
  };

  const rawSlashMenuItems: SlashMenuItem[] = [
    {
      tag: "p",
      label: "Texto Normal",
      description: "Parágrafo de texto simples",
      icon: Type,
    },
    {
      tag: "h1",
      label: "Título 1",
      description: "Título principal grande",
      icon: Heading1,
    },
    {
      tag: "h2",
      label: "Título 2",
      description: "Subtítulo médio de seção",
      icon: Heading2,
    },
    {
      tag: "h3",
      label: "Título 3",
      description: "Subtítulo pequeno",
      icon: Heading3,
    },
    {
      tag: "h4",
      label: "Título 4",
      description: "Subtítulo menor de tópico",
      icon: Heading4,
    },
    {
      tag: "ul",
      label: "Lista com Marcadores",
      description: "Lista simples de tópicos",
      icon: List,
    },
    {
      tag: "ol",
      label: "Lista Numerada",
      description: "Lista ordenada com números",
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

  const filteredWikiNotes = allNotes.filter(
    (n) =>
      n.id !== note.id &&
      (n.title.toLowerCase().includes(wikiQuery.toLowerCase()) ||
        n.path?.toLowerCase().includes(wikiQuery.toLowerCase())),
  );

  slashMenuOpenRef.current = slashMenuOpen;
  selectedSlashIndexRef.current = selectedSlashIndex;
  slashMenuItemsRef.current = slashMenuItems;

  wikiMenuOpenRef.current = wikiMenuOpen;
  selectedWikiIndexRef.current = selectedWikiIndex;
  filteredWikiNotesRef.current = filteredWikiNotes;

  // Render do Editor (usado tanto normalmente quanto no Portal Zen)
  const editorBody = (
    <div
      className={cn(
        "w-full flex-1 flex flex-col h-full bg-background animate-in fade-in duration-200",
        isZenMode &&
          "fixed inset-0 z-99999 bg-background flex flex-col w-screen h-screen",
      )}
    >
      {/*  BARRA COMPACTA SUPERIOR  */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/10 z-20 shrink-0 select-none">
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <button
            type="button"
            onClick={isZenMode ? () => setIsZenMode(false) : handleBack}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer shrink-0"
            title={isZenMode ? "Sair do modo foco (Esc)" : "Voltar"}
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
            placeholder="Digite o título da nota..."
            className="w-full bg-transparent border-b-2 border-dashed border-border/40 hover:border-border/80 focus:border-solid focus:border-amber-500/80 text-xl font-bold outline-none text-foreground placeholder-muted-foreground/30 py-1.5 px-1 h-auto focus:ring-0 focus-visible:ring-0 transition-all tracking-tight"
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
                  ? "bg-background text-foreground"
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
                  ? "bg-background text-foreground"
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

          {/* Criar Flashcard da Nota */}
          <button
            type="button"
            onClick={handleOpenFlashcard}
            title="Criar Flashcard a partir da nota"
            className="p-2 rounded-xl border border-border/30 text-indigo-500 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Modo Zen / Foco Total */}
          <button
            type="button"
            onClick={() => setIsZenMode((z) => !z)}
            title={
              isZenMode ? "Sair do modo foco (Esc)" : "Entrar no modo foco zen"
            }
            className={cn(
              "p-2 rounded-xl border border-border/30 transition-colors cursor-pointer",
              isZenMode
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            {isZenMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

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
            <DropdownMenuContent className="bg-card border-border text-foreground min-w-37.5 rounded-xl">
              <DropdownMenuItem
                onClick={handleOpenFlashcard}
                className="text-xs gap-2 cursor-pointer font-medium"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Criar Flashcard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsZenMode((z) => !z)}
                className="text-xs gap-2 cursor-pointer font-medium"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                {isZenMode ? "Sair do modo foco" : "Modo foco zen"}
              </DropdownMenuItem>
              <div className="h-px bg-border/50 my-1" />
              <DropdownMenuItem
                onClick={() => note.id && onDelete(note.id)}
                className="text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg m-1 text-xs gap-2 font-medium"
              >
                <Trash2 className="w-4 h-4" /> Excluir nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/*  BUBBLE TOOLBAR FLUTUANTE (SELEÇÃO)  */}
      {selectionActive && (
        <div
          className="fixed bg-card border border-border text-foreground px-2.5 py-1.5 rounded-xl z-50 flex items-center gap-1 duration-150 animate-in fade-in zoom-in-95 select-none"
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
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleOpenFlashcard();
            }}
            className="p-2 rounded-lg hover:bg-indigo-500/10 text-indigo-500 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Transformar seleção em Flashcard"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Área de edição do conteúdo  */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click on wrapper area is a focus forwarding convenience helper */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Click on wrapper area is a focus forwarding convenience helper */}
      <div
        className={cn(
          "flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background/5",
          isZenMode && "p-8 md:p-16",
        )}
        onClick={() => editorRef.current?.focus()}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Event propagation interception for WikiLinks */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Event propagation interception for WikiLinks */}
        <div
          className={cn(
            "max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-full",
            isZenMode && "max-w-3xl",
          )}
          onClick={(e) => {
            const target = (e.target as HTMLElement).closest("[data-wiki]");
            if (target) {
              const wikiTitle = target.getAttribute("data-wiki");
              if (wikiTitle && onNavigateWikiLink) {
                e.preventDefault();
                e.stopPropagation();
                onNavigateWikiLink(wikiTitle);
                return;
              }
            }
            e.stopPropagation();
          }}
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
            onPaste={handlePaste}
            onSelect={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className={cn(
              "w-full h-full min-h-75 outline-none editor-content select-text font-sans text-foreground pb-20",
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
          className="fixed bg-card/95 backdrop-blur-md border border-border text-foreground w-64 rounded-2xl z-50 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            top: slashCoords.top,
            left: slashCoords.left,
          }}
        >
          <div className="max-h-55 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
            <div className="px-2.5 py-1.5 text-[9px] font-bold text-muted-foreground/60 select-none">
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

      {/*  PALETA DE WIKILINKS "[["  */}
      {wikiMenuOpen && (
        <div
          className="fixed bg-card/95 backdrop-blur-md border border-border text-foreground w-72 rounded-2xl z-50 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{
            top: wikiCoords.top,
            left: wikiCoords.left,
          }}
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
            <div className="px-2.5 py-1.5 text-[9px] font-bold text-muted-foreground/60 select-none flex items-center justify-between">
              <span>Referenciar Nota</span>
              <span className="text-[8px] text-muted-foreground/40 font-normal">
                Enter ou Tab para inserir
              </span>
            </div>
            {filteredWikiNotes.length === 0 ? (
              <div className="px-2.5 py-3 text-xs text-muted-foreground text-center font-medium">
                Nenhuma nota encontrada com "{wikiQuery}"
              </div>
            ) : (
              filteredWikiNotes.map((item, idx) => (
                <button
                  key={item.id}
                  id={`wiki-item-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => handleWikiSelect(item.title)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer",
                    idx === selectedWikiIndex
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[11px] leading-tight text-foreground truncate">
                      {item.title || "Nota sem título"}
                    </div>
                    {item.path && (
                      <div className="text-[9px] text-muted-foreground/80 leading-tight mt-0.5 truncate">
                        {item.path}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <CreateFlashcardFromNoteModal
        isOpen={isFlashcardModalOpen}
        initialFront={flashcardFront}
        initialBack={flashcardBack}
        noteTitle={title || "Nota"}
        onClose={() => setIsFlashcardModalOpen(false)}
      />

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
        }
        .editor-content h2 {
          font-size: 1.5rem; /* 24px */
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
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

  // Se estiver no Modo Zen, renderiza via Portal no document.body para cobrir 100% da tela (acima da sidebar)
  if (isZenMode && typeof document !== "undefined") {
    return createPortal(editorBody, document.body);
  }

  return editorBody;
}
