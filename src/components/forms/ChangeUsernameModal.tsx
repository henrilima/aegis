"use client";

import { invoke } from "@tauri-apps/api/core";
import { User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getThemeColor } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ChangeUsernameModalProps {
  onClose: () => void;
}

export default function ChangeUsernameModal({
  onClose,
}: ChangeUsernameModalProps) {
  const theme = getThemeColor();
  const { user, updateUsername } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newUsername.trim()) {
      setError("O nome de usuário não pode estar vazio.");
      return;
    }

    if (newUsername === user.username) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await invoke("change_username", {
        userId: user.id,
        newUsername: newUsername.trim(),
      });

      updateUsername(newUsername.trim());
      toast.success("Nome de usuário alterado com sucesso!");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 ${theme.bg} rounded-xl border ${theme.border}`}
            >
              <User className={`w-5 h-5 ${theme.textSub}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Alterar Usuário
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Identidade Digital
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="newUsername"
                className="text-xs font-medium text-neutral-400 ml-0.5"
              >
                Novo nome de usuário
              </Label>
              <Input
                id="newUsername"
                placeholder="Ex: NovoNome"
                className="bg-neutral-900/50 border-neutral-800 h-12 rounded-xl text-sm font-bold placeholder:text-neutral-700 focus:ring-1 focus:ring-violet-500/50 transition-all px-4"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top-2">
                <p className="text-red-500 text-[11px] font-bold text-center">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={
                loading || !newUsername.trim() || newUsername === user?.username
              }
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover} ${theme.text} ${theme.textDarkHover} text-sm font-bold transition-all active:scale-[0.98] cursor-pointer`}
            >
              {loading ? "Processando..." : "Confirmar alteração"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
            >
              Agora não
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
