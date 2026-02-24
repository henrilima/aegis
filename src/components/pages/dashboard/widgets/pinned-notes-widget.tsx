import { FileText, Pin } from "lucide-react";
import type { Note } from "@/components/pages/notes/types";
import { Widget } from "./ui";

interface PinnedNotesWidgetProps {
  notes: Note[];
}

export function PinnedNotesWidget({ notes }: PinnedNotesWidgetProps) {
  return (
    <Widget
      title="Notas Fixadas"
      icon={FileText}
      href="/dashboard/notes"
      color="orange"
      description="Destaques"
    >
      <div className="space-y-2 mt-2">
        {notes.length > 0 ? (
          notes.slice(0, 3).map((n) => (
            <div
              key={n.id}
              className="py-3 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-neutral-300 truncate">
                  {n.title}
                </span>
                <Pin className="w-3 h-3 text-orange-500 fill-orange-500/20" />
              </div>
              <p className="text-xs text-white/50 line-clamp-1 font-medium">
                {n.content}
              </p>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-neutral-700 border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-xs font-black uppercase text-white/30">
              Sem notas fixadas
            </p>
          </div>
        )}
      </div>
    </Widget>
  );
}
