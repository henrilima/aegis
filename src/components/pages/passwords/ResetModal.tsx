import { Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface ResetModalProps {
  resetStep: number;
  resetConfirmText: string;
  setResetConfirmText: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetModal({
  resetStep,
  resetConfirmText,
  setResetConfirmText,
  onClose,
  onConfirm,
}: ResetModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-neutral-900 shadow-2xl animate-in zoom-in duration-300">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />{" "}
            {resetStep === 1 ? "Confirmar Exclusão" : "Verificação Necessária"}
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {resetStep === 1
              ? "Esta ação apagará permanentemente TODAS as suas senhas salvas localmente nesta conta."
              : "Por favor, digite a frase abaixo para confirmar que você entende os riscos."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetStep === 2 && (
            <div className="space-y-2">
              <Label className="text-sm text-neutral-500">
                Digite: "
                <span className="text-indigo-400 font-mono font-bold">
                  desejo apagar todas as senhas
                </span>
                "
              </Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Digite a frase aqui..."
                className="border-red-900/30 focus:border-red-500"
                onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            variant={resetStep === 1 ? "outline" : "destructive"}
            className={resetStep === 2 ? "bg-red-700! hover:bg-red-800!" : ""}
          >
            {resetStep === 1 ? "Continuar" : "Confirmar exclusão"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
