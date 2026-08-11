"use client";

import { invoke } from "@tauri-apps/api/core";
import { BookOpen, Download, Eye, Folder, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getSystemIcon } from "@/components/global/IconSelect";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import {
  type DeckTemplate,
  FLASHCARD_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "../data/templatesData";
import type { Flashcard, FlashcardDeck } from "../types";

interface TemplatesTabProps {
  onImportComplete: () => void;
}

export function TemplatesTab({ onImportComplete }: TemplatesTabProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<DeckTemplate | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const handleImport = async (template: DeckTemplate) => {
    setImportingId(template.id);
    try {
      // 1. Criar o baralho no formato aceito por flashcards_add_deck ({ deck: FlashcardDeck })
      const newDeck: FlashcardDeck = {
        userId: user?.id || "default",
        name: template.name,
        description: template.description,
        color: template.color,
        icon: template.icon,
        folderId: null,
        createdAt: new Date().toISOString(),
      };

      const deckId = await invoke<number>("flashcards_add_deck", {
        deck: newDeck,
      });

      if (!deckId) {
        throw new Error("Falha ao obter ID do baralho criado.");
      }

      // 2. Adicionar todos os cartões do template ({ card: Flashcard })
      for (const card of template.cards) {
        const newCard: Flashcard = {
          deckId,
          front: card.front,
          back: card.back,
          reviewCount: 0,
          successCount: 0,
          createdAt: new Date().toISOString(),
        };
        await invoke("flashcards_add_card", { card: newCard });
      }

      toast.success(
        `Baralho "${template.name}" importado com sucesso com ${template.cards.length} cartões!`,
      );
      onImportComplete();
    } catch (err) {
      console.error("[TemplatesTab] Erro ao importar template:", err);
      toast.error("Falha ao importar o baralho de template.");
    } finally {
      setImportingId(null);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "all") return FLASHCARD_TEMPLATES;
    return FLASHCARD_TEMPLATES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  const groupedTemplates = useMemo(() => {
    const map: Record<string, DeckTemplate[]> = {};
    for (const t of filteredTemplates) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return map;
  }, [filteredTemplates]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Banner Informativo da Biblioteca */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              Biblioteca de Templates Organizada por Categorias
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Explore baralhos pré-configurados agrupados por área do
              conhecimento (Biológicas, Exatas, Idiomas e Humanas). Clique em
              importar para adicionar o baralho completo com 20 cartões
              diretamente à sua biblioteca.
            </p>
          </div>
        </div>
      </div>

      {/* Pílulas de Filtro por Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const CatIcon = getSystemIcon(cat.icon);
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shrink-0",
                isActive
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-card/60 text-muted-foreground hover:text-foreground border-border hover:bg-muted/30",
              )}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Exibição Agrupada por Categorias */}
      <div className="flex flex-col gap-8">
        {Object.entries(groupedTemplates).map(([categoryName, templates]) => (
          <div key={categoryName} className="flex flex-col gap-4">
            {/* Header da Categoria / Pasta */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="p-1.5 rounded-lg bg-muted text-muted-foreground border border-border/50">
                <Folder className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="font-black text-sm text-foreground uppercase tracking-wide">
                {categoryName}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">
                ({templates.length}{" "}
                {templates.length === 1 ? "baralho" : "baralhos"})
              </span>
            </div>

            {/* Grid dos Templates da Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const TemplateIcon = getSystemIcon(template.icon);
                const theme = getColorTheme(template.color);
                const isImporting = importingId === template.id;

                return (
                  <div
                    key={template.id}
                    className="group relative rounded-2xl border border-border bg-card/80 hover:bg-card p-5 flex flex-col justify-between gap-4 transition-all duration-200"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "p-3 rounded-xl border shrink-0 transition-colors",
                            `${theme.bg} ${theme.text} ${theme.border}`,
                          )}
                        >
                          <TemplateIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/50">
                          {template.category}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-foreground group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted/60 text-muted-foreground border border-border/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-2">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        {template.cardsCount} cartões
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsPreviewOpen(true);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
                          title="Pré-visualizar cartões"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isImporting}
                          onClick={() => handleImport(template)}
                          className={cn(
                            "px-4 h-9 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5",
                            `${theme.solid} ${theme.solidHover}`,
                          )}
                        >
                          {isImporting ? (
                            <>
                              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Importar baralho
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Pré-visualização de Cartões do Template */}
      {selectedTemplate && (
        <ModalShell
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          size="lg"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/20">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cartões de &quot;{selectedTemplate.name}&quot;
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibindo {selectedTemplate.cards.length} cartões contidos neste
                template ({selectedTemplate.category})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="px-3 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/60 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>

          <div className="p-6 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {selectedTemplate.cards.map((card, idx) => (
              <div
                key={card.front}
                className="p-3.5 rounded-xl border border-border/60 bg-card/50 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-400">
                    Cartão #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {card.front}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-line border-t border-border/30 pt-1.5">
                  {card.back}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end p-4 border-t border-border/50 bg-card/20">
            <button
              type="button"
              onClick={() => {
                setIsPreviewOpen(false);
                handleImport(selectedTemplate);
              }}
              className="px-5 h-10 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Importar {selectedTemplate.cards.length} cartões agora
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
