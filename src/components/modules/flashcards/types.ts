export interface FlashcardDeck {
  id?: number;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  icon?: string | null;
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
