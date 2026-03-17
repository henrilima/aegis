"use client";

import { Lock, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { PasswordEntry } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface PasswordsWidgetProps {
  passwords: PasswordEntry[];
  vaultExists: boolean | null;
  isEditMode?: boolean;
}

export function PasswordsWidget({
  passwords,
  vaultExists,
  isEditMode,
}: PasswordsWidgetProps) {
  return (
    <BaseWidget
      title="Cofre de Senhas"
      icon={Shield}
      iconColor="text-amber-400"
      route="passwords"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl bg-amber-500/10 border border-amber-500/20`}
            >
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">
                {passwords.length}
              </p>
              <p className="text-[10px] font-medium text-neutral-500 mt-1">
                Credenciais salvas
              </p>
            </div>
          </div>

          {vaultExists ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Protegido
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-bold text-rose-400 uppercase">
                Inativo
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          {passwords.slice(0, 2).map((p, i) => (
            <div
              key={p.id ?? i}
              className="flex items-center gap-2 p-2 rounded-xl bg-neutral-800/30 border border-neutral-800/50"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              <span className="text-xs font-medium text-neutral-400 truncate flex-1">
                {p.site}
              </span>
            </div>
          ))}
          {passwords.length === 0 && (
            <p className="text-xs text-neutral-600 italic">Cofre vazio</p>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
