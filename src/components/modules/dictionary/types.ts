export interface GlossaryWord {
  id?: number;
  userId: string;
  word: string;
  definition: string;
  phonetic?: string;
  sourceUrl?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: {
    text?: string;
    audio?: string;
  }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
  }[];
  sourceUrls: string[];
}
