"use client";

import { Trash2, X } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface ResetModalProps {
  resetStep: number;
  resetConfirmText: string;
  setResetConfirmText: (val: string) => void;
  onClose?: () => void;
  onConfirm: () => void;
}

export function ResetModal({
  resetStep,
  resetConfirmText,
  setResetConfirmText,
  onClose,
  onConfirm,
}: ResetModalProps) {
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const inputStyle =
    "bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-red-500/40 transition-all placeholder:text-neutral-700";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">
                {resetStep === 1
                  ? "Confirmar exclusão"
                  : "Verificação necessária"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Operação crítica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed px-1">
            {resetStep === 1
              ? "Esta ação apagará permanentemente todas as suas senhas salvas localmente nesta conta. Esta operação não pode ser desfeita."
              : "Por favor, digite a frase abaixo para confirmar que você entende os riscos da exclusão permanente."}
          </p>

          {resetStep === 2 && (
            <div className="space-y-2">
              <Label className={lc}>
                Digite:{" "}
                <span className="text-red-600 dark:text-red-400">
                  desejo apagar todas as senhas
                </span>
              </Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Digite a frase aqui..."
                className={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                autoFocus
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 pb-1">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                resetStep === 1
                  ? "bg-neutral-800 border-border text-foreground hover:bg-accent"
                  : "bg-red-500/10 border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200"
              }`}
            >
              {resetStep === 1 ? "Continuar" : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-muted-foreground hover:text-muted-foreground py-2 text-sm font-medium cursor-pointer transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
