"use client";

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  FolderOpen,
  HardDriveDownload,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
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
  masterCodeIndex: number;
  passwordHint: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  // Estados para restauração direta de backup na tela de login
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [restoreFilePath, setRestoreFilePath] = useState("");
  const [restoring, setRestoring] = useState(false);

  // Estados para escolha de pasta de dados na tela de login
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [customDataDir, setCustomDataDir] = useState("");

  const handleSelectRestoreFile = async () => {
    try {
      const selected = await open({
        filters: [{ name: "Aegis System Bundle", extensions: ["aegissystem"] }],
        multiple: false,
      });
      if (selected) {
        setRestoreFilePath(selected as string);
      }
    } catch (_e) {
      toast.error("Erro ao selecionar arquivo de backup");
    }
  };

  const handleRestoreSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFilePath) {
      toast.error("Por favor, selecione o arquivo .aegissystem");
      return;
    }
    if (!restorePassword || restorePassword.length < 4) {
      toast.error("A senha do arquivo deve ter no mínimo 4 caracteres");
      return;
    }

    setRestoring(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(restorePassword);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const keyBytes = Array.from(new Uint8Array(hashBuffer));

      await invoke("global_import_full_system_bundle", {
        path: restoreFilePath,
        keyBytes,
      });
      toast.success("Sistema restaurado com sucesso! Recarregando...");

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error("[Login] Falha ao restaurar backup completo:", err);
      toast.error(`Falha ao restaurar: ${String(err)}`);
      setRestoring(false);
    }
  };

  // Carrega configurações de diretório de dados
  const loadConfig = useCallback(async () => {
    try {
      const config = await invoke<{ customDataDir: string }>(
        "global_get_app_config",
      );
      setCustomDataDir(config.customDataDir || "");
    } catch (err) {
      console.error("Failed to fetch app config:", err);
    }
  }, []);

  // Carrega usuários locais
  const loadUsers = useCallback(async () => {
    setFetchingUsers(true);
    try {
      const list = await invoke<LocalUser[]>("global_list_local_users");
      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setFetchingUsers(false);
    }
  }, []);

  const handleChangeDataDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Selecione a pasta para os dados do Aegis",
      });
      if (selected) {
        const path = selected as string;
        toast.info(
          "Configurando diretório e migrando dados. O Aegis irá reiniciar...",
        );
        await invoke("global_set_custom_data_dir", { newPath: path });
      }
    } catch (e) {
      toast.error(
        `Erro ao alterar diretório: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleResetDataDirectory = async () => {
    try {
      toast.info("Restaurando local padrão. O Aegis irá reiniciar...");
      await invoke("global_set_custom_data_dir", { newPath: null });
    } catch (e) {
      toast.error(
        `Erro ao restaurar diretório padrão: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  useEffect(() => {
    loadUsers();
    loadConfig();
  }, [loadUsers, loadConfig]);

  const handleDeleteAccount = (e: React.MouseEvent, user: LocalUser) => {
    e.stopPropagation();
    setDeleteTarget(user);
  };

  const confirmDeleteAccount = async (password: string) => {
    if (!deleteTarget) return;
    try {
      await invoke("global_delete_account", {
        userId: deleteTarget.id,
        password,
      });
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
      console.log("[Login] Tentando autenticação para:", selectedUser.email);
      const userId = await invoke<string>("global_local_login", {
        email: selectedUser.email,
        password: password,
      });

      console.log("[Login] Resposta local_login (ID):", userId);

      await login(userId);
      console.log("[Login] Redirecionamento deve ocorrer agora...");
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
          masterCodeIndex={deleteTarget.masterCodeIndex}
          onConfirm={confirmDeleteAccount}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
                >
                  <HardDriveDownload className={`w-5 h-5 ${theme.textSub}`} />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Restaurar Backup do Sistema
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!restoring) {
                    setShowRestoreModal(false);
                    setRestorePassword("");
                    setShowRestorePassword(false);
                    setRestoreFilePath("");
                  }
                }}
                disabled={restoring}
                className="p-2 hover:bg-accent/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestoreSystem} className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este processo substituirá permanentemente todo o banco de dados
                atual por aquele contido no arquivo{" "}
                <strong className="text-foreground">.aegissystem</strong>.
              </p>

              <div className="space-y-2">
                <label
                  htmlFor="restore-file-input"
                  className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block"
                >
                  Arquivo de Backup
                </label>
                <div className="flex gap-2">
                  <input
                    id="restore-file-input"
                    type="text"
                    readOnly
                    placeholder="Selecione o arquivo..."
                    value={
                      restoreFilePath
                        ? restoreFilePath.split("/").pop()?.split("\\").pop() ||
                          restoreFilePath
                        : ""
                    }
                    onClick={handleSelectRestoreFile}
                    className="flex-1 h-11 bg-background border border-border rounded-xl px-4 text-xs font-semibold outline-none truncate cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={handleSelectRestoreFile}
                    disabled={restoring}
                    className={`px-4 h-11 rounded-xl ${theme.bg} hover:${theme.bgHover} text-foreground font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap`}
                  >
                    Procurar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="restore-password-input"
                  className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block"
                >
                  Senha do Arquivo de Backup
                </label>
                <div className="relative">
                  <input
                    id="restore-password-input"
                    type={showRestorePassword ? "text" : "password"}
                    placeholder="Senha definida durante a exportação"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    disabled={restoring}
                    className="w-full h-11 bg-background border border-border rounded-xl pl-4 pr-11 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRestorePassword((prev) => !prev)}
                    disabled={restoring}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {showRestorePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  disabled={restoring || !restoreFilePath || !restorePassword}
                  className={`w-full py-3 rounded-xl ${theme.solid} ${theme.solidHover} border ${theme.border} text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {restoring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Restaurando e Reiniciando...
                    </>
                  ) : (
                    "Confirmar Restauração"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setRestorePassword("");
                    setShowRestorePassword(false);
                    setRestoreFilePath("");
                  }}
                  disabled={restoring}
                  className="w-full text-muted-foreground hover:text-foreground py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
                >
                  <FolderOpen className={`w-5 h-5 ${theme.textSub}`} />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Localização dos Dados
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="p-2 hover:bg-accent/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escolha a pasta do disco de onde o Aegis deve ler e salvar suas
                identidades, anotações, tarefas e histórico de estudos.
              </p>

              <div className="space-y-1 bg-card/40 border border-border p-4 rounded-xl">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Pasta Atual:
                </span>
                <p className="text-xs font-semibold text-foreground break-all">
                  {customDataDir || "Local padrão do sistema (AppData)"}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleChangeDataDirectory}
                  className={`w-full py-3 rounded-xl ${theme.solid} ${theme.solidHover} border ${theme.border} text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2`}
                >
                  Selecionar Nova Pasta
                </button>

                {customDataDir && (
                  <button
                    type="button"
                    onClick={handleResetDataDirectory}
                    className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    Restaurar Pasta Padrão
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="w-full text-muted-foreground hover:text-foreground py-2 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
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
                className={`w-10 h-10 border-2 ${theme.bg} ${theme.text} rounded-full animate-spin`}
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

                <button
                  type="button"
                  onClick={() => setShowRestoreModal(true)}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:${theme.border.split(" ")[0]} ${theme.bgHover} transition-all text-left group cursor-pointer`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-background/60 border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:${theme.text} group-hover:${theme.border.split(" ")[0]} transition-all`}
                  >
                    <HardDriveDownload className="w-6 h-6" />
                  </div>
                  <div>
                    <span
                      className={`font-bold text-muted-foreground group-hover:${theme.text} transition-colors`}
                    >
                      Restaurar Backup do Sistema
                    </span>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase mt-0.5">
                      Recuperar base de dados (.aegissystem)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFolderModal(true)}
                  className={`flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:${theme.border.split(" ")[0]} ${theme.bgHover} transition-all text-left group cursor-pointer`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-background/60 border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:${theme.text} group-hover:${theme.border.split(" ")[0]} transition-all`}
                  >
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span
                      className={`font-bold text-muted-foreground group-hover:${theme.text} transition-colors`}
                    >
                      Alterar Local dos Dados
                    </span>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase mt-0.5">
                      {customDataDir
                        ? `Pasta: ${customDataDir.split(/[/\\]/).pop()}`
                        : "Local padrão do sistema"}
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
                  setShowPassword(false);
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Insira sua senha"
                    className={`bg-card border-border h-11 rounded-xl pl-4 pr-11 text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {selectedUser.passwordHint && (
                  <p className="text-[10px] font-medium text-muted-foreground mt-1.5 px-1">
                    <span className="text-muted-foreground font-bold">
                      Lembrete:
                    </span>{" "}
                    {selectedUser.passwordHint}
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
