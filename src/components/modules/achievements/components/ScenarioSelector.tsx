"use client";

import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PET_BACKGROUNDS,
  PET_SCENARIOS_CONFIG,
  type PetScenarioConfig,
} from "@/config/pets.config";
import { cn } from "@/lib/utils";

const scenarioKeys = Object.keys(PET_SCENARIOS_CONFIG);

interface ScenarioSelectorProps {
  selectedScenario: string;
  onSelectScenario: (scenarioId: string) => void;
  selectedBgMode: "cyclic" | "day" | "afternoon" | "night";
  onSelectBgMode: (mode: "cyclic" | "day" | "afternoon" | "night") => void;
  userLevel: number;
}

export function ScenarioSelector({
  selectedScenario,
  onSelectScenario,
  selectedBgMode,
  onSelectBgMode,
  userLevel,
}: ScenarioSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Cenário & Período do Dia
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Selecione o cenário do habitat e defina o período do dia desejado ou
            modo cíclico automático.
          </p>
        </div>

        {/* Seletor integrado de período do dia */}
        <div className="shrink-0">
          <Select
            value={selectedBgMode}
            onValueChange={(val) =>
              onSelectBgMode(val as "cyclic" | "day" | "afternoon" | "night")
            }
          >
            <SelectTrigger className="w-full sm:w-44 bg-card border-border/50 text-xs">
              <SelectValue placeholder="Período do dia" />
            </SelectTrigger>
            <SelectContent>
              {PET_BACKGROUNDS.map((bg) => (
                <SelectItem key={bg.id} value={bg.id} className="text-xs">
                  {bg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border/70 bg-card/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scenarioKeys.map((key) => {
            const scenario: PetScenarioConfig = PET_SCENARIOS_CONFIG[key];
            const isSelected = selectedScenario === key;
            const isUnlocked = userLevel >= scenario.requiredLevel;

            return (
              <button
                key={key}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectScenario(key);
                  }
                }}
                disabled={!isUnlocked}
                type="button"
                className={cn(
                  "group relative flex flex-col rounded-xl border p-2 transition-all select-none overflow-hidden text-left cursor-pointer",
                  isUnlocked
                    ? isSelected
                      ? "border-amber-500/60 bg-amber-500/10 shadow-xs"
                      : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
                    : "border-border/30 bg-muted/5 opacity-60 cursor-not-allowed",
                )}
              >
                {/* Miniatura do Cenário */}
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/40 bg-black/20">
                  <div
                    className={cn(
                      "absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105",
                      !isUnlocked && "grayscale brightness-50",
                    )}
                    style={{
                      backgroundImage: `url("${scenario.defaultImage}")`,
                    }}
                  />

                  {/* Badge de Nível para Bloqueados */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] gap-1 p-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-300">
                        Nível {scenario.requiredLevel}
                      </span>
                    </div>
                  )}

                  {/* Indicador Ativo */}
                  {isUnlocked && isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md">
                      Ativo
                    </div>
                  )}
                </div>

                {/* Info do Cenário */}
                <div className="flex flex-col mt-2 px-1">
                  <span
                    className={cn(
                      "text-xs font-bold truncate",
                      isSelected ? "text-amber-500" : "text-foreground",
                    )}
                  >
                    {scenario.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {scenario.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
