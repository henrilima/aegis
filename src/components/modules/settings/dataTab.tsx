"use client";

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  AlertTriangle,
  Database,
  Download,
  FileText,
  HardDriveDownload,
  HardDriveUpload,
  Key,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function DataTab() {
  const { user } = useAuth();
  const { themeStyles } = useTheme();

  const [backupPassword, setBackupPassword] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingUser, setIsExportingUser] = useState(false);
  const [isImportingUser, setIsImportingUser] = useState(false);

  const getHashBytes = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer));
  };

  const handleExportSystem = async () => {
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite uma senha de backup com pelo menos 4 caracteres.");
      return;
    }

    try {
      setIsExporting(true);
      const filePath = await save({
        filters: [{ name: "Aegis System Bundle", extensions: ["aegissystem"] }],
        defaultPath: `aegis__backup_completo_${new Date().toISOString().split("T")[0]}.aegissystem`,
      });

      if (!filePath) {
        setIsExporting(false);
        return;
      }

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("export_full_system_bundle", { path: filePath, keyBytes });
      toast.success("Backup COMPLETO do sistema exportado com sucesso!");
      setBackupPassword("");
    } catch (e) {
      toast.error(
        `Falha ao exportar backup: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSystem = async () => {
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite a senha do backup.");
      return;
    }

    try {
      setIsImporting(true);
      const filePath = await open({
        filters: [{ name: "Aegis System Bundle", extensions: ["aegissystem"] }],
        multiple: false,
      });

      if (!filePath) {
        setIsImporting(false);
        return;
      }

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("import_full_system_bundle", { path: filePath, keyBytes });
      toast.success("Sistema restaurado com sucesso! Reinicie o aplicativo.");
      setBackupPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (e) {
      toast.error(
        `Falha ao restaurar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportUser = async () => {
    if (!user) return;
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite uma senha para este pacote de migração.");
      return;
    }
    if (!vaultPassword) {
      toast.error("Digite a senha do seu cofre para descriptografar os dados.");
      return;
    }

    try {
      setIsExportingUser(true);
      const filePath = await save({
        filters: [{ name: "Aegis User Package", extensions: ["aegisuser"] }],
        defaultPath: `aegis_usuario_${user.username}.aegisuser`,
      });

      if (!filePath) return;

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("export_user_package", {
        userId: user.id,
        masterPwd: vaultPassword,
        path: filePath,
        keyBytes,
      });
      toast.success("Dados do usuário exportados com sucesso!");
      setBackupPassword("");
      setVaultPassword("");
    } catch (e) {
      toast.error(
        `Erro na exportação: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsExportingUser(false);
    }
  };

  const handleImportUser = async () => {
    if (!user) return;
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite a senha do pacote de migração.");
      return;
    }
    if (!vaultPassword) {
      toast.error(
        "Digite a senha atual do seu cofre para criptografar os dados.",
      );
      return;
    }

    try {
      setIsImportingUser(true);
      const filePath = await open({
        filters: [{ name: "Aegis User Package", extensions: ["aegisuser"] }],
        multiple: false,
      });

      if (!filePath) return;

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("import_user_package", {
        targetUserId: user.id,
        masterPwd: vaultPassword,
        path: filePath,
        keyBytes,
      });
      toast.success("Dados mesclados na sua conta com sucesso!");
      setBackupPassword("");
      setVaultPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      toast.error(
        `Erro na importação: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImportingUser(false);
    }
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            themeStyles.bg,
          )}
        >
          <Database className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Portabilidade</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie backups e migração de dados com segurança.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Autenticação para Dados */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground px-1">
            Segurança de Pacotes
          </h3>
          <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Chaves de Criptografia</p>
                <p className="text-xs text-muted-foreground">
                  Senhas necessárias para manipular os dados.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-[10px] font-bold text-muted-foreground uppercase ml-1"
                  htmlFor="backup-password-input"
                >
                  Senha do Arquivo
                </label>
                <input
                  id="backup-password-input"
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Proteção do pacote exportado"
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-[10px] font-bold text-muted-foreground uppercase ml-1"
                  htmlFor="vault-password-input"
                >
                  Senha Mestra (Aegis)
                </label>
                <input
                  id="vault-password-input"
                  type="password"
                  value={vaultPassword}
                  onChange={(e) => setVaultPassword(e.target.value)}
                  placeholder="Sua senha atual do cofre"
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Operações */}
        <section className="space-y-8">
          {/* Backup do Sistema */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground px-1">
              Sistema Completo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportSystem}
                disabled={isExporting}
                className={cn(
                  "flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl gap-3 hover:bg-accent/30 transition-all disabled:opacity-50",
                  isExporting && "animate-pulse",
                )}
              >
                <HardDriveUpload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-bold uppercase">
                  Exportar Tudo
                </span>
              </button>
              <button
                type="button"
                onClick={handleImportSystem}
                disabled={isImporting}
                className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl gap-3 hover:bg-accent/30 transition-all disabled:opacity-50"
              >
                <HardDriveDownload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-bold uppercase">
                  Restaurar Tudo
                </span>
              </button>
            </div>
          </div>

          {/* Migração de Usuário */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground px-1">
              Dados de Perfil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportUser}
                disabled={isExportingUser}
                className="flex flex-col items-center justify-center p-6 bg-primary/5 border border-primary/20 rounded-2xl gap-3 hover:bg-primary/10 transition-all disabled:opacity-50"
              >
                <Download className={cn("w-6 h-6", themeStyles.text)} />
                <span
                  className={cn(
                    "text-xs font-bold uppercase",
                    themeStyles.text,
                  )}
                >
                  Meus Dados
                </span>
              </button>
              <button
                type="button"
                onClick={handleImportUser}
                disabled={isImportingUser}
                className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl gap-3 hover:bg-accent/30 transition-all disabled:opacity-50"
              >
                <FileText className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-bold uppercase">
                  Mesclar Dados
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="p-5 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl flex gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed font-medium">
          <strong>Importante:</strong> Backups criptografados não podem ser
          recuperados se você esquecer a senha do arquivo. A restauração total
          substituirá permanentemente todos os registros atuais do sistema.
        </p>
      </div>
    </div>
  );
}
