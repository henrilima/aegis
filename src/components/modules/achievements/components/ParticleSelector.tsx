"use client";

import { Lock } from "lucide-react";
import { PARTICLES_CONFIG } from "@/config/pets.config";
import { cn } from "@/lib/utils";

const particleKeys = Object.keys(PARTICLES_CONFIG);

interface ParticleSelectorProps {
  selectedParticle: string;
  onSelectParticle: (particleId: string) => void;
  userLevel: number;
}

export function ParticleSelector({
  selectedParticle,
  onSelectParticle,
  userLevel,
}: ParticleSelectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">
          Aura de Partículas
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Personalize a atmosfera visual flutuando ao redor de seu mascote.
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-border/70 bg-card/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {particleKeys.map((key) => {
            const particle = PARTICLES_CONFIG[key];
            const isSelected = selectedParticle === key;
            const isUnlocked = userLevel >= particle.minLevel;

            return (
              <button
                key={key}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectParticle(key);
                  }
                }}
                disabled={!isUnlocked}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all select-none relative overflow-hidden text-center min-h-[56px]",
                  isUnlocked
                    ? isSelected
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-500 cursor-pointer"
                      : "border-border/50 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20 cursor-pointer"
                    : "border-border/20 bg-muted/5 text-muted-foreground/30 border-dashed cursor-not-allowed opacity-60",
                )}
                type="button"
              >
                {isUnlocked ? (
                  <div className="flex flex-col w-full">
                    <span className="text-[11px] font-bold truncate w-full px-0.5">
                      {particle.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 font-medium truncate w-full mt-0.5">
                      {particle.rankName}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <span className="text-[11px] font-bold truncate w-full text-muted-foreground/45 px-0.5">
                      {particle.name}
                    </span>
                    <span className="text-[9px] font-semibold text-amber-600/80 mt-0.5 flex items-center gap-0.5 justify-center w-full">
                      <Lock className="w-2.5 h-2.5 shrink-0" /> Lvl{" "}
                      {particle.minLevel}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Informações da Partícula Ativa */}
        {PARTICLES_CONFIG[selectedParticle] && (
          <div className="mt-4 p-3 rounded-xl border border-border/40 bg-card/20 text-left">
            <h4 className="text-xs font-bold text-foreground">
              Efeito ativo: {PARTICLES_CONFIG[selectedParticle].name}
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
              {PARTICLES_CONFIG[selectedParticle].description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
