"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Loading() {
  const { themeStyles } = useTheme();

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background overflow-hidden">
      <div className="relative flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative"
        >
          {/* Anel pulsante ao redor do escudo */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 -m-4 rounded-2xl border-2 ${themeStyles.border} opacity-20`}
          />

          <div
            className={`p-6 rounded-3xl bg-card border ${themeStyles.border} relative overflow-hidden`}
          >
            <Shield
              className={`size-16 ${themeStyles.text} relative z-10`}
              strokeWidth={1.5}
            />
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              Aegis
              <span
                className={`w-1.5 h-1.5 rounded-full ${themeStyles.solid}`}
              />
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1 opacity-60">
              Sistema de Proteção Local
            </p>
          </motion.div>

          {/* Barra de progresso minimalista */}
          <div className="w-48 h-1 bg-muted rounded-full overflow-hidden relative border border-white/5">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute top-0 bottom-0 w-1/2 ${themeStyles.solid}`}
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40">
          <span>Segurança</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <span>Privacidade</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <span>Controle</span>
        </div>
      </motion.div>
    </div>
  );
}
