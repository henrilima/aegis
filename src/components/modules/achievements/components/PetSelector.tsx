"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { PETS_CONFIG } from "@/config/pets.config";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const petOrder = Object.keys(PETS_CONFIG);

export const PETS_LIST = [
  { id: "doberman", name: "Doberman", size: 48, frames: 4 },
  { id: "gato_cerveja", name: "Gato Cerveja", size: 48, frames: 4 },
  { id: "shiba", name: "Shiba", size: 48, frames: 4 },
  { id: "gato_preto", name: "Gato Preto", size: 48, frames: 4 },
  { id: "rato_marrom", name: "Rato Marrom", size: 32, frames: 4 },
  { id: "rato_azul", name: "Rato Azul", size: 32, frames: 4 },
  { id: "passaro", name: "Pássaro", size: 32, frames: 4 },
  { id: "pombo", name: "Pombo", size: 32, frames: 4 },
  { id: "slime", name: "Slime", size: 32, frames: 8 },
].sort((a, b) => petOrder.indexOf(a.id) - petOrder.indexOf(b.id));

interface PetSelectorProps {
  selectedPet: string;
  onSelectPet: (petId: string) => void;
  userLevel: number;
}

export function PetSelector({
  selectedPet,
  onSelectPet,
  userLevel,
}: PetSelectorProps) {
  const { user } = useAuth();
  const uid = user?.id ? String(user.id) : "";
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadNames = () => {
      const names: Record<string, string> = {};
      for (const pet of PETS_LIST) {
        const key = uid
          ? `aegis_pet_custom_name_${uid}_${pet.id}`
          : `aegis_pet_custom_name_${pet.id}`;
        const saved =
          localStorage.getItem(key) ??
          localStorage.getItem(`aegis_pet_custom_name_${pet.id}`);
        if (saved) {
          names[pet.id] = saved;
        }
      }
      setCustomNames(names);
    };

    loadNames();
    window.addEventListener("aegis-pet-renamed", loadNames);
    return () => window.removeEventListener("aegis-pet-renamed", loadNames);
  }, [uid]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-bold text-foreground">
          Escolha seu Mascote
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Selecione o pet que irá acompanhar sua produtividade e rotina.
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-border/70 bg-card/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PETS_LIST.map((pet) => {
            const isSelected = selectedPet === pet.id;
            const rule = PETS_CONFIG[pet.id];
            const isUnlocked = userLevel >= (rule?.minLevel ?? 1);

            // Sprite original 48x48 ou 32x32 escalado para 40x40 para visualização estática
            const bgWidth = pet.frames * 40;

            const customName = customNames[pet.id];
            const hasDifferentCustomName =
              customName &&
              customName.trim().toLowerCase() !== pet.name.trim().toLowerCase();

            const displayName = hasDifferentCustomName
              ? `${customName} (${pet.name})`
              : pet.name;

            return (
              <button
                key={pet.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectPet(pet.id);
                  }
                }}
                disabled={!isUnlocked}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all select-none relative overflow-hidden",
                  isUnlocked
                    ? isSelected
                      ? "border-amber-500/40 bg-amber-500/5 text-amber-500 cursor-pointer"
                      : "border-border/50 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20 cursor-pointer"
                    : "border-border/20 bg-muted/5 text-muted-foreground/30 border-dashed cursor-not-allowed opacity-60",
                )}
                type="button"
              >
                {/* Frame estático de Preview do Pet */}
                <div
                  className="shrink-0"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundImage: `url("/pets/${encodeURIComponent(pet.id)}/Idle.png")`,
                    backgroundSize: `${bgWidth}px 40px`,
                    backgroundPosition: "0px 0px",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    filter: isUnlocked
                      ? "none"
                      : "grayscale(100%) brightness(60%) contrast(80%)",
                  }}
                />

                {isUnlocked ? (
                  <span
                    className="text-[11px] font-bold truncate w-full text-center px-1"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <span className="text-[11px] font-bold truncate w-full text-center text-muted-foreground/45">
                      {pet.name}
                    </span>
                    <span className="text-[9px] font-semibold text-amber-600/80 mt-0.5 flex items-center gap-0.5 justify-center w-full">
                      <Lock className="w-2.5 h-2.5 shrink-0" /> Lvl{" "}
                      {rule?.minLevel}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
