import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HardResetDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function HardResetDialog({ onClose, onConfirm }: HardResetDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm border-red-900/50 bg-neutral-900 shadow-2xl shadow-red-950/20 animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase ">
              Atenção Crítica
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Zerar Tudo?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Esta ação é <strong className="text-red-400">irreversível</strong>.
            Você irá zerar suas conclusões totais, sequência atual e todos os
            seus recordes deste hábito.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            variant="destructive"
            className="w-full font-bold h-11 bg-red-600 hover:bg-red-500"
            onClick={onConfirm}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Sim, Zerar Hábito
          </Button>
          <Button
            variant="ghost"
            className="w-full text-neutral-500 hover:text-white hover:bg-neutral-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
