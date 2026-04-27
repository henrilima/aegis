"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import { open as openExternal } from "@tauri-apps/plugin-shell";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { Input } from "../../ui/input";
import { AddEditModal } from "./AddEditModal";
import { Header } from "./Header";
import { LockedVault } from "./LockedVault";
import { PasswordTable } from "./PasswordTable";
import { ResetModal } from "./ResetModal";
import type { DecryptedEntry, PasswordEntry } from "./types";

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

  // Verifica se o cofre (database de senhas) já existe para o usuário atual
  const checkVault = useCallback(async () => {
    if (!user) return;
    try {
      const exists = await invoke<boolean>("check_vault", {
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
      const list = await invoke<PasswordEntry[]>("list_passwords", {
        userId: String(user.id),
      });
      setPasswords(list);
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    checkVault();
  }, [checkVault]);

  useEffect(() => {
    if (isVerified) {
      loadPasswords();
    }
  }, [isVerified, loadPasswords]);

  // Realiza a verificação da senha mestre para desbloquear o cofre ou configurá-lo
  const handleVerify = async () => {
    if (!user) return;
    try {
      if (!vaultExists) {
        // Se o cofre não existir, cria um novo
        await invoke("setup_local_vault", {
          userId: String(user.id),
          username: user.username,
          masterPassword: masterPassword,
        });
        setVaultExists(true);
      }

      // Verifica se a senha mestre está correta
      await invoke("verify_master", {
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
      await invoke("reset_vault", { userId: String(user.id) });
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
      const data = await invoke<DecryptedEntry>("decrypt_entry", {
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
        await invoke("update_password", {
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
        await invoke("add_password", {
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
    } catch (error) {
      toast.error(`Erro ao salvar: ${error}`);
    }
  };

  const handleDelete = async () => {
    if (!user || deleteId === null) return;
    try {
      await invoke("delete_password", {
        userId: String(user.id),
        entryId: deleteId,
      });
      loadPasswords();
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
      const data = await invoke<DecryptedEntry>("decrypt_entry", {
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
        const count = await invoke<number>("import_passwords", {
          userId: String(user.id),
          masterPwd: masterPassword,
          filePath: path,
        });
        toast.success(`${count} senhas importadas com sucesso!`);
        loadPasswords();
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
        await invoke("export_passwords", {
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
      ) : (
        <div className="w-full h-full flex flex-col gap-6 overflow-hidden">
          <Header
            handleImport={handleImport}
            handleExport={handleExport}
            count={passwords.length}
            onAddNew={() => {
              setIsEditing(false);
              setEditingId(null);
              setNewName("");
              setNewUrl("");
              setNewUsername("");
              setNewPassword("");
              setNewNote("");
              setShowAddModal(true);
            }}
          />

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-600 dark:text-amber-500 transition-colors" />
            <Input
              placeholder="Buscar por serviço ou usuário..."
              className="h-11 pl-11 bg-card border-border rounded-xl text-sm font-medium placeholder:text-muted-foreground/50 focus:border-amber-500/40 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
          onClose={() => setShowResetModal(false)}
          onConfirm={handleConfirmReset}
        />
      )}
    </div>
  );
}
