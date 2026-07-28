"use client";

import {
  AlarmClock,
  CheckSquare,
  HelpCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getModuleColor } from "@/modules.config";
import { AlarmsGuidePanel } from "./AlarmsInfoModal";
import { AlarmCard } from "./components/AlarmCard";
import { AlarmFormModal } from "./components/AlarmFormModal";
import { useAlarmsLogic } from "./hooks/useAlarmsLogic";

export default function AlarmsPage() {
  const {
    alarms,
    loading,
    audioOptions,
    availableSounds,
    isModalOpen,
    setIsModalOpen,
    isInfoOpen,
    setIsInfoOpen,
    isSaving,
    form,
    setTitle,
    setAlarmType,
    setTime,
    setIntervalMinutes,
    setSoundFile,
    setIconName,
    setColor,
    setTriggerMode,
    handleSave,
    handleDelete,
    handleBulkDelete,
    handleToggle,
    handleEdit,
    openNew,
    playPreview,
    resetForm,
  } = useAlarmsLogic();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await handleBulkDelete(Array.from(selectedIds));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold">
          <AlarmClock className="w-4 h-4" /> Carregando alertas...
        </div>
      </div>
    );
  }

  if (isInfoOpen) {
    return (
      <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground">
        <ModuleHeader
          moduleId="alarms"
          color={getModuleColor("alarms")}
          title="Alarmes & Alertas"
          subtitle={`${alarms.filter((a) => a.enabled).length} ativos de ${alarms.length} totais`}
          icon={AlarmClock}
          onTitleClick={() => setIsInfoOpen(true)}
          titleHoverIcon={HelpCircle}
          titleTooltip="Visualizar Guia de Alarmes"
          actions={[]}
        />
        <AlarmsGuidePanel onBack={() => setIsInfoOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground">
      <ModuleHeader
        moduleId="alarms"
        color={getModuleColor("alarms")}
        title="Alarmes & Alertas"
        subtitle={`${alarms.filter((a) => a.enabled).length} ativos de ${alarms.length} totais`}
        icon={AlarmClock}
        onTitleClick={() => setIsInfoOpen(true)}
        titleHoverIcon={HelpCircle}
        titleTooltip="Visualizar Guia de Alarmes"
        actions={
          selectionMode
            ? [
                {
                  id: "cancel",
                  label: "Cancelar",
                  icon: X,
                  tooltip: "Cancelar seleção",
                  onClick: () => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  },
                },
                {
                  id: "delete",
                  label: `Excluir (${selectedIds.size})`,
                  icon: Trash2,
                  tooltip: "Excluir selecionados",
                  primary: true,
                  onClick: confirmBulkDelete,
                },
              ]
            : [
                {
                  id: "select",
                  label: "Selecionar",
                  icon: CheckSquare,
                  tooltip: "Selecionar vários",
                  onClick: () => setSelectionMode(true),
                },
                {
                  id: "new",
                  label: "Novo Alarme",
                  icon: Plus,
                  tooltip: "Criar novo alarme",
                  primary: true,
                  onClick: openNew,
                },
              ]
        }
      />

      <AlarmFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        form={form}
        audioOptions={audioOptions}
        availableSounds={availableSounds}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={resetForm}
        setTitle={setTitle}
        setAlarmType={setAlarmType}
        setTime={setTime}
        setIntervalMinutes={setIntervalMinutes}
        setSoundFile={setSoundFile}
        setIconName={setIconName}
        setColor={setColor}
        setTriggerMode={setTriggerMode}
        playPreview={playPreview}
      />

      {alarms.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="Silêncio total por aqui"
          description="Você ainda não tem nenhum alarme configurado. Crie lembretes personalizados para não esquecer de nada importante."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              selectionMode={selectionMode}
              selected={alarm.id !== undefined && selectedIds.has(alarm.id)}
              onSelect={(id) => toggleSelection(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
