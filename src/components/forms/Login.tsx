"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  ChevronLeft,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DeleteAccountModal } from "./DeleteAccountModal";
import RegisterComponent from "./Register";
import { TermsContent } from "./TermsContent";

interface LocalUser {
  id: string;
  username: string;
  email: string;
}

export default function LoginComponent() {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalUser | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const loadUsers = useCallback(async () => {
    setFetchingUsers(true);
    try {
      const list = await invoke<LocalUser[]>("list_local_users");
      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setFetchingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteAccount = (e: React.MouseEvent, user: LocalUser) => {
    e.stopPropagation();
    setDeleteTarget(user);
  };

  const confirmDeleteAccount = async (password: string) => {
    if (!deleteTarget) return;
    try {
      await invoke("delete_account", { userId: deleteTarget.id, password });
      toast.success(`Conta "${deleteTarget.username}" removida.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      console.error("[LOGIN] Erro ao deletar conta:", err);
      toast.error(String(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    setLoading(true);

    try {
      const userId = await invoke<string>("local_login", {
        email: selectedUser.email,
        password: password,
      });

      await login(userId);
      toast.success("Login realizado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  if (isRegistering) {
    return (
      <RegisterComponent onSwitchToLogin={() => setIsRegistering(false)} />
    );
  }

  return (
    <>
      {deleteTarget && (
        <DeleteAccountModal
          username={deleteTarget.username}
          onConfirm={confirmDeleteAccount}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Privacidade e Termos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <TermsContent className="max-h-[400px] custom-scrollbar" />
              <div className="flex flex-col gap-2 pt-6">
                 <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                >
                  Entendi
                </button>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full bg-neutral-950 border-neutral-800 shadow-2xl shadow-black/60 rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pb-8 p-8">
          <CardTitle className="text-2xl font-black text-amber-500">
            Portal de Identidade
          </CardTitle>
          <CardDescription className="text-neutral-500 font-medium text-xs">
            {selectedUser
              ? `Bem-vindo de volta, ${selectedUser.username}`
              : "Escolha um perfil para iniciar a sessão"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 flex flex-col gap-6">
          {fetchingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs font-medium text-neutral-600">
                Sincronizando perfis...
              </p>
            </div>
          ) : !selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-auto pr-2 custom-scrollbar">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="relative group flex items-center rounded-2xl border border-neutral-900 bg-neutral-900/10 hover:border-amber-500/40 hover:bg-neutral-900/40 transition-all duration-300 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="flex flex-1 items-center gap-4 p-4 text-left cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg transition-transform group-hover:scale-105">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-200 truncate">
                          {u.username}
                        </p>
                        <p className="text-xs font-medium text-neutral-600 truncate mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteAccount(e, u)}
                      className="p-2.5 mr-3 rounded-xl text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Deletar conta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-neutral-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-500 group-hover:text-amber-500 transition-colors">
                      Criar novo usuário
                    </span>
                    <p className="text-[10px] font-medium text-neutral-700 mt-0.5">
                      Provisionar cofre local
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 animate-in slide-in-from-right-4 duration-300"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setPassword("");
                  setError(null);
                }}
                className="flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-amber-500 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Alterar perfil
              </button>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-900 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold text-xl">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">
                    {selectedUser.username}
                  </p>
                  <p className="text-xs font-medium text-neutral-600 truncate mt-0.5">
                    Identidade autenticada
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className={lc}
                >
                  Senha de acesso
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Insira sua senha"
                  className="bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:border-amber-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-xs font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                  disabled={loading}
                >
                  {loading ? "Descriptografando..." : "Desbloquear cofre"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-center p-8 pt-6 border-t border-neutral-900/50">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-xs font-medium text-neutral-600 hover:text-amber-500 transition-all cursor-pointer"
          >
            Protocolos de Privacidade & Termos
          </button>
          <div className="flex items-center justify-center gap-1.5 opacity-30">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[10px] font-bold text-neutral-600">
              Segurança <span className="text-amber-500/80">Local-First</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
