import { AlertCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Card className="w-full max-w-sm border-amber-900/50 bg-neutral-900 shadow-2xl shadow-amber-950/20 animate-in zoom-in-95 duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase ">
              Registro de Deslize
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Resetar Sequência?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Você está prestes a registrar um deslize. Sua{" "}
            <strong className="text-amber-500">
              sequência atual será zerada
            </strong>{" "}
            e o contador de deslizes totais será incrementado.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            variant="destructive"
            className="w-full font-bold h-11 bg-amber-700 hover:bg-amber-600 border-none shadow-lg shadow-amber-900/20"
            onClick={onConfirm}
          >
            <History className="w-4 h-4 mr-2" /> Sim, Resetar Sequência
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
