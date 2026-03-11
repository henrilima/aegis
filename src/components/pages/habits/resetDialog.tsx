import { AlertCircle, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResetHabitDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetHabitDialog({
  onClose,
  onConfirm,
}: ResetHabitDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-sm border border-neutral-800 bg-neutral-900 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-4 pt-8 text-center bg-amber-500/5">
          <div className="mx-auto mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <CardTitle className="text-xl font-black text-neutral-100 uppercase tracking-tight">
            Resetar Sequência?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-xs text-neutral-400 leading-relaxed text-center font-medium">
            Você está registrando um deslize. Sua{" "}
            <strong className="text-amber-500 font-black">
              sequência atual será zerada
            </strong>{" "}
            e o contador de deslizas será incrementado.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 px-6">
          <button
            type="button"
            className="w-full py-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase transition-all hover:bg-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            onClick={onConfirm}
          >
            <History className="w-4 h-4" /> Sim, Resetar Sequência
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
