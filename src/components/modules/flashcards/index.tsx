"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Brain,
  Folder,
  FolderPlus,
  HelpCircle,
  Play,
  Plus,
  Sparkles,
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
import { DraggableDeckCard } from "./components/DraggableDeckCard";
import { DroppableBreadcrumb } from "./components/DroppableBreadcrumb";
import { DroppableFolderCard } from "./components/DroppableFolderCard";
import { FlashcardsGuidePanel } from "./components/FlashcardsInfoModal";
import { ReportsTab } from "./components/ReportsTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { DeckFormModal } from "./DeckFormModal";
import { FolderFormModal } from "./FolderFormModal";
import { MoveDeckModal } from "./MoveDeckModal";
import { StudyModal } from "./StudyModal";
import type { Flashcard, FlashcardDeck, FlashcardFolder } from "./types";

interface RichFlashcardDeck extends FlashcardDeck {
  cards: Flashcard[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const FLASHCARD_TABS = [
  { id: "baralhos", label: "Baralhos", icon: BookOpen },
  { id: "templates", label: "Templates", icon: Sparkles },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

function isCardDue(card: Flashcard): boolean {
  if (!card.lastReviewed) {
    return true;
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
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState<
    "baralhos" | "reports" | "templates" | "guia"
  >("baralhos");
  const [preGuideTab, setPreGuideTab] = useState<
    "baralhos" | "reports" | "templates" | "guia"
  >("baralhos");

  const moduleColor = getModuleColor("flashcards");
  const mTheme = getColorTheme(moduleColor);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [selectedFolderForEdit, setSelectedFolderForEdit] = useState<
    FlashcardFolder | undefined
  >(undefined);
  const [folderToDelete, setFolderToDelete] = useState<FlashcardFolder | null>(
    null,
  );

  const [isMoveDeckOpen, setIsMoveDeckOpen] = useState(false);
  const [selectedDeckForMove, setSelectedDeckForMove] =
    useState<FlashcardDeck | null>(null);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [studyCustomCards, setStudyCustomCards] = useState<
    Flashcard[] | undefined
  >(undefined);

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

  const fetchFolders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const fetchedFolders = await invoke<FlashcardFolder[]>(
        "flashcards_list_folders",
        { userId: user.id },
      );
      setFolders(fetchedFolders);
    } catch (err) {
      console.error("[Flashcards] Erro ao carregar pastas:", err);
    }
  }, [user?.id]);

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
    fetchFolders();
    fetchDecks();
  }, [fetchFolders, fetchDecks]);

  const handleSaveDeck = async (deckData: {
    name: string;
    description: string;
    color: string;
    icon?: string;
  }) => {
    if (!user?.id) return;
    try {
      if (selectedDeckForEdit?.id) {
        const updated: FlashcardDeck = {
          ...selectedDeckForEdit,
          name: deckData.name,
          description: deckData.description,
          color: deckData.color,
          icon: deckData.icon,
        };
        await invoke("flashcards_update_deck", { deck: updated });
      } else {
        const newDeck: FlashcardDeck = {
          userId: user.id,
          name: deckData.name,
          description: deckData.description,
          color: deckData.color,
          createdAt: new Date().toISOString(),
          icon: deckData.icon,
          folderId: currentFolderId,
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

  const handleSaveFolder = async (folderData: {
    name: string;
    color?: string;
    icon?: string;
  }) => {
    if (!user?.id) return;
    try {
      if (selectedFolderForEdit?.id) {
        const updated: FlashcardFolder = {
          ...selectedFolderForEdit,
          name: folderData.name,
          color: folderData.color,
          icon: folderData.icon,
        };
        await invoke("flashcards_update_folder", { folder: updated });
      } else {
        const newFolder: FlashcardFolder = {
          userId: user.id,
          name: folderData.name,
          parentId: currentFolderId,
          color: folderData.color,
          icon: folderData.icon,
          createdAt: new Date().toISOString(),
        };
        await invoke("flashcards_add_folder", { folder: newFolder });
      }
      fetchFolders();
    } catch (err) {
      console.error("[Flashcards] Erro ao salvar pasta:", err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete || !folderToDelete.id) return;
    try {
      await invoke("flashcards_delete_folder", { id: folderToDelete.id });
      setFolderToDelete(null);
      fetchFolders();
      fetchDecks();
    } catch (err) {
      console.error("[Flashcards] Erro ao excluir pasta:", err);
    }
  };

  const handleMoveDeck = async (targetFolderId: number | null) => {
    if (!selectedDeckForMove || !selectedDeckForMove.id) return;
    try {
      await invoke("flashcards_move_deck", {
        deckId: selectedDeckForMove.id,
        folderId: targetFolderId,
      });
      setSelectedDeckForMove(null);
      setIsMoveDeckOpen(false);
      fetchDecks();
    } catch (err) {
      console.error("[Flashcards] Erro ao mover baralho:", err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!activeId.startsWith("deck-")) return;

    const deckId = Number(activeId.replace("deck-", ""));
    let targetFolderId: number | null = null;

    if (overId.startsWith("folder-")) {
      targetFolderId = Number(overId.replace("folder-", ""));
    } else if (overId.startsWith("breadcrumb-")) {
      const crumbTarget = overId.replace("breadcrumb-", "");
      targetFolderId = crumbTarget === "root" ? null : Number(crumbTarget);
    } else {
      return;
    }

    if (Number.isNaN(deckId)) return;

    try {
      await invoke("flashcards_move_deck", {
        deckId,
        folderId: targetFolderId,
      });
      toast.success("Baralho movido com sucesso!");
      fetchDecks();
    } catch (err) {
      console.error("[Flashcards] Erro ao mover baralho via drag & drop:", err);
      toast.error("Erro ao mover baralho");
    }
  };

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: number | null; name: string }[] = [
      { id: null, name: "Início" },
    ];
    let currId = currentFolderId;
    const path: FlashcardFolder[] = [];
    while (currId !== null && currId !== undefined) {
      const found = folders.find((f) => f.id === currId);
      if (found) {
        path.unshift(found);
        currId = found.parentId ?? null;
      } else {
        break;
      }
    }
    for (const f of path) {
      crumbs.push({ id: f.id ?? null, name: f.name });
    }
    return crumbs;
  }, [currentFolderId, folders]);

  const isSearching = Boolean(searchValue || selectedTag);

  const visibleFolders = useMemo(() => {
    if (isSearching) return [];
    return folders.filter((f) => (f.parentId ?? null) === currentFolderId);
  }, [folders, currentFolderId, isSearching]);

  const visibleDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesSearch =
        deck.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        deck.description.toLowerCase().includes(searchValue.toLowerCase());

      if (selectedTag) {
        const deckTags = deck.description.match(/#\w+/g) || [];
        const hasTag = deckTags.some(
          (tag) => tag.toLowerCase() === selectedTag.toLowerCase(),
        );
        return matchesSearch && hasTag;
      }

      if (isSearching) return matchesSearch;

      return (deck.folderId ?? null) === currentFolderId;
    });
  }, [decks, searchValue, selectedTag, isSearching, currentFolderId]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return rectIntersection(args);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col gap-6 pb-12 text-foreground">
        <ModuleHeader
          moduleId="flashcards"
          color={getModuleColor("flashcards")}
          title="Flashcards"
          subtitle="Memorização ativa e repetição espaçada para impulsionar seus estudos"
          icon={Brain}
          searchValue={activeTab === "baralhos" ? searchValue : undefined}
          onSearchChange={activeTab === "baralhos" ? setSearchValue : undefined}
          searchPlaceholder="Pesquisar baralhos..."
          tabs={FLASHCARD_TABS}
          activeTab={activeTab}
          onTabChange={(id) =>
            setActiveTab(id as "baralhos" | "reports" | "templates" | "guia")
          }
          onTitleClick={() => {
            if (activeTab !== "guia") {
              setPreGuideTab(activeTab);
              setActiveTab("guia");
            }
          }}
          titleHoverIcon={HelpCircle}
          titleTooltip="Visualizar Guia de Flashcards"
          actions={[
            ...(dueCards.length > 0
              ? [
                  {
                    id: "review-due",
                    label: `Revisão diária global (${dueCards.length})`,
                    icon: Play,
                    primary: true,
                    onClick: () => {
                      setStudyCustomCards(dueCards);
                      setIsStudyOpen(true);
                    },
                  },
                ]
              : []),
            {
              id: "add-folder",
              label: "Nova pasta",
              icon: FolderPlus,
              onClick: () => {
                setSelectedFolderForEdit(undefined);
                setIsFolderFormOpen(true);
              },
            },
            {
              id: "add-deck",
              label: "Novo baralho",
              icon: Plus,
              primary: dueCards.length === 0,
              onClick: () => {
                setSelectedDeckForEdit(undefined);
                setIsDeckFormOpen(true);
              },
            },
          ]}
        />

        {activeTab === "guia" ? (
          <FlashcardsGuidePanel onBack={() => setActiveTab(preGuideTab)} />
        ) : activeTab === "templates" ? (
          <TemplatesTab
            onImportComplete={() => {
              fetchDecks();
              setActiveTab("baralhos");
            }}
          />
        ) : activeTab === "baralhos" ? (
          loading ? (
            <div className="grow flex items-center justify-center text-xs text-muted-foreground py-20">
              Carregando seus baralhos...
            </div>
          ) : (
            <>
              {!isSearching && (
                <DroppableBreadcrumb
                  breadcrumbs={breadcrumbs}
                  currentFolderId={currentFolderId}
                  onNavigate={setCurrentFolderId}
                />
              )}

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center animate-in fade-in duration-300">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">
                    Filtrar por tags:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
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
                      onClick={() =>
                        setSelectedTag(selectedTag === tag ? null : tag)
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
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

              {visibleFolders.length === 0 && visibleDecks.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={
                    searchValue || selectedTag
                      ? "Nenhum baralho encontrado"
                      : "Esta pasta está vazia"
                  }
                  description={
                    searchValue || selectedTag
                      ? "Tente buscar por termos diferentes ou limpe os filtros."
                      : "Crie novas pastas ou baralhos para começar a organizar seus estudos."
                  }
                />
              ) : (
                <div className="flex flex-col gap-6">
                  {visibleFolders.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Folder className={cn("w-4 h-4", mTheme.text)} />
                        <h3 className="font-bold text-sm text-foreground">
                          Pastas ({visibleFolders.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {visibleFolders.map((folder) => (
                          <DroppableFolderCard
                            key={`folder-${folder.id}`}
                            folder={folder}
                            deckCount={
                              decks.filter((d) => d.folderId === folder.id)
                                .length
                            }
                            onOpen={() => setCurrentFolderId(folder.id ?? null)}
                            onEdit={() => {
                              setSelectedFolderForEdit(folder);
                              setIsFolderFormOpen(true);
                            }}
                            onDelete={() => setFolderToDelete(folder)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {visibleDecks.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className={cn("w-4 h-4", mTheme.text)} />
                        <h3 className="font-bold text-sm text-foreground">
                          Baralhos ({visibleDecks.length})
                        </h3>
                      </div>
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                      >
                        {visibleDecks.map((deck) => (
                          <DraggableDeckCard
                            key={`deck-${deck.id}`}
                            deck={deck}
                            onStudy={() => {
                              setSelectedDeckForStudy(deck);
                              setIsStudyOpen(true);
                            }}
                            onManageCards={() => {
                              setSelectedDeckForCards(deck);
                              setIsCardListOpen(true);
                            }}
                            onMove={() => {
                              setSelectedDeckForMove(deck);
                              setIsMoveDeckOpen(true);
                            }}
                            onEdit={() => {
                              setSelectedDeckForEdit(deck);
                              setIsDeckFormOpen(true);
                            }}
                            onDelete={() => setDeckToDelete(deck)}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          <ReportsTab decks={decks} />
        )}

        <DeckFormModal
          isOpen={isDeckFormOpen}
          onClose={() => {
            setIsDeckFormOpen(false);
            setSelectedDeckForEdit(undefined);
          }}
          onSave={handleSaveDeck}
          deck={selectedDeckForEdit}
        />

        <FolderFormModal
          isOpen={isFolderFormOpen}
          onClose={() => {
            setIsFolderFormOpen(false);
            setSelectedFolderForEdit(undefined);
          }}
          onSave={handleSaveFolder}
          folder={selectedFolderForEdit}
        />

        <MoveDeckModal
          isOpen={isMoveDeckOpen}
          onClose={() => {
            setIsMoveDeckOpen(false);
            setSelectedDeckForMove(null);
          }}
          onMove={handleMoveDeck}
          deck={selectedDeckForMove}
          folders={folders}
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

        {folderToDelete && (
          <ConfirmModal
            title="Excluir pasta?"
            description={`Tem certeza que deseja excluir a pasta "${folderToDelete.name}"? Os baralhos armazenados nela serão movidos para o nível raiz.`}
            confirmLabel="Excluir"
            cancelLabel="Agora não"
            variant="danger"
            onConfirm={handleDeleteFolder}
            onCancel={() => setFolderToDelete(null)}
          />
        )}
      </div>
    </DndContext>
  );
}
