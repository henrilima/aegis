import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  count: number;
}

export function StatsCard({ count }: StatsCardProps) {
  return (
    <div className="md:w-64 grid grid-cols-1 gap-4">
      <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
        <FileText className="w-8 h-8 text-neutral-500 mb-2" />
        <h3 className="text-2xl font-bold text-white">{count}</h3>
        <p className="text-xs text-neutral-500 uppercase font-bold ">
          Notas Salvas
        </p>
      </Card>
    </div>
  );
}
