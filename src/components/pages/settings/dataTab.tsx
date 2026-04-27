"use client";

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  Database,
  Download,
  FileText,
  HardDriveDownload,
  HardDriveUpload,
  Key,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function DataTab() {
  const { user } = useAuth();
  const { themeStyles } = useTheme();

  const [backupPassword, setBackupPassword] = useState("");
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
        path: filePath,
        keyBytes,
      });
      toast.success("Dados do usuário exportados com sucesso!");
      setBackupPassword("");
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
        path: filePath,
        keyBytes,
      });
      toast.success("Dados mesclados na sua conta com sucesso!");
      setBackupPassword("");

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
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-xl ${themeStyles.bg} ${themeStyles.text}`}>
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Dados e Portabilidade
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie seu cofre e migre seus dados com segurança máxima
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card/40 border border-border/50 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground uppercase">
              Segurança
            </span>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="backup-password"
              className="text-[10px] font-bold text-muted-foreground uppercase px-1"
            >
              Senha do Backup / Pacote
            </label>
            <input
              id="backup-password"
              type="password"
              placeholder="Digite a senha para exportar ou importar"
              className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground px-1 italic">
              Esta senha é necessária para criptografar os arquivos exportados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/20">
          {/* System Backup */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                Sistema Completo
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cria um backup de TODOS os dados (Bancos de dados, Configurações e
              Notas) de todos os perfis locais.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportSystem}
                disabled={isExporting}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl ${themeStyles.bg} ${themeStyles.text} text-xs font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50`}
              >
                <HardDriveUpload className="w-4 h-4" />
                {isExporting ? "Exportando..." : "Exportar Sistema"}
              </button>
              <button
                type="button"
                onClick={handleImportSystem}
                disabled={isImporting}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-background border border-border/50 text-foreground text-xs font-bold hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
              >
                <HardDriveDownload className="w-4 h-4" />
                {isImporting ? "Importando..." : "Restaurar Sistema"}
              </button>
            </div>
          </div>

          {/* User Migration */}
          <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                Portabilidade de Perfil
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Exporta apenas os SEUS dados para serem mesclados em outra conta,
              sem apagar outros perfis.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportUser}
                disabled={isExportingUser}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl ${themeStyles.bg} ${themeStyles.text} text-xs font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                {isExportingUser ? "Preparando..." : "Exportar meus dados"}
              </button>
              <button
                type="button"
                onClick={handleImportUser}
                disabled={isImportingUser}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-background border border-border/50 text-foreground text-xs font-bold hover:bg-accent transition-all active:scale-95 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isImportingUser ? "Mesclando..." : "Importar e Mesclar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
          <strong>Aviso:</strong> A restauração de sistema substitui todos os
          dados atuais. A importação de perfil apenas adiciona seus dados à
          conta logada. Recomendamos sempre fazer um backup antes de operações
          críticas.
        </p>
      </div>
    </div>
  );
}
