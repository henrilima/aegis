"use client";

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  FileText,
  HardDriveDownload,
  HardDriveUpload,
  Info,
  Key,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
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

  // Estados para o recurso de Backup Automático em JSON
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_auto_backup_enabled") === "true";
    }
    return false;
  });

  const [backupInterval, setBackupInterval] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aegis_auto_backup_interval");
      return saved ? Number(saved) : 7;
    }
    return 7;
  });

  const [backupPath, setBackupPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_auto_backup_path") || "";
    }
    return "";
  });

  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_last_backup_date") || "";
    }
    return "";
  });

  const [isRunningManualBackup, setIsRunningManualBackup] = useState(false);
  const [isImportingRawJson, setIsImportingRawJson] = useState(false);

  // Sincroniza as configurações de backup automático com o localStorage
  useEffect(() => {
    localStorage.setItem(
      "aegis_auto_backup_enabled",
      String(autoBackupEnabled),
    );
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem("aegis_auto_backup_interval", String(backupInterval));
  }, [backupInterval]);

  useEffect(() => {
    localStorage.setItem("aegis_auto_backup_path", backupPath);
  }, [backupPath]);

  // Abre caixa de diálogo nativa do Tauri para seleção da pasta local
  const handleSelectBackupDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        setBackupPath(selected as string);
        toast.success("Diretório de backup selecionado!");
      }
    } catch (_e) {
      toast.error("Erro ao selecionar diretório");
    }
  };

  // Executa o backup JSON do perfil — sem senhas por motivos de segurança e privacidade
  const handleRunManualBackup = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    if (!backupPath) {
      toast.error("Por favor, selecione uma pasta de destino.");
      return;
    }
    try {
      setIsRunningManualBackup(true);
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `aegis_auto_backup_${user.username}_${dateStr}.json`;
      const fullPath = `${backupPath}/${filename}`;

      await invoke("global_export_raw_user_json", {
        userId: String(user.id),
        path: fullPath,
      });
      toast.success("Backup do perfil em JSON gerado com sucesso!");

      const nowIso = new Date().toISOString();
      setLastBackupDate(nowIso);
      localStorage.setItem("aegis_last_backup_date", nowIso);
    } catch (e) {
      toast.error(
        `Falha no backup: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsRunningManualBackup(false);
    }
  };

  // Restaura dados do perfil a partir de um backup raw JSON (backup automático)
  const handleImportRawJson = async () => {
    if (!user) return;
    try {
      setIsImportingRawJson(true);
      const filePath = await open({
        filters: [
          { name: "Aegis Profile Backup (JSON)", extensions: ["json"] },
        ],
        multiple: false,
      });

      if (!filePath) {
        setIsImportingRawJson(false);
        return;
      }

      await invoke("global_import_raw_user_json", {
        targetUserId: String(user.id),
        path: filePath,
      });
      toast.success("Dados do perfil mesclados com sucesso! Recarregando...");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      toast.error(
        `Erro ao restaurar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImportingRawJson(false);
    }
  };

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
      await invoke("global_export_full_system_bundle", {
        path: filePath,
        keyBytes,
      });
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
      await invoke("global_import_full_system_bundle", {
        path: filePath,
        keyBytes,
      });
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
      await invoke("global_export_user_package", {
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
      await invoke("global_import_user_package", {
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
            Gerencie backups, exportações e migração de dados com segurança.
          </p>
        </div>
      </section>

      {/* Guia de Formatos de Backup */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Info className={cn("w-4 h-4", themeStyles.text)} />
          <h3 className="text-xs font-bold text-muted-foreground uppercase">
            Guia de Formatos de Backup
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Sistema Completo */}
          <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <Database className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 animate-pulse" /> Com Senhas
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">
                  Sistema Completo (.aegissystem)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cópia idêntica de todo o banco de dados do Aegis. Salva todos
                  os usuários, senhas de todos os cofres, notas e configurações
                  globais do aplicativo.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
              <span className="font-bold text-foreground">Como restaurar:</span>{" "}
              Clique no botão{" "}
              <span className="underline font-bold">Restaurar Tudo</span> abaixo
              (Substitui todo o sistema).
            </div>
          </div>

          {/* Card 2: Perfil Criptografado */}
          <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 animate-pulse" /> Com Senhas
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">
                  Perfil de Usuário (.aegisuser)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cópia criptografada e segura de apenas um perfil. Salva
                  hábitos, tarefas, notas, estudos e as senhas criptografadas do
                  seu cofre pessoal.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
              <span className="font-bold text-foreground">Como restaurar:</span>{" "}
              Clique no botão{" "}
              <span className="underline font-bold">Mesclar Dados</span> abaixo
              (Une os dados ao seu perfil ativo).
            </div>
          </div>

          {/* Card 3: Backup JSON */}
          <div className="p-5 bg-card/60 backdrop-blur-sm border border-border/80 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-border transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-500" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-violet-500/10 rounded-xl">
                  <FileJson className="w-5 h-5 text-violet-500" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full flex items-center gap-1">
                  <Unlock className="w-2.5 h-2.5" /> Sem Senhas (Seguro)
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">
                  Progresso do Perfil (.json)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Exportação transparente em formato JSON. Salva hábitos,
                  tarefas, notas, estudos e histórico.{" "}
                  <strong>Não exporta senhas</strong> por privacidade e
                  segurança.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium">
              <span className="font-bold text-foreground">Como restaurar:</span>{" "}
              Use o botão{" "}
              <span className="underline font-bold">Importar Backup JSON</span>{" "}
              na seção de Backup Automático abaixo.
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Autenticação para Dados */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground px-1 uppercase">
            Segurança de Pacotes Criptografados (.aegissystem / .aegisuser)
          </h3>
          <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Chaves de Criptografia</p>
                <p className="text-xs text-muted-foreground">
                  Senhas necessárias para manipular os dados seguros.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                    htmlFor="backup-password-input"
                  >
                    Senha do Arquivo
                  </label>
                  <span className="text-[9px] text-amber-500 font-semibold uppercase">
                    Obrigatório para .aegissystem & .aegisuser
                  </span>
                </div>
                <input
                  id="backup-password-input"
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Senha para proteger/descriptografar o pacote"
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    className="text-[10px] font-bold text-muted-foreground uppercase"
                    htmlFor="vault-password-input"
                  >
                    Senha Mestra do Cofre
                  </label>
                  <span className="text-[9px] text-primary font-semibold uppercase">
                    Apenas para .aegisuser
                  </span>
                </div>
                <input
                  id="vault-password-input"
                  type="password"
                  value={vaultPassword}
                  onChange={(e) => setVaultPassword(e.target.value)}
                  placeholder="Sua senha mestra atual do Aegis"
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
            <h3 className="text-xs font-bold text-muted-foreground px-1 uppercase">
              1. Ações de Sistema Completo
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
            <h3 className="text-xs font-bold text-muted-foreground px-1 uppercase">
              2. Ações de Perfil de Usuário
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

      {/* Card de Backup Automático */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground px-1 uppercase">
          3. Backup Automático de Progresso (JSON)
        </h3>
        <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-2.5 rounded-xl bg-primary/10",
                  themeStyles.text,
                )}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Agendamento Automático (JSON)
                </p>
                <p className="text-xs text-muted-foreground">
                  Salva periodicamente uma cópia dos dados de progresso de uso
                  do perfil (hábitos, notas, estudos, tarefas, etc.).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-semibold">
                {autoBackupEnabled ? "Ativado" : "Desativado"}
              </span>
              <button
                type="button"
                onClick={() => setAutoBackupEnabled((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  autoBackupEnabled ? themeStyles.solid : "bg-neutral-800",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    autoBackupEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          {/* Banner de Informação de Segurança sobre Senhas em JSON */}
          <div className="p-4 bg-violet-500/5 border border-dashed border-violet-500/20 rounded-xl flex gap-3 items-start">
            <Unlock className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">
                🔒 Segurança de Credenciais & Conformidade
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                Por motivos de segurança e integridade de dados, backups em
                formato aberto JSON <strong>nunca contêm as senhas</strong> do
                seu cofre pessoal. Para exportar ou importar dados incluindo
                senhas, utilize o formato criptografado de{" "}
                <strong>Perfil de Usuário (.aegisuser)</strong> acima.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label
                htmlFor="backup-interval-select"
                className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block"
              >
                Intervalo de Dias
              </label>
              <select
                id="backup-interval-select"
                value={backupInterval}
                onChange={(e) => setBackupInterval(Number(e.target.value))}
                disabled={!autoBackupEnabled}
                className={cn(
                  "w-full h-11 bg-background border border-border rounded-xl px-4 text-sm focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50",
                  themeStyles.borderHover.replace("hover:", "focus:"),
                )}
              >
                <option value="1">A cada 1 dia</option>
                <option value="3">A cada 3 dias</option>
                <option value="7">A cada 7 dias</option>
                <option value="15">A cada 15 dias</option>
                <option value="30">A cada 30 dias</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="backup-path-input"
                className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block"
              >
                Diretório de Destino
              </label>
              <div className="flex gap-2">
                <input
                  id="backup-path-input"
                  type="text"
                  readOnly
                  placeholder="Selecione uma pasta para salvar os backups..."
                  value={backupPath}
                  disabled={!autoBackupEnabled}
                  className="flex-1 h-11 bg-background border border-border rounded-xl px-4 text-sm outline-none truncate disabled:opacity-50 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSelectBackupDirectory}
                  disabled={!autoBackupEnabled}
                  className={cn(
                    "px-4 h-11 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap",
                  )}
                >
                  Selecionar Pasta
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/40">
            <div className="text-[10px] text-muted-foreground font-semibold">
              {lastBackupDate
                ? `Último backup: ${new Date(lastBackupDate).toLocaleString("pt-BR")}`
                : "Nenhum backup automático executado ainda"}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleImportRawJson}
                disabled={isImportingRawJson || isRunningManualBackup}
                className={cn(
                  "px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-bold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
                  isImportingRawJson && "animate-pulse",
                )}
              >
                {isImportingRawJson ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-3.5 h-3.5" />
                    Importar Backup JSON
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRunManualBackup}
                disabled={
                  isRunningManualBackup || isImportingRawJson || !backupPath
                }
                className={cn(
                  "px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
                  themeStyles.solid,
                  themeStyles.solidHover,
                  isRunningManualBackup && "animate-pulse",
                )}
              >
                {isRunningManualBackup ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <HardDriveUpload className="w-3.5 h-3.5" />
                    Executar Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="p-5 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl flex gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed font-medium">
          <strong>Importante:</strong> Backups criptografados (.aegissystem e
          .aegisuser) não podem ser recuperados se você esquecer a senha do
          arquivo. A restauração total do sistema substituirá permanentemente
          todos os registros atuais do aplicativo.
        </p>
      </div>
    </div>
  );
}
