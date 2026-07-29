"use client";

import { motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getRankForLevel } from "@/config/achievements.config";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  delay: number;
  shape: "circle" | "square" | "triangle";
}

const COLORS = [
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
];

export function LevelUpParticles() {
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(
    null,
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLevelUpData(null);
    setParticles([]);
  };

  useEffect(() => {
    const trigger = async (lvl: number) => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const config = await invoke<{ showLevelUpModal?: boolean }>(
          "global_get_app_config",
        );
        if (!config || config.showLevelUpModal !== true) {
          return;
        }
      } catch {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setLevelUpData({ level: lvl });

      // Gera as partículas para a explosão
      const count = 80;
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 8 + 6,
          angle: Math.random() * 360,
          speed: Math.random() * 15 + 10,
          delay: Math.random() * 0.2,
          shape: ["circle", "square", "triangle"][
            Math.floor(Math.random() * 3)
          ] as "circle" | "square" | "triangle",
        });
      }
      setParticles(newParticles);

      timerRef.current = setTimeout(() => {
        setLevelUpData(null);
        setParticles([]);
        timerRef.current = null;
      }, 5000);
    };

    if (typeof window !== "undefined") {
      (
        window as unknown as { aegisTriggerLevelUp?: (lvl: number) => void }
      ).aegisTriggerLevelUp = trigger;
    }

    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent<{ level: number }>;
      const lvl = customEvent.detail?.level;
      if (typeof lvl === "number") {
        trigger(lvl);
      }
    };

    window.addEventListener("aegis-level-up", handleLevelUp);
    return () => {
      window.removeEventListener("aegis-level-up", handleLevelUp);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (typeof window !== "undefined") {
        (
          window as unknown as { aegisTriggerLevelUp?: (lvl: number) => void }
        ).aegisTriggerLevelUp = undefined;
      }
    };
  }, []);

  if (!levelUpData) return null;

  const rank = getRankForLevel(levelUpData.level);

  return (
    <div className="fixed inset-0 pointer-events-none z-9999 flex items-center justify-center overflow-hidden">
      {/* Overlay de fundo sutil sem sombras */}
      <div className="absolute inset-0 bg-background/25 backdrop-blur-xs" />

      {/* Explosão de partículas de Confete */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => {
          const angleRad = (p.angle * Math.PI) / 180;
          const destX = Math.cos(angleRad) * p.speed * 25;
          const destY = Math.sin(angleRad) * p.speed * 25 + 200;

          return (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: destX,
                y: destY,
                scale: [0, 1.2, 0.8, 0],
                opacity: [1, 1, 0.8, 0],
                rotate: p.angle * 4,
              }}
              transition={{
                duration: 2.2,
                ease: "easeOut",
                delay: p.delay,
              }}
              style={{
                width: p.size,
                height: p.size,
                borderRadius:
                  p.shape === "circle"
                    ? "50%"
                    : p.shape === "triangle"
                      ? "0"
                      : "2px",
                borderStyle: p.shape === "triangle" ? "solid" : "none",
                borderWidth:
                  p.shape === "triangle"
                    ? `0 ${p.size / 2}px ${p.size}px ${p.size / 2}px`
                    : "0",
                borderColor:
                  p.shape === "triangle"
                    ? `transparent transparent ${p.color} transparent`
                    : "transparent",
                background: p.shape === "triangle" ? "transparent" : p.color,
              }}
              className="absolute"
            />
          );
        })}
      </div>

      {/* Card de Parabéns Padronizado */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative pointer-events-auto px-6 py-5 rounded-2xl border border-border bg-card/95 backdrop-blur-md flex flex-col items-center gap-4 text-center max-w-70"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 mt-2">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground flex items-center justify-center gap-1.5">
            Nível subiu!
          </h2>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Você alcançou um novo patamar no Aegis.
          </p>
        </div>

        <div className="py-2 px-4 rounded-xl bg-muted/50 border border-border/60 w-full text-center">
          <span className="text-[10px] text-muted-foreground block">
            Rank atual
          </span>
          <span className="text-sm font-semibold text-foreground">
            {rank.name} • Nível {levelUpData.level}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed italic px-2">
          "{rank.description}"
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-1 px-4 py-2 border border-border/80 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Continuar
        </button>
      </motion.div>
    </div>
  );
}
