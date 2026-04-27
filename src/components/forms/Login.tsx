"use client";

import { invoke } from "@tauri-apps/api/core";
import { ChevronLeft, Plus, Shield, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/app.config";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DeleteAccountModal } from "./DeleteAccountModal";
import RegisterComponent from "./Register";
import { TermsContent } from "./TermsContent";

/** Retorna o src de uma imagem base64 a partir dos dados e do tipo MIME detectado. */
function toDataUrl(base64: string | null | undefined): string | null {
  if (!base64) return null;
  // Detecta o tipo pelo cabeçalho base64
  const header = base64.substring(0, 10);
  let mime = "image/png";
  if (header.startsWith("/9j/")) mime = "image/jpeg";
  else if (header.startsWith("UklGR")) mime = "image/webp";
  else if (header.startsWith("R0lGO")) mime = "image/gif";
  return `data:${mime};base64,${base64}`;
}

interface LocalUser {
  id: string;
  username: string;
  email: string;
  master_code_index: number;
  password_hint: string;
  avatar?: string | null;
}

export default function LoginComponent() {
  const { themeStyles: theme } = useTheme();
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

  // Carrega usuários locais
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

  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

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
          masterCodeIndex={deleteTarget.master_code_index}
          onConfirm={confirmDeleteAccount}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
                >
                  <Shield className={`w-5 h-5 ${theme.textSub}`} />
                </div>
                <h2 className="text-base font-bold text-foreground leading-none">
                  Privacidade & Termos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-accent/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <TermsContent className="custom-scrollbar" />
              <div className="flex flex-col gap-2 pt-8 pb-2">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className={`w-full py-3 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover} ${theme.textDark} ${theme.textDarkHover} text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer`}
                >
                  Confirmar leitura
                </button>
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="w-full text-muted-foreground hover:text-muted-foreground py-2 text-sm font-medium cursor-pointer transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full bg-card/50 backdrop-blur-xl border-border/50 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] md:max-h-none">
        <CardHeader className="space-y-1.5 pb-8 p-10 shrink-0 text-center md:text-left">
          <CardTitle className="text-3xl font-black text-foreground">
            Identidade <span className={theme.text}>{APP_CONFIG.name}</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium text-sm leading-relaxed">
            {selectedUser
              ? `Bem-vindo de volta, ${selectedUser.username}`
              : "Selecione um perfil para acessar seu cofre criptografado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
          {fetchingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div
                className={`w-10 h-10 border-2 ${theme.bg} border-t-2 border-t-current ${theme.text} rounded-full animate-spin`}
              />
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Sincronizando...
              </p>
            </div>
          ) : !selectedUser ? (
            /* Seleção de Perfil */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 overflow-hidden">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`relative group flex items-center rounded-xl border border-border/60 bg-background/40 ${theme.borderHover.replace("hover:", "group-hover:")} hover:bg-background/60 transition-all duration-300 overflow-hidden`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="flex flex-1 items-center gap-4 p-4 text-left cursor-pointer group"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${theme.bg} border ${theme.border} flex items-center justify-center ${theme.text} font-black text-xl transition-all group-hover:${theme.solid} group-hover:text-foreground group-hover:scale-105 overflow-hidden`}
                      >
                        {u.avatar ? (
                          <img
                            src={toDataUrl(u.avatar) || ""}
                            alt={u.username}
                            width={48}
                            height={48}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-base truncate">
                          {u.username}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground truncate mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </button>

                    <ToolTip content="Deletar conta">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAccount(e, u)}
                        className="p-2.5 mr-3 rounded-xl text-neutral-700 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ToolTip>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:${theme.border.split(" ")[0]} ${theme.bgHover} transition-all text-left group cursor-pointer`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-background/60 border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:${theme.text} group-hover:${theme.border.split(" ")[0]} transition-all`}
                  >
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <span
                      className={`font-bold text-muted-foreground group-hover:${theme.text} transition-colors`}
                    >
                      Nova Identidade
                    </span>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase mt-0.5">
                      Configurar cofre local
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Formulário de Senha */
            <form
              onSubmit={handleSubmit}
              className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-2"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setPassword("");
                  setError(null);
                }}
                className={`flex items-center gap-2 text-xs font-medium text-muted-foreground hover:${theme.text} transition-all cursor-pointer`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Alterar perfil
              </button>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-neutral-900">
                <div
                  className={`w-12 h-12 rounded-xl ${theme.solid} flex items-center justify-center text-foreground font-bold text-xl overflow-hidden`}
                >
                  {selectedUser.avatar ? (
                    <img
                      src={toDataUrl(selectedUser.avatar) || ""}
                      alt={selectedUser.username}
                      width={48}
                      height={48}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser.username[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">
                    {selectedUser.username}
                  </p>
                  <p className="text-xs font-medium text-neutral-600 truncate mt-0.5">
                    Identidade autenticada
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className={lc}>
                  Senha de acesso
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Insira sua senha"
                  className={`bg-card border-border h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                {selectedUser.password_hint && (
                  <p className="text-[10px] font-medium text-muted-foreground mt-1.5 px-1">
                    <span className="text-muted-foreground font-bold">
                      Lembrete:
                    </span>{" "}
                    {selectedUser.password_hint}
                  </p>
                )}
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
                  className={`w-full py-3 rounded-xl ${theme.solid} ${theme.solidHover} border ${theme.border} text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer`}
                  disabled={loading}
                >
                  {loading ? "Descriptografando..." : "Desbloquear cofre"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-5 text-center p-10 pt-6 border-t border-border/40 shrink-0">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className={`text-[11px] font-bold text-neutral-600 hover:${theme.text} transition-all cursor-pointer`}
            >
              Protocolos de Segurança & Termos
            </button>
            <div className="flex items-center justify-center gap-4">
              <span className="text-[10px] font-bold text-neutral-700 uppercase">
                Suporte:
              </span>
              <a
                href={`mailto:${APP_CONFIG.support.email}`}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {APP_CONFIG.support.email}
              </a>
              <div className="w-1 h-1 rounded-full bg-neutral-800" />
              <a
                href={APP_CONFIG.support.discordserver}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Comunidade Discord
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 opacity-40">
            <Shield className={`w-3.5 h-3.5 ${theme.text}`} />
            <p className="text-[10px] font-black text-muted-foreground uppercase">
              {APP_CONFIG.name}{" "}
              <span className={`${theme.text}/80`}>Local-First</span> Security
            </p>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
