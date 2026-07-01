"use client";

import { invoke } from "@tauri-apps/api/core";
import { RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { ACHIEVEMENTS } from "@/config/achievements.config";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showXpResetConfirm, setShowXpResetConfirm] = useState(false);
  const [resettingXp, setResettingXp] = useState(false);

  const handleResetXp = async () => {
    if (!user?.id) return;
    setResettingXp(true);
    try {
      // Busca as conquistas desbloqueadas a partir do banco
      const { unlockedAchievements } = await invoke<{
        unlockedAchievements: { achievementId: string }[];
      }>("achievements_get_user_state", {
        userId: user.id,
        today: new Date().toISOString().slice(0, 10),
        threeDaysAgo: new Date(Date.now() - 3 * 86400000)
          .toISOString()
          .slice(0, 10),
      });

      // Monta a lista de (achievementId, xp) para as conquistas desbloqueadas
      const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a.xp]));
      const unlockedPairs: [string, number][] = unlockedAchievements
        .filter((ua) => achievementMap.has(ua.achievementId))
        .map((ua) => [
          ua.achievementId,
          achievementMap.get(ua.achievementId) ?? 0,
        ]);

      await invoke("achievements_reset_xp_and_resync", {
        userId: user.id,
        achievements: unlockedPairs,
      });

      toast.success("XP recalculado com base nas suas conquistas!");
      setShowXpResetConfirm(false);

      // Dispara refresh na tela de conquistas
      window.dispatchEvent(new Event("aegis-achievements-refresh"));
    } catch (err) {
      console.error("Erro ao resetar XP:", err);
      toast.error("Erro ao recalcular XP.");
    } finally {
      setResettingXp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {showDeleteModal && (
        <DeleteAccountModal
          username={username}
          masterCodeIndex={masterCodeIndex}
          onConfirm={async (password) => {
            await onDeleteAccount(password);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Reset de XP */}
      <div className="p-5 bg-card border border-border rounded-xl space-y-4">
        <div className="space-y-1">
          <p className="font-bold text-foreground">Recalcular XP Global</p>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Reseta o XP acumulado e recalcula com base apenas nas suas
            conquistas desbloqueadas. Use isso se o XP estiver inconsistente.
            <span className="text-amber-500 dark:text-amber-400 font-semibold ml-1">
              XP de registros (sono, estudos, etc.) será perdido.
            </span>
          </p>
        </div>

        {showXpResetConfirm ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Tem certeza? Esta ação apaga o histórico de XP e só mantém o XP
              das suas conquistas.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={resettingXp}
                onClick={handleResetXp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${resettingXp ? "animate-spin" : ""}`}
                />
                {resettingXp ? "Recalculando..." : "Confirmar Reset"}
              </button>
              <button
                type="button"
                onClick={() => setShowXpResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-accent text-sm font-medium cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowXpResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-amber-500 hover:bg-amber-500/10 text-sm font-bold cursor-pointer group transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recalcular XP pelas conquistas
          </button>
        )}
      </div>

      {/* Excluir Conta */}
      <div className="p-5 bg-card border border-border rounded-xl space-y-4">
        <div className="space-y-1">
          <p className="font-bold text-foreground">Excluir Conta Local</p>
          <p className="text-muted-foreground leading-relaxed text-sm">
            Ao deletar sua conta, todos os dados criptografados (senhas, notas,
            hábitos, etc.) serão removidos permanentemente deste dispositivo.
            <span className="text-red-600 dark:text-red-400 font-bold ml-1">
              Esta ação não pode ser desfeita.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 hover:bg-red-500/10 text-sm font-bold cursor-pointer group transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Deletar minha conta permanentemente
        </button>
      </div>
    </div>
  );
}
