"use client";

import { Edit2, Plus, X } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface AddEditModalProps {
  isEditing: boolean;
  newName: string;
  setNewName: (val: string) => void;
  newUrl: string;
  setNewUrl: (val: string) => void;
  newUsername: string;
  setNewUsername: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  newNote: string;
  setNewNote: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AddEditModal({
  isEditing,
  newName,
  setNewName,
  newUrl,
  setNewUrl,
  newUsername,
  setNewUsername,
  newPassword,
  setNewPassword,
  newNote,
  setNewNote,
  onClose,
  onSave,
}: AddEditModalProps) {
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";
  const inputStyle =
    "bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium focus:border-amber-500/40 transition-all placeholder:text-neutral-700";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Cabeçalho - Fixo */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              {isEditing ? (
                <Edit2 className="w-5 h-5 text-amber-500" />
              ) : (
                <Plus className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                {isEditing ? "Editar credencial" : "Nova credencial"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Gestão de acesso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Área rolável */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className={lc}>Serviço</Label>
                <Input
                  placeholder="Ex: Google, Netflix"
                  className={inputStyle}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>Usuário / e-mail</Label>
                <Input
                  placeholder="Seu usuário"
                  className={inputStyle}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>URL</Label>
                <Input
                  placeholder="Ex: google.com"
                  className={inputStyle}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>Senha</Label>
                <Input
                  type="password"
                  placeholder="Senha de acesso"
                  className={inputStyle}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className={lc}>Notas (criptografado)</Label>
                <Input
                  placeholder="Dicas ou observações importantes sobre este acesso..."
                  className={inputStyle}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 pb-1">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
              >
                {isEditing ? "Salvar alterações" : "Criar credencial"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
              >
                Agora não
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
