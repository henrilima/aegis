import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  completed: number;
}

export function StatsCard({ completed }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{completed || 0}</div>
        <p className="text-xs text-neutral-500 uppercase font-semibold">
          Ciclos Concluídos
        </p>
      </CardContent>
    </Card>
  );
}
