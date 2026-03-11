import { AlertTriangle, RotateCcw } from "lucide-react";
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
      <Card className="w-full max-w-sm border border-neutral-800 bg-neutral-900 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-4 pt-8 text-center bg-red-500/5">
          <div className="mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-xl font-black text-neutral-100 uppercase tracking-tight">
            Reset Total?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-xs text-neutral-400 leading-relaxed text-center font-medium px-4">
            Esta ação é <strong className="text-red-400 font-black">irreversível</strong>.
            Limparemos suas conclusões totais, sequências e todos os recordes.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 px-6">
          <button
            type="button"
            className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase transition-all hover:bg-red-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            onClick={onConfirm}
          >
            <RotateCcw className="w-4 h-4" /> Sim, Resetar Histórico
          </button>
          <button
            type="button"
            className="w-full py-3 rounded-xl text-neutral-500 hover:text-neutral-300 text-[10px] font-black uppercase transition-all hover:bg-neutral-800 cursor-pointer"
            onClick={onClose}
          >
            Cancelar
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
