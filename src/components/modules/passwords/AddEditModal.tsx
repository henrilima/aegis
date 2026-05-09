"use client";

import { Edit2, Plus, X } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
  const color = getModuleColor("passwords");
  const theme = getColorTheme(color);
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const requiredClass = "text-red-500 ml-1";
  const inputStyle = cn(
    "bg-card border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700",
    theme.borderHover.replace("hover:", "focus:"),
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[850px]! bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabeçalho - Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
            >
              {isEditing ? (
                <Edit2 className={cn("w-5 h-5", theme.text)} />
              ) : (
                <Plus className={cn("w-5 h-5", theme.text)} />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {isEditing ? "Editar credencial" : "Nova credencial"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestão de acesso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Área rolável */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <form
            id="password-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-1.5">
                <Label className={lc}>
                  Serviço <span className={requiredClass}>*</span>
                </Label>
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
                <Label className={lc}>
                  Usuário / e-mail <span className={requiredClass}>*</span>
                </Label>
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
                <Label className={lc}>
                  Senha <span className={requiredClass}>*</span>
                </Label>
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
          </form>
          <div className="mt-4 flex items-center justify-end">
            <span className="text-[10px] text-muted-foreground font-medium">
              <span className={requiredClass}>*</span> Campos obrigatórios
            </span>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="password-form"
            className={cn(
              "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            {isEditing ? "Salvar alterações" : "Criar credencial"}
          </button>
        </div>
      </div>
    </div>
  );
}
