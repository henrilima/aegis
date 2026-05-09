"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  AlertTriangle,
  Book,
  DownloadCloud,
  HelpCircle,
  LayoutGrid,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { DictionaryInfoModal } from "./components/DictionaryInfoModal";
import { DictionaryResultModal } from "./components/DictionaryResultModal";
import { DictionaryTranslationModal } from "./components/DictionaryTranslationModal";
import type { DictionaryEntry, GlossaryWord } from "./types";

type TabId = "all" | "favorites";

export default function DictionaryPage() {
  const { user } = useAuth();
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);
  const [glossary, setGlossary] = useState<GlossaryWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [glossarySearch, setGlossarySearch] = useState("");

  const [searchResult, setSearchResult] = useState<DictionaryEntry[] | null>(
    null,
  );
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showTranslationInfo, setShowTranslationInfo] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const uid = user ? String(user.id) : "";

  const fetchGlossary = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<GlossaryWord[]>("dictionary_list", {
        userId: uid,
      });
      setGlossary(res);
    } catch {
      toast.error("Erro ao sincronizar glossário");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchGlossary();
    const handleUpdate = () => fetchGlossary();
    window.addEventListener("glossary-updated", handleUpdate);
    return () => window.removeEventListener("glossary-updated", handleUpdate);
  }, [fetchGlossary]);

  const removeWord = async (id: number) => {
    try {
      await invoke("dictionary_delete", { id });
      setGlossary((prev) => prev.filter((w) => w.id !== id));
      toast.success("Removida do glossário");
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFavorite = async (word: GlossaryWord) => {
    try {
      await invoke("dictionary_toggle_favorite", {
        id: word.id,
        isFavorite: !word.isFavorite,
      });
      setGlossary((prev) =>
        prev.map((w) =>
          w.id === word.id ? { ...w, isFavorite: !word.isFavorite } : w,
        ),
      );
    } catch {
      toast.error("Erro ao favoritar");
    }
  };

  const addToGlossary = async (entry: DictionaryEntry, definition: string) => {
    if (!uid) return;
    try {
      await invoke("dictionary_add", {
        word: {
          userId: uid,
          word: entry.word,
          definition: definition,
          phonetic: entry.phonetic,
          sourceUrl: entry.sourceUrls?.[0],
          isFavorite: false,
          createdAt: new Date().toISOString(),
        },
      });
      toast.success("Palavra adicionada ao glossário!");
      setIsResultModalOpen(false);
      fetchGlossary();
    } catch (_err) {
      toast.error("Erro ao adicionar palavra");
    }
  };

  const handleWordClick = (word: GlossaryWord) => {
    const entry: DictionaryEntry = {
      word: word.word,
      phonetic: word.phonetic,
      phonetics: [],
      meanings: [
        {
          partOfSpeech: "Salvo no Glossário",
          definitions: [
            {
              definition: word.definition,
              synonyms: [],
              antonyms: [],
            },
          ],
        },
      ],
      sourceUrls: word.sourceUrl ? [word.sourceUrl] : [],
    };
    setSearchResult([entry]);
    setIsResultModalOpen(true);
  };

  const filteredGlossary = glossary.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      word.definition.toLowerCase().includes(glossarySearch.toLowerCase());
    const matchesTab = tab === "all" || word.isFavorite;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: glossary.length,
    favorites: glossary.filter((w) => w.isFavorite).length,
  };

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("toggle-dictionary-search"));
  };

  const handleExportCSV = async () => {
    try {
      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "aegis_glossario_backup.csv",
      });
      if (!filePath) return;
      await invoke("dictionary_export_csv", { userId: uid, path: filePath });
      toast.success("Exportação concluída!");
    } catch (e) {
      toast.error(`Falha ao exportar: ${e}`);
    }
  };

  const handleImportCSV = async () => {
    try {
      const filePath = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (filePath && typeof filePath === "string") {
        const count = await invoke<number>("dictionary_import_csv", {
          userId: uid,
          path: filePath,
        });
        toast.success(`${count} palavras importadas!`);
        fetchGlossary();
      }
    } catch (e) {
      toast.error(`Erro na importação: ${e}`);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6">
        <CardSkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <ModuleHeader
        color={getModuleColor("dictionary")}
        title="Dicionário & Léxico"
        subtitle={`${stats.total} ${stats.total === 1 ? "termo" : "termos"} · ${stats.favorites} favoritos`}
        icon={Book}
        tabs={[
          { id: "all", label: "Todos", icon: LayoutGrid },
          { id: "favorites", label: "Favoritos", icon: Star },
        ]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
        searchValue={glossarySearch}
        onSearchChange={setGlossarySearch}
        searchPlaceholder="Filtrar glossário..."
        actions={[
          {
            id: "import",
            label: "Importar",
            icon: UploadCloud,
            tooltip: "Importar de CSV",
            onClick: handleImportCSV,
          },
          {
            id: "export",
            label: "Exportar",
            icon: DownloadCloud,
            tooltip: "Exportar para CSV",
            onClick: handleExportCSV,
          },
          {
            id: "translation",
            label: "Tradução",
            icon: AlertTriangle,
            tooltip: "Aviso de Tradução",
            onClick: () => setShowTranslationInfo(true),
          },
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "new",
            label: "Nova Palavra",
            icon: Plus,
            tooltip: "Adicionar Nova Palavra",
            primary: true,
            onClick: openSearch,
          },
        ]}
      />

      <div className="w-full h-px bg-border/50" />

      {/* LISTA DE CARDS COMPACTOS */}
      <div className="flex flex-col gap-4">
        {filteredGlossary.length === 0 ? (
          <EmptyState
            icon={Book}
            title={
              glossarySearch
                ? "Nenhuma palavra encontrada"
                : "Seu glossário está vazio"
            }
            description={
              glossarySearch
                ? "Tente mudar os termos da busca."
                : "Adicione palavras para memorizar."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlossary.map((word, i) => (
              <div
                key={word.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* biome-ignore lint/a11y/useSemanticElements: Card has nested action buttons */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleWordClick(word)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleWordClick(word);
                    }
                  }}
                  className={cn(
                    "group relative w-full text-left bg-card border border-border rounded-2xl p-5 transition-all flex flex-col gap-3 outline-none cursor-pointer",
                    theme.borderHover.replace("hover:", "focus:"),
                    word.isFavorite && cn(theme.border, theme.bg),
                  )}
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h3
                        className={cn(
                          "text-lg font-bold text-foreground transition-colors truncate",
                          theme.textDarkHover,
                        )}
                      >
                        {word.word}
                      </h3>
                      {word.phonetic && (
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {word.phonetic}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <ToolTip
                        content={
                          word.isFavorite
                            ? "Remover dos Favoritos"
                            : "Marcar como Favorito"
                        }
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(word);
                          }}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            word.isFavorite
                              ? cn(theme.text, theme.bg)
                              : cn(
                                  "text-muted-foreground",
                                  theme.textSub,
                                  theme.bgHover,
                                ),
                          )}
                        >
                          <Star
                            className={cn(
                              "w-3.5 h-3.5",
                              word.isFavorite && "fill-current",
                            )}
                          />
                        </button>
                      </ToolTip>
                      <ToolTip content="Remover do Glossário">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(word.id ?? null);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </ToolTip>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic opacity-80">
                    "{word.definition}"
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50 w-full">
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                      Léxico
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/30">
                      {new Date(word.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DictionaryInfoModal show={showInfo} onClose={() => setShowInfo(false)} />
      <DictionaryTranslationModal
        isOpen={showTranslationInfo}
        onClose={() => setShowTranslationInfo(false)}
      />

      {deletingId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteGlossaryWord}
          onConfirm={() => removeWord(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <DictionaryResultModal
        results={searchResult}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onSave={addToGlossary}
      />
    </div>
  );
}
