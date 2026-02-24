import { Edit2, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
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
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 shadow-2xl animate-in zoom-in duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEditing ? (
              <Edit2 className="w-5 h-5 text-amber-500" />
            ) : (
              <Plus className="w-5 h-5 text-amber-500" />
            )}
            {isEditing ? "Editar Credencial" : "Adicionar Nova Credencial"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Altere os dados da sua credencial salva"
              : "Preencha os dados do serviço que deseja salvar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input
                placeholder="Ex: Google, Netflix"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="Ex: google.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Usuário / E-mail</Label>
            <Input
              placeholder="Seu usuário"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="Senha forte"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas (Criptografado)</Label>
            <Input
              placeholder="Dicas, perguntas de segurança..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {isEditing ? "Atualizar Credencial" : "Salvar Credencial"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
