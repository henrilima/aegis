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

      <Card className="w-full bg-neutral-900 border-neutral-800 shadow-2xl shadow-black/60 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-3xl font-black text-amber-500">
            Portal de Identidade
          </CardTitle>
          <CardDescription className="text-neutral-500 font-bold uppercase text-[10px]">
            {selectedUser
              ? `Bem-vindo de volta ao núcleo, ${selectedUser.username}`
              : "Escolha um perfil de acesso local para iniciar a sessão"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase text-neutral-600">
                Sincronizando Perfis...
              </p>
            </div>
          ) : !selectedUser ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-auto pr-2 custom-scrollbar">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="relative group flex items-center rounded-2xl border border-neutral-800 bg-neutral-950/40 hover:border-amber-500/40 hover:bg-neutral-900 transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="flex flex-1 items-center gap-4 p-4 text-left cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm truncate">
                          {u.username}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-600 truncate uppercase mt-0.5">
                          {u.email}
                        </p>
                      </div>
                      <UserIcon className="w-4 h-4 text-neutral-700 group-hover:text-amber-500 transition-colors mr-2" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteAccount(e, u)}
                      className="p-3 mr-3 rounded-xl text-neutral-700 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Deletar conta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-neutral-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-black text-sm text-neutral-500 group-hover:text-amber-500 transition-colors">
                      Criar Novo Usuário
                    </span>
                    <p className="text-[9px] font-bold text-neutral-700 uppercase mt-0.5">
                      Criação de cofre local
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
                className="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-600 hover:text-amber-500 transition-all mb-4 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Alterar Credencial
              </button>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 mb-6 shadow-inner">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/10">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate">
                    {selectedUser.username}
                  </p>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase truncate mt-0.5">
                    ID Bio-Digital Registrado
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5">
                <Label
                  htmlFor="password"
                  title="password"
                  className="text-[10px] font-black uppercase text-neutral-600 ml-1"
                >
                  Chave de Criptografia (Senha)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Insira sua senha de acesso"
                  className="bg-neutral-950 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold focus:border-amber-500/50 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-7 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all border-none"
                disabled={loading}
              >
                {loading ? "Descriptografando..." : "Desbloquear Cofre"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center pt-8 border-t border-neutral-800/50 pb-8">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-[10px] font-black uppercase text-neutral-600 hover:text-amber-500 transition-all cursor-pointer"
          >
            Protocolos de Privacidade & Termos
          </button>
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Shield className="w-3 h-3 text-amber-500" />
            <p className="text-[8px] font-black uppercase text-neutral-500">
              Arquitetura de Segurança{" "}
              <span className="text-amber-500/80">Local-First</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
