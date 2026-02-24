import { Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NoteFormProps {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  onAdd: () => void;
}

export function NoteForm({
  title,
  setTitle,
  content,
  setContent,
  onAdd,
}: NoteFormProps) {
  return (
    <Card className="flex-1 bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
      <CardHeader className="bg-linear-to-br from-amber-500/10 to-transparent">
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-amber-500">
          <StickyNote className="w-6 h-6" />
          Nova Nota
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <Input
          placeholder="Título da nota"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-neutral-800 border-neutral-700 h-10 font-bold"
        />
        <textarea
          placeholder="Escreva algo importante..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-3 text-sm text-white min-h-[120px] outline-none focus:border-amber-500 transition-colors"
        />
        <Button
          onClick={onAdd}
          className="w-full bg-amber-500 text-black font-bold h-10 hover:bg-amber-600 mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Salvar Nota Local
        </Button>
      </CardContent>
    </Card>
  );
}
