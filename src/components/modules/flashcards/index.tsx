"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Brain,
  DownloadCloud,
  Edit2,
  HelpCircle,
  MoreVertical,
  Play,
  Plus,
  Settings,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { CardListModal } from "./CardListModal";
import { FlashcardsInfoModal } from "./components/FlashcardsInfoModal";
import { ReportsTab } from "./components/ReportsTab";
import { DeckFormModal } from "./DeckFormModal";
import { StudyModal } from "./StudyModal";
import type { Flashcard, FlashcardDeck } from "./types";

const getGroupHoverTextClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "group-hover:text-blue-400",
    sky: "group-hover:text-sky-400",
    cyan: "group-hover:text-cyan-400",
    indigo: "group-hover:text-indigo-400",
    violet: "group-hover:text-violet-400",
    purple: "group-hover:text-purple-400",
    fuchsia: "group-hover:text-fuchsia-400",
    pink: "group-hover:text-pink-400",
    rose: "group-hover:text-rose-400",
    red: "group-hover:text-red-400",
    orange: "group-hover:text-orange-400",
    amber: "group-hover:text-amber-400",
    yellow: "group-hover:text-yellow-400",
    lime: "group-hover:text-lime-400",
    green: "group-hover:text-green-400",
    emerald: "group-hover:text-emerald-400",
    teal: "group-hover:text-teal-400",
    slate: "group-hover:text-slate-400",
    zinc: "group-hover:text-zinc-400",
    neutral: "group-hover:text-neutral-400",
    stone: "group-hover:text-stone-400",
    coffee: "group-hover:text-amber-800",
    carbon: "group-hover:text-zinc-400",
  };
  return map[color] || "group-hover:text-blue-400";
};

interface RichFlashcardDeck extends FlashcardDeck {
  cards: Flashcard[];
}

// Variantes para animação de entrada escalonada (staggered entrance)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
} as const;

