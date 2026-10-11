"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import {
  DownloadCloud,
  HelpCircle,
  Plus,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { getModuleColor } from "@/modules.config";
import { AddEditModal } from "./AddEditModal";
import { LockedVault } from "./LockedVault";
import { PasswordsGuidePanel } from "./PasswordsInfoModal";
import { PasswordTable } from "./PasswordTable";
import { ResetModal } from "./ResetModal";
import type { DecryptedEntry, PasswordEntry, VaultAuditReport } from "./types";
import { VaultAuditor } from "./VaultAuditor";

export default function PasswordManager() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [decryptedId, setDecryptedId] = useState<number | null>(null);
  const [decryptedData, setDecryptedData] = useState<DecryptedEntry | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNote, setNewNote] = useState("");

  const [vaultExists, setVaultExists] = useState<boolean | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Abas do módulo
  const [activeTab, setActiveTab] = useState<"cofre" | "auditoria">("cofre");
  const auditRanRef = useRef(false);

  // Estados do Auditor de Segurança
  const [auditReport, setAuditReport] = useState<VaultAuditReport | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Verifica se o cofre (database de senhas) já existe para o usuário atual
  const checkVault = useCallback(async () => {
    if (!user) return;
    try {
      const exists = await invoke<boolean>("password_check_vault", {
        userId: String(user.id),
      });
      setVaultExists(exists);
    } catch (error) {
      console.error("Cofre não encontrado:", error);
    }
  }, [user]);

  // Carrega a lista de senhas criptografadas do backend
  const loadPasswords = useCallback(async () => {
    if (!user) return;
    try {
      const list = await invoke<PasswordEntry[]>("password_list_passwords", {
        userId: String(user.id),
      });
      setPasswords(list);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  // Executa auditoria do cofre no backend
  const runAudit = useCallback(async () => {
    if (!user || !masterPassword) return;
    setAuditLoading(true);
    try {
      const report = await invoke<VaultAuditReport>("password_audit_vault", {
        userId: String(user.id),
        masterPwd: masterPassword,
      });
      setAuditReport(report);
    } catch (error) {
      console.error("[PasswordManager] Erro na auditoria do cofre:", error);
    } finally {
      setAuditLoading(false);
    }
  }, [user, masterPassword]);

  useEffect(() => {
    checkVault();
  }, [checkVault]);

  useEffect(() => {
    if (isVerified) {
      loadPasswords();
    }
  }, [isVerified, loadPasswords]);

  // Executa auditoria automaticamente ao abrir a aba pela primeira vez
  useEffect(() => {
    if (activeTab === "auditoria" && isVerified && !auditRanRef.current) {
      auditRanRef.current = true;
      runAudit();
    }
  }, [activeTab, isVerified, runAudit]);

  // Realiza a verificação da senha mestre para desbloquear o cofre ou configurá-lo
  const handleVerify = async () => {
    if (!user) return;
    try {
      if (!vaultExists) {
        // Se o cofre não existir, cria um novo
        await invoke("password_setup_local_vault", {
          userId: String(user.id),
          username: user.username,
          masterPassword: masterPassword,
        });
        setVaultExists(true);
      }

      // Verifica se a senha mestre está correta
      await invoke("global_verify_master", {
        userId: String(user.id),
        masterPassword: masterPassword,
      });
      setIsVerified(true);
      toast.success("Cofre desbloqueado");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleStartReset = () => {
    if (!user) return;
    setResetStep(1);
    setResetConfirmText("");
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    if (!user) return;

    if (resetStep === 1) {
      setResetStep(2);
      return;
    }

    if (resetConfirmText !== "desejo apagar todas as senhas") {
      toast.error("Texto de confirmação incorreto");
      return;
    }

    try {
      await invoke("password_reset_vault", { userId: String(user.id) });
      setVaultExists(false);
      setIsVerified(false);
      setMasterPassword("");
      setShowResetModal(false);
      toast.success("Cofre excluído. Você pode criar um novo.");
    } catch (error) {
      toast.error(`Erro ao resetar: ${error}`);
    }
  };

  const handleEditStart = async (id: number) => {
    try {
      if (!user) return;
      const data = await invoke<DecryptedEntry>("password_decrypt_entry", {
        userId: String(user.id),
        masterPwd: masterPassword,
        entryId: id,
      });
      setEditingId(id);
      setIsEditing(true);
      setNewName(data.name);
      setNewUrl(data.url);
      setNewUsername(data.username);
      setNewPassword(data.password);
      setNewNote(data.note);
      setShowAddModal(true);
    } catch (error) {
      toast.error(`Erro ao carregar dados para edição: ${error}`);
    }
  };

  const handleSavePassword = async () => {
    if (!user || !isVerified) return;
    try {
      if (isEditing && editingId !== null) {
        await invoke("password_update_password", {
          userId: String(user.id),
          masterPwd: masterPassword,
          entryId: editingId,
          name: newName,
          url: newUrl,
          username: newUsername,
          passwordRaw: newPassword,
          noteRaw: newNote,
        });
        toast.success("Credencial atualizada");
      } else {
        await invoke("password_add_password", {
          userId: String(user.id),
          masterPwd: masterPassword,
          name: newName,
          url: newUrl,
          username: newUsername,
          passwordRaw: newPassword,
          noteRaw: newNote,
        });
        toast.success("Credencial salva");
      }

      setShowAddModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadPasswords();

      setNewName("");
      setNewUrl("");
      setNewUsername("");
      setNewPassword("");
      setNewNote("");
      runAudit();
    } catch (error) {
      toast.error(`Erro ao salvar: ${error}`);
    }
  };

  const handleDelete = async () => {
    if (!user || deleteId === null) return;
    try {
      await invoke("password_delete_password", {
        userId: String(user.id),
        entryId: deleteId,
      });
      loadPasswords();
      runAudit();
      setDeleteId(null);
      toast.success("Credencial removida");
    } catch (error) {
      toast.error(`Erro ao remover: ${error}`);
    }
  };

  // Descriptografa uma entrada para exibição temporária na tabela
  const handleShowPassword = async (id: number) => {
    if (decryptedId === id) {
      // Se já estiver visível, oculta ao clicar novamente
      setDecryptedId(null);
      setDecryptedData(null);
      return;
    }
    try {
      if (!user) return;
      const data = await invoke<DecryptedEntry>("password_decrypt_entry", {
        userId: String(user.id),
        masterPwd: masterPassword,
        entryId: id,
      });
      setDecryptedData(data);
      setDecryptedId(id);
    } catch (error) {
      toast.error(`Erro ao descriptografar: ${error}`);
    }
  };

  const handleImport = async () => {
    try {
      const path = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (path && user) {
        const count = await invoke<number>("password_import_passwords", {
          userId: String(user.id),
          masterPwd: masterPassword,
          filePath: path,
        });
        toast.success(`${count} senhas importadas com sucesso!`);
        loadPasswords();
        runAudit();
      }
    } catch (error) {
      toast.error(`Erro na importação: ${error}`);
    }
  };

  const handleExport = async () => {
    try {
      const path = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "aegis_senhas_backup.csv",
      });
      if (path && user) {
        await invoke("password_export_passwords", {
          userId: String(user.id),
          masterPwd: masterPassword,
          destPath: path,
        });
        toast.success("Cofre exportado com sucesso");
      }
    } catch (error) {
      toast.error(`Erro na exportação: ${error}`);
    }
  };

  const filteredPasswords = useMemo(() => {
    return passwords.filter(
      (p) =>
        String(p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.username).toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [passwords, searchTerm]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="w-full h-full relative">
      {vaultExists === null ? (
        // Skeleton enquanto verifica existência do cofre
        <div className="w-full h-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : !isVerified ? (
        <LockedVault
          vaultExists={vaultExists}
          masterPassword={masterPassword}
          setMasterPassword={setMasterPassword}
          handleVerify={handleVerify}
          handleStartReset={handleStartReset}
        />
      ) : showInfo ? (
        <div className="w-full flex flex-col gap-6">
          <ModuleHeader
            moduleId="passwords"
            color={getModuleColor("passwords")}
            title="Cofre de senhas"
            subtitle={`${passwords.length} ${passwords.length === 1 ? "credencial protegida" : "credenciais protegidas"} localmente`}
            icon={ShieldCheck}
            onTitleClick={() => setShowInfo(true)}
            titleHoverIcon={HelpCircle}
            titleTooltip="Visualizar Guia de Senhas"
            actions={[]}
          />
          <PasswordsGuidePanel onBack={() => setShowInfo(false)} />
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          <ModuleHeader
            moduleId="passwords"
            color={getModuleColor("passwords")}
            title="Cofre de senhas"
            subtitle={
              activeTab === "auditoria" && auditReport
                ? `Saúde do cofre: ${auditReport.healthScore}% — ${auditReport.totalCount} credencia${auditReport.totalCount !== 1 ? "is" : "l"} avaliada${auditReport.totalCount !== 1 ? "s" : ""}`
                : `${passwords.length} ${passwords.length === 1 ? "credencial protegida" : "credenciais protegidas"} localmente`
            }
            icon={ShieldCheck}
            onTitleClick={() => setShowInfo(true)}
            titleHoverIcon={HelpCircle}
            titleTooltip="Visualizar Guia de Senhas"
            tabs={[
              { id: "cofre", label: "Credenciais" },
              {
                id: "auditoria",
                label: auditReport
                  ? `Auditoria · ${auditReport.healthScore}%`
                  : "Auditoria",
              },
            ]}
            activeTab={activeTab}
            onTabChange={(t) => setActiveTab(t as "cofre" | "auditoria")}
            searchValue={activeTab === "cofre" ? searchTerm : undefined}
            onSearchChange={activeTab === "cofre" ? setSearchTerm : undefined}
            searchPlaceholder="Buscar por serviço ou usuário..."
            actions={[
              ...(activeTab === "cofre"
                ? [
                    {
                      id: "import",
                      label: "Importar",
                      icon: UploadCloud,
                      tooltip: "Importar Senhas (CSV)",
                      onClick: handleImport,
                    },
                    {
                      id: "export",
                      label: "Exportar",
                      icon: DownloadCloud,
                      tooltip: "Exportar Senhas (CSV)",
                      onClick: handleExport,
                    },
                    {
                      id: "new",
                      label: "Nova Senha",
                      icon: Plus,
                      tooltip: "Adicionar nova credencial ao cofre",
                      primary: true,
                      onClick: () => {
                        setIsEditing(false);
                        setEditingId(null);
                        setNewName("");
                        setNewUrl("");
                        setNewUsername("");
                        setNewPassword("");
                        setNewNote("");
                        setShowAddModal(true);
                      },
                    },
                  ]
                : []),
            ]}
          />

          {activeTab === "cofre" ? (
            <PasswordTable
              filteredPasswords={filteredPasswords}
              decryptedId={decryptedId}
              decryptedData={decryptedData}
              handleShowPassword={handleShowPassword}
              handleEditStart={handleEditStart}
              handleDelete={setDeleteId}
              openExternal={openExternal}
              copyToClipboard={copyToClipboard}
            />
          ) : (
            <VaultAuditor
              report={auditReport}
              loading={auditLoading}
              onRefresh={runAudit}
              onEditCredential={(id) => {
                handleEditStart(id);
                setActiveTab("cofre");
              }}
              openExternal={openExternal}
            />
          )}
        </div>
      )}

      {deleteId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deletePassword}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showAddModal && (
        <AddEditModal
          isEditing={isEditing}
          newName={newName}
          setNewName={setNewName}
          newUrl={newUrl}
          setNewUrl={setNewUrl}
          newUsername={newUsername}
          setNewUsername={setNewUsername}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          newNote={newNote}
          setNewNote={setNewNote}
          onClose={() => {
            setShowAddModal(false);
            setIsEditing(false);
            setEditingId(null);
          }}
          onSave={handleSavePassword}
        />
      )}

      {showResetModal && (
        <ResetModal
          resetStep={resetStep}
          resetConfirmText={resetConfirmText}
          setResetConfirmText={setResetConfirmText}
          onConfirm={handleConfirmReset}
        />
      )}
    </div>
  );
}
