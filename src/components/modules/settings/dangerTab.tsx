"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";

interface DangerTabProps {
  username: string;
  masterCodeIndex: number;
  onDeleteAccount: (password: string) => Promise<void>;
}

export function DangerTab({
  username,
  masterCodeIndex,
  onDeleteAccount,
}: DangerTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      {showModal && (
        <DeleteAccountModal
          username={username}
          masterCodeIndex={masterCodeIndex}
          onConfirm={async (password) => {
            await onDeleteAccount(password);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="p-5 bg-card border border-border rounded-xl space-y-4">
        <div className="space-y-1">
          <p className="font-bold text-foreground">Excluir Conta Local</p>
          <p className=" text-muted-foreground leading-relaxed">
            Ao deletar sua conta, todos os dados criptografados (senhas, notas,
            hábitos, etc.) serão removidos permanentemente deste dispositivo.
            <span className="text-red-600 dark:text-red-400 font-bold ml-1">
              Esta ação não pode ser desfeita.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 hover:bg-red-500/10 text-sm font-bold cursor-pointer group"
        >
          <Trash2 className="w-4 h-4" />
          Deletar minha conta permanentemente
        </button>
      </div>
    </div>
  );
}
