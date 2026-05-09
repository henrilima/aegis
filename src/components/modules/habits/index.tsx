"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  Activity,
  DownloadCloud,
  HelpCircle,
  Image as ImageIcon,
  LayoutGrid,
  Plus,
  ShieldOff,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { HabitsReportsTab } from "@/components/modules/habits/components/HabitsReportsTab";
import { EditHabitDialog } from "@/components/modules/habits/components/modals/editDialog";
import { HabitCreateModal } from "@/components/modules/habits/components/modals/habitCreateModal";
import { CardSkeletonGrid } from "@/components/ui/CardSkeletonGrid";
import { CONFIRM_PRESETS, ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { getModuleColor } from "@/modules.config";
import { HabitsInfoModal } from "./components/HabitsInfoModal";
import { HabitCard } from "./habitCard";
import type { Habit } from "./types";

type TabId = "all" | "positive" | "negative" | "report";

/**
 * Módulo de Hábitos: Monitoramento de comportamentos positivos e controle de vícios
 */
export default function HabitsPage() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [hardResetId, setHardResetId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const uid = user ? String(user.id) : "";

  // Busca lista de hábitos do usuário
  const fetchHabits = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<Habit[]>("list_habits", { userId: uid });
      setHabits(res);
    } catch {
      toast.error("Erro ao sincronizar hábitos");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleAdd = async (
    name: string,
    cooldown: number,
    type: "Positive" | "Negative",
    chargesAmount: number,
    chargesInterval: number,
    goalDays: number,
  ) => {
    if (!uid || isAdding) return;
    setIsAdding(true);
    const now = simulatedNow.toISOString();
    try {
      await invoke("add_habit", {
        habit: {
          userId: uid,
          name,
          habitType: type,
          lastSlip: now,
          createdAt: now,
          maxStreak: 0,
          cooldownDays: Math.max(1, cooldown),
          lastDone: null,
          chargesUsed: 0,
          chargesAmount: chargesAmount,
          chargesIntervalDays: chargesInterval,
          accumulates: false,
          lastChargeRefill: now,
          currentCharges: chargesAmount,
          currentStreak: 0,
          goalDays: goalDays > 0 ? goalDays : 0,
        },
      });
      fetchHabits();
      setCreateOpen(false);
      toast.success("Novo hábito rastreado!");
    } catch (e) {
      toast.error(`Não foi possível salvar o hábito: ${e}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingHabit) return;
    try {
      await invoke("update_habit", {
        habit: {
          ...editingHabit,
          cooldownDays: Math.max(1, editingHabit.cooldownDays),
        },
      });
      setEditingHabit(null);
      fetchHabits();
      toast.success("Hábito atualizado");
    } catch {
      toast.error("Erro na atualização");
    }
  };

  const confirmReset = async () => {
    if (!resetId) return;
    try {
      await invoke("reset_habit", {
        id: resetId,
        timestamp: simulatedNow.toISOString(),
      });
      setResetId(null);
      fetchHabits();
      toast.error("Reiniciado! Começando de novo...");
    } catch {
      toast.error("Erro ao reiniciar");
    }
  };

  const confirmHardReset = async () => {
    if (!hardResetId) return;
    try {
      await invoke("hard_reset_habit", {
        id: hardResetId,
        timestamp: simulatedNow.toISOString(),
      });
      setHardResetId(null);
      fetchHabits();
      toast.info("Dados limpos com sucesso.");
    } catch {
      toast.error("Erro ao limpar dados");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await invoke("delete_habit", { id: deleteId });
      setDeleteId(null);
      fetchHabits();
      toast.success("Hábito removido da lista");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  // Filtragem de listas
  const positive = habits.filter((h) => h.habitType === "Positive");
  const negative = habits.filter(
    (h) => h.habitType === "Negative" || h.habitType === "Bad",
  );

  const handleExportCSV = async () => {
    try {
      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "aegis_habitos_backup.csv",
      });

      if (!filePath) return;

      await invoke("export_habits_csv", { userId: uid, path: filePath });
      toast.success("Exportação de hábitos concluída!");
    } catch (e) {
      toast.error(
        `Falha ao exportar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleImportCSV = async () => {
    try {
      const filePath = await openDialog({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (filePath && typeof filePath === "string") {
        const count = await invoke<number>("import_habits_csv", {
          userId: uid,
          path: filePath,
        });
        toast.success(`${count} hábitos importados!`);
        await fetchHabits();
      }
    } catch (e) {
      toast.error(
        `Erro ao importar CSV: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  if (loading)
    return (
      <div className="w-full flex flex-col gap-6 px-1">
        <CardSkeletonGrid count={6} />
      </div>
    );

  const sortedHabits = [...habits].sort((a, b) => {
    const priority: Record<string, number> = {
      Positive: 0,
      Negative: 1,
      Bad: 1,
    };
    return (priority[a.habitType] ?? 2) - (priority[b.habitType] ?? 2);
  });

  const currentList =
    tab === "all" ? sortedHabits : tab === "positive" ? positive : negative;

  const HABIT_TABS = [
    { id: "all", label: "Todos", icon: LayoutGrid },
    { id: "positive", label: "Foco", icon: Zap },
    { id: "negative", label: "Controle", icon: ShieldOff },
    { id: "report", label: "Relatório", icon: ImageIcon },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-12 text-foreground">
      <ModuleHeader
        color={getModuleColor("habits")}
        title="Hábitos & Disciplina"
        subtitle={`${habits.length} ativos · ${positive.length} foco · ${negative.length} controle`}
        icon={Activity}
        tabs={HABIT_TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
        actions={[
          {
            id: "import",
            label: "Importar",
            icon: UploadCloud,
            tooltip: "Importar Hábitos (CSV)",
            onClick: handleImportCSV,
          },
          {
            id: "export",
            label: "Exportar",
            icon: DownloadCloud,
            tooltip: "Exportar Hábitos (CSV)",
            onClick: handleExportCSV,
          },
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
          {
            id: "add",
            label: "Novo Hábito",
            icon: Plus,
            tooltip: "Adicionar novo hábito",
            primary: true,
            onClick: () => setCreateOpen(true),
          },
        ]}
      />

      {/* Listagem / Relatório */}
      {tab === "report" ? (
        <HabitsReportsTab habits={habits} />
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhum hábito rastreado"
          description="Você ainda não possui registros nesta categoria. Comece definindo uma nova meta de disciplina."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((h, i) => (
            <div
              key={h.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <HabitCard
                habit={h}
                onRefresh={fetchHabits}
                onEdit={setEditingHabit}
                onOpenResetDialog={setResetId}
                onOpenHardResetDialog={setHardResetId}
                onDelete={setDeleteId}
              />
            </div>
          ))}
        </div>
      )}

      <HabitsInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {/* Modais */}
      {createOpen && (
        <HabitCreateModal
          onAdd={handleAdd}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editingHabit && (
        <EditHabitDialog
          habit={editingHabit}
          setHabit={setEditingHabit}
          onUpdate={handleUpdate}
        />
      )}

      {/* Confirmações */}
      {resetId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.resetStreak}
          onConfirm={confirmReset}
          onCancel={() => setResetId(null)}
        />
      )}
      {hardResetId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.hardReset}
          onConfirm={confirmHardReset}
          onCancel={() => setHardResetId(null)}
        />
      )}
      {deleteId !== null && (
        <ConfirmModal
          {...CONFIRM_PRESETS.deleteHabit}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
