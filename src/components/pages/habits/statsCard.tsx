import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  count: number;
}

export function StatsCard({ count }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-xs uppercase text-neutral-500 font-semibold ">
          Hábitos
        </div>
      </CardContent>
    </Card>
  );
}
