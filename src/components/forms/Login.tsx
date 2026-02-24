"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  ChevronLeft,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    await invoke("delete_account", { userId: deleteTarget.id, password });
    toast.success(`Conta "${deleteTarget.username}" removida.`);
    setDeleteTarget(null);
    await loadUsers();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Privacidade e Termos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <TermsContent className="max-h-[400px]" />
              <Button
                type="button"
                onClick={() => setShowTerms(false)}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-500 text-black font-bold cursor-pointer h-12 rounded-xl shadow-lg shadow-amber-500/10"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-amber-500">
            Olá!
          </CardTitle>
          <CardDescription className="text-md mt-[-4] text-neutral-300">
            {selectedUser
              ? `Bem-vindo de volta, ${selectedUser.username}`
              : "Seja bem-vindo(a) ao Aegis. Escolha sua conta local."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingUsers ? (
            <div className="flex items-center justify-center p-8 text-neutral-500">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-2" />
              Carregando contas...
            </div>
          ) : !selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="relative group flex items-center rounded-xl border border-neutral-700 bg-neutral-800/50 hover:border-amber-500/50 hover:bg-neutral-800 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="flex flex-1 items-center gap-4 p-4 text-left cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xl">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">
                          {u.username}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {u.email}
                        </p>
                      </div>
                      <UserIcon className="w-4 h-4 text-neutral-600 group-hover:text-amber-500 transition-colors mr-1" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteAccount(e, u)}
                      className="p-3 mr-2 rounded-md text-neutral-600 hover:text-red-500 transition-all cursor-pointer opacity-0 group-hover:opacity-100 absolute right-8 top-1/2 -translate-y-1/2"
                      title="Deletar conta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-neutral-700 hover:border-amber-500/50 hover:bg-neutral-800/30 transition-all text-left text-neutral-400 hover:text-amber-500 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-dashed border-neutral-700 flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold">Adicionar Nova Conta</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setPassword("");
                  setError(null);
                }}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-500 transition-colors mb-2 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Escolher outra conta
              </button>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">
                    {selectedUser.username}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-neutral-300">
                  Senha de Acesso
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha local"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="bg-amber-500 text-black hover:bg-amber-500 cursor-pointer w-full font-bold mt-2"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-center">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-[10px] text-neutral-500 hover:text-amber-500 underline transition-colors cursor-pointer"
          >
            Ver Termos de Privacidade e Estatísticas
          </button>
          <p className="text-xs text-neutral-500">
            Dados armazenados em{" "}
            <span className="text-amber-500/80 font-bold">
              Criptografia Local
            </span>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
