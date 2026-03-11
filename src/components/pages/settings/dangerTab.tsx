"use client";

import { ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteAccountModal } from "@/components/forms/DeleteAccountModal";

interface DangerTabProps {
  username: string;
  onDeleteAccount: (password: string) => Promise<void>;
}

export function DangerTab({ username, onDeleteAccount }: DangerTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      {showModal && (
        <DeleteAccountModal
          username={username}
          onConfirm={async (password) => {
            await onDeleteAccount(password);
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-500">Zona de Perigo</h2>
            <p className=" text-neutral-500">
              Ações irreversíveis que afetam sua conta e seus dados
              permanentemente.
            </p>
          </div>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="space-y-1">
            <p className="font-bold text-neutral-200">Excluir Conta Local</p>
            <p className=" text-neutral-500 leading-relaxed">
              Ao deletar sua conta, todos os dados criptografados (senhas,
              notas, hábitos, etc.) serão removidos permanentemente deste
              dispositivo.
              <span className="text-red-400 font-bold ml-1">
                Esta ação não pode ser desfeita.
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer group"
          >
            <Trash2 className="w-4 h-4" />
            Deletar minha conta permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}
