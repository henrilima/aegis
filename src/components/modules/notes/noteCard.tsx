import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "./types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: number) => void;
  onClick?: () => void;
}

const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`{1,3}([^`\n]+)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
};

export function NoteCard({ note: n, onDelete, onClick }: NoteCardProps) {
  return (
    <Card
      onClick={onClick}
      className="bg-card border-border group hover:border-amber-500/30 transition-all cursor-pointer h-full flex flex-col"
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold truncate pr-6">
          {n.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            if (n.id) onDelete(n.id);
          }}
          className="text-neutral-700 hover:text-red-500 h-8 w-8 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-muted-foreground text-xs line-clamp-4 w-full pointer-events-none">
          {stripMarkdown(n.content)}
        </div>
        <p className="text-[10px] text-neutral-600 mt-auto pt-4 uppercase font-bold">
          {new Date(n.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