const FLASHCARD_TABS = [
  { id: "baralhos", label: "Baralhos", icon: BookOpen },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

// Helper para determinar se um cartão está devido com base no algoritmo de repetição espaçada
function isCardDue(card: Flashcard): boolean {
  if (!card.lastReviewed) {
    return true; // Se nunca foi revisado, está devido!
  }
  const lastDate = new Date(card.lastReviewed);
  const nowDate = new Date();
  const diffTime = Math.abs(nowDate.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const dueDays = Math.round(
    1 +
      card.successCount *
        2 *
        (card.successCount / Math.max(1, card.reviewCount)),
  );

  return diffDays >= dueDays;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<RichFlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState<"baralhos" | "reports">(
    "baralhos",
  );

  // Modals state
  const [isDeckFormOpen, setIsDeckFormOpen] = useState(false);
  const [selectedDeckForEdit, setSelectedDeckForEdit] = useState<
    FlashcardDeck | undefined
  >(undefined);

  const [isCardListOpen, setIsCardListOpen] = useState(false);
  const [selectedDeckForCards, setSelectedDeckForCards] = useState<
    FlashcardDeck | undefined
  >(undefined);

  const [isStudyOpen, setIsStudyOpen] = useState(false);
  const [selectedDeckForStudy, setSelectedDeckForStudy] = useState<
    FlashcardDeck | undefined
  >(undefined);

  const [deckToDelete, setDeckToDelete] = useState<RichFlashcardDeck | null>(
    null,
  );
  const [showInfo, setShowInfo] = useState(false);

  // Estados para hashtags e estudos personalizados da revisão diária global
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [studyCustomCards, setStudyCustomCards] = useState<
    Flashcard[] | undefined
  >(undefined);

  // Extrai todas as hashtags das descrições dos baralhos
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    for (const deck of decks) {
      if (deck.description) {
        const matches = deck.description.match(/#\w+/g);
        if (matches) {
          for (const match of matches) {
            tagsSet.add(match.toLowerCase());
          }
        }
      }
    }
    return Array.from(tagsSet);
  }, [decks]);

  // Filtra cartões que estão devidos com base no algoritmo de repetição espaçada
  const dueCards = useMemo(() => {
    const list: Flashcard[] = [];
    for (const deck of decks) {
      if (deck.cards) {
        for (const card of deck.cards) {
          if (isCardDue(card)) {
            list.push(card);
          }
        }
      }
    }
    return list;
  }, [decks]);

  // Active dropdown state for deck actions
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const handleExportJSON = async () => {
    if (!user?.id) return;
    try {
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "aegis_flashcards_backup.json",
      });
      if (!filePath) return;
      await invoke("flashcards_export_json", {
        userId: user.id,
        path: filePath,
      });
      toast.success("Exportação de flashcards concluída!");
    } catch (e) {
      toast.error(
        `Falha ao exportar flashcards: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleImportJSON = async () => {
    if (!user?.id) return;
    try {
      const filePath = await openDialog({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (filePath && typeof filePath === "string") {
        const count = await invoke<number>("flashcards_import_json", {
          userId: user.id,
          path: filePath,
        });
        toast.success(`${count} cartões de flashcards importados com sucesso!`);
        fetchDecks();
      }
    } catch (e) {
      toast.error(
        `Erro na importação de flashcards: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const fetchDecks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const fetchedDecks = await invoke<FlashcardDeck[]>(
        "flashcards_list_decks",
        { userId: user.id },
      );
      const decksWithCards = await Promise.all(
        fetchedDecks.map(async (deck) => {
          if (!deck.id) return { ...deck, cards: [] };
          const cards = await invoke<Flashcard[]>("flashcards_list_cards", {
            deckId: deck.id,
          });
          return { ...deck, cards };
        }),
      );
      setDecks(decksWithCards);
    } catch (err) {
      console.error("[Flashcards] Erro ao carregar baralhos:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSaveDeck = async (deckData: {
    name: string;
    description: string;
    color: string;
  }) => {
    if (!user?.id) return;
    try {
      if (selectedDeckForEdit?.id) {
        // Update deck
        const updated: FlashcardDeck = {
          ...selectedDeckForEdit,
          name: deckData.name,
          description: deckData.description,
          color: deckData.color,
        };
        await invoke("flashcards_update_deck", { deck: updated });
      } else {
        // Add new deck
        const newDeck: FlashcardDeck = {
          userId: user.id,
          name: deckData.name,
          description: deckData.description,
          color: deckData.color,
          createdAt: new Date().toISOString(),
        };
        await invoke("flashcards_add_deck", { deck: newDeck });
      }
      fetchDecks();
    } catch (err) {
      console.error("[Flashcards] Erro ao salvar baralho:", err);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckToDelete || !deckToDelete.id) return;
    try {
      await invoke("flashcards_delete_deck", { id: deckToDelete.id });
      setDeckToDelete(null);
      fetchDecks();
    } catch (err) {
      console.error("[Flashcards] Erro ao deletar baralho:", err);
    }
  };

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch =
      deck.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchValue.toLowerCase());

    if (!selectedTag) return matchesSearch;

    const deckTags = deck.description.match(/#\w+/g) || [];
    const hasTag = deckTags.some(
      (tag) => tag.toLowerCase() === selectedTag.toLowerCase(),
    );
    return matchesSearch && hasTag;
  });

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-12 text-foreground">
      <ModuleHeader
        color={getModuleColor("flashcards")}
        title="Flashcards"
        subtitle="Memorização ativa e repetição espaçada para impulsionar seus estudos"
        icon={Brain}
        searchValue={activeTab === "baralhos" ? searchValue : undefined}
        onSearchChange={activeTab === "baralhos" ? setSearchValue : undefined}
        searchPlaceholder="Pesquisar baralhos..."
        tabs={FLASHCARD_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as "baralhos" | "reports")}
        actions={[
          {
            id: "import-flashcards",
            label: "Importar",
            icon: UploadCloud,
            tooltip: "Importar baralhos de JSON",
            onClick: handleImportJSON,
          },
          {
            id: "export-flashcards",
            label: "Exportar",
            icon: DownloadCloud,
            tooltip: "Exportar baralhos para JSON",
            onClick: handleExportJSON,
          },
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "add-deck",
            label: "Novo baralho",
            icon: Plus,
            primary: true,
            onClick: () => {
              setSelectedDeckForEdit(undefined);
              setIsDeckFormOpen(true);
            },
          },
        ]}
      />

      {activeTab === "baralhos" ? (
        loading ? (
          <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground py-20">
            Carregando seus baralhos...
          </div>
        ) : (
          <>
            {/* Filtros de Hashtags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center animate-in fade-in duration-300">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">
                  Filtrar por tags:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                    selectedTag === null
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-card border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  Todas
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer",
                      selectedTag === tag
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-card border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Destaque da Revisão Diária Global */}
            {dueCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-blue-500/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-sm"
              >
                {/* Efeito decorativo de brilho */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-8 -mt-8 pointer-events-none" />

                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                    <Brain className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      Revisão Diária Global
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500 text-white">
                        {dueCards.length}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                      Você tem{" "}
                      <span className="font-bold text-blue-400">
                        {dueCards.length} cartões devidos
                      </span>{" "}
                      para revisão hoje entre todos os seus baralhos ativos.
                      Mantenha sua consistência de estudos!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStudyCustomCards(dueCards);
                    setIsStudyOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Estudar devidos agora
                </button>
              </motion.div>
            )}

            {filteredDecks.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={
                  searchValue || selectedTag
                    ? "Nenhum baralho encontrado"
                    : "Nenhum baralho criado"
                }
                description={
                  searchValue || selectedTag
                    ? "Tente buscar por termos diferentes ou limpe os filtros."
                    : "Crie baralhos e adicione cartões para começar a praticar memorização ativa."
                }
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredDecks.map((deck) => {
                  const mDeck = getColorTheme(
                    deck.color || getModuleColor("flashcards"),
                  );
                  const totalCards = deck.cards.length;

                  // Calculate accuracy
                  let totalReviews = 0;
                  let totalSuccess = 0;
                  for (const card of deck.cards) {
                    totalReviews += card.reviewCount;
                    totalSuccess += card.successCount;
                  }
                  const accuracy =
                    totalReviews > 0
                      ? Math.round((totalSuccess / totalReviews) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={deck.id}
                      variants={itemVariants}
                      whileHover={{
                        y: -4,
                        boxShadow: "0 12px 30px -10px rgba(0,0,0,0.3)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="relative rounded-2xl border border-border bg-card/30 hover:border-border/80 hover:bg-card/45 p-6 flex flex-col gap-4 transition-all duration-300 group"
                    >
                      {/* Accent indicator bar on the left */}
                      <div
                        className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-lg ${mDeck.solid}`}
                      />

                      {/* Deck Title & Actions Dropdown */}
                      <div className="flex justify-between items-start pl-2">
                        <div className="min-w-0">
                          <h3
                            className={cn(
                              "font-bold text-base text-foreground truncate transition-colors",
                              getGroupHoverTextClass(
                                deck.color || getModuleColor("flashcards"),
                              ),
                            )}
                          >
                            {deck.name}
                          </h3>
                          <p className="text-xs text-neutral-600 font-medium line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                            {deck.description || "Sem descrição disponível."}
                          </p>
                        </div>

                        <div
                          className="relative shrink-0 ml-2"
                          data-dropdown-container
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (deck.id) {
                                setActiveDropdownId(
                                  activeDropdownId === deck.id ? null : deck.id,
                                );
                              }
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdownId === deck.id && (
                            <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-xl z-20 p-1.5 animate-in fade-in duration-150">
                              <button
                                type="button"
                                disabled={totalCards === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  setSelectedDeckForStudy(deck);
                                  setIsStudyOpen(true);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                                  totalCards === 0
                                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                    : "hover:bg-muted/50 text-foreground"
                                }`}
                              >
                                <Play className="w-3.5 h-3.5 text-muted-foreground" />
                                Estudar
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  setSelectedDeckForCards(deck);
                                  setIsCardListOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-xs font-semibold text-foreground cursor-pointer"
                              >
                                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                                Gerenciar cartões
                              </button>
                              <div className="h-px bg-border/40 my-1 mx-1" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  setSelectedDeckForEdit(deck);
                                  setIsDeckFormOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-xs font-semibold text-foreground cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                Editar baralho
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(null);
                                  setDeckToDelete(deck);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors text-xs font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Deck Stats */}
                      <div className="grid grid-cols-2 gap-3 bg-card/10 border border-border/40 rounded-xl p-3 pl-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Cartões
                          </span>
                          <span className="text-sm font-bold text-foreground mt-0.5">
                            {totalCards}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Aproveitamento
                          </span>
                          <span
                            className={`text-sm font-bold mt-0.5 ${totalReviews > 0 ? "text-emerald-400" : "text-muted-foreground"}`}
                          >
                            {totalReviews > 0 ? `${accuracy}%` : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Deck CTA Actions */}
                      <div className="flex gap-2.5 mt-auto pl-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeckForCards(deck);
                            setIsCardListOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Gerenciar
                        </button>
                        <button
                          type="button"
                          disabled={totalCards === 0}
                          onClick={() => {
                            setSelectedDeckForStudy(deck);
                            setIsStudyOpen(true);
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-white ${
                            totalCards === 0
                              ? "bg-muted text-muted-foreground border border-border/30 opacity-50 cursor-not-allowed"
                              : `${mDeck.solid} ${mDeck.solidHover}`
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          Estudar
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )
      ) : (
        <ReportsTab decks={decks} />
      )}

      {/* Modals Container */}
      <DeckFormModal
        isOpen={isDeckFormOpen}
        onClose={() => {
          setIsDeckFormOpen(false);
          setSelectedDeckForEdit(undefined);
        }}
        onSave={handleSaveDeck}
        deck={selectedDeckForEdit}
      />

      {selectedDeckForCards && (
        <CardListModal
          isOpen={isCardListOpen}
          onClose={() => {
            setIsCardListOpen(false);
            setSelectedDeckForCards(undefined);
          }}
          deck={selectedDeckForCards}
          onCardsChanged={fetchDecks}
        />
      )}

      {(selectedDeckForStudy || studyCustomCards) && (
        <StudyModal
          isOpen={isStudyOpen}
          onClose={() => {
            setIsStudyOpen(false);
            setSelectedDeckForStudy(undefined);
            setStudyCustomCards(undefined);
          }}
          deck={
            selectedDeckForStudy || {
              userId: user?.id || "",
              name: "Revisão Diária Global",
              description: "",
              color: "indigo",
              createdAt: "",
            }
          }
          customCards={studyCustomCards}
          onSessionComplete={fetchDecks}
        />
      )}

      {deckToDelete && (
        <ConfirmModal
          title="Excluir baralho?"
          description={`Esta ação é irreversível e excluirá permanentemente o baralho "${deckToDelete.name}" e todos os seus ${deckToDelete.cards.length} cartões associados.`}
          confirmLabel="Excluir"
          cancelLabel="Agora não"
          variant="danger"
          onConfirm={handleDeleteDeck}
          onCancel={() => setDeckToDelete(null)}
        />
      )}

      <FlashcardsInfoModal show={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}
