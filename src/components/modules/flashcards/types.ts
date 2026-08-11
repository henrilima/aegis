export interface FlashcardFolder {
  id?: number;
  userId: string;
  name: string;
  parentId?: number | null;
  color?: string | null;
  icon?: string | null;
  createdAt: string;
}

export interface FlashcardDeck {
  id?: number;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  icon?: string | null;
  folderId?: number | null;
}

export interface Flashcard {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  reviewCount: number;
  successCount: number;
  lastReviewed?: string | null;
  createdAt: string;
}
