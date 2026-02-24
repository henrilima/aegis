"use client";

import { Eye, EyeOff, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  username: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function DeleteAccountModal({
  username,
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Digite sua senha para confirmar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onCancel}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div className="relative w-full max-w-md mx-4 bg-neutral-950 border border-red-500/20 rounded-2xl shadow-2xl shadow-red-900/20 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Deletar Conta</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Esta ação é irreversível
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl space-y-2">
            <p className="text-sm font-bold text-red-400">
              ⚠️ Você está prestes a deletar permanentemente a conta{" "}
              <span className="text-red-300">"{username}"</span>
            </p>
            <ul className="text-xs text-neutral-400 space-y-1 list-disc list-inside">
              <li>Todas as senhas salvas serão removidas</li>
              <li>Todas as notas serão removidas</li>
              <li>Hábitos e histórico do pomodoro serão removidos</li>
              <li>Lembretes de hidratação serão removidos</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-neutral-300 text-sm font-bold"
              >
                Digite sua senha para confirmar
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha local"
                  className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 pr-10 focus:border-red-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="flex-1 border border-neutral-700 hover:bg-neutral-800 cursor-pointer"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="ghost"
                className="flex-1 bg-red-600 text-white hover:bg-red-700 font-bold cursor-pointer border-0 gap-2"
                disabled={loading || !password}
              >
                {loading ? (
                  "Deletando..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Deletar Conta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
