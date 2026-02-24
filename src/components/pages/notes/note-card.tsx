import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "./types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: number) => void;
}

export function NoteCard({ note: n, onDelete }: NoteCardProps) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 group hover:border-amber-500/30 transition-all">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold truncate pr-6">
          {n.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => n.id && onDelete(n.id)}
          className="text-neutral-700 hover:text-red-500 h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-400 text-sm line-clamp-4 whitespace-pre-wrap">
          {n.content}
        </p>
        <p className="text-[10px] text-neutral-600 mt-4 uppercase font-bold">
          {new Date(n.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
