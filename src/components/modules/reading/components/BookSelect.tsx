"use client";

import { BookOpen } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { ReadingBook } from "../types";

interface BookSelectProps {
  books: ReadingBook[];
  value?: number;
  onChange: (id: number) => void;
}

/**
 * Dropdown customizado para seleção de livro no SessionModal e NotesTab.
 * Utiliza o SearchableSelect genérico.
 */
export function BookSelect({ books, value, onChange }: BookSelectProps) {
  return (
    <SearchableSelect
      items={books}
      value={value}
      onChange={(item) => typeof item !== "string" && onChange(Number(item.id))}
      placeholder="Selecione o livro..."
      searchPlaceholder="Buscar livro..."
      emptyMessage="Nenhum livro correspondente"
      getItemKey={(b) => Number(b.id)}
      getItemLabel={(b) => b.title}
      moduleName="reading"
      icon={BookOpen}
      mode="combobox"
    />
  );
}
