"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

const LOADING_MESSAGES = [
  "Carregando configurações locais...",
  "Verificando integridade dos dados...",
  "Inicializando módulos de proteção...",
  "Sincronizando ambiente local...",
  "Pronto para uso",
];

export default function Loading() {
  const { themeStyles } = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev,
      );
    }, 450);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-background overflow-hidden select-none p-6">
      {/* Layout Lado a Lado (Horizontal) moderno e limpo */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-6 max-w-md w-full"
      >
        {/* Esquerda: Logo flutuante limpa */}
        <motion.div
          animate={{
            y: [-3, 3, -3],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-20 h-20 shrink-0 flex items-center justify-center"
        >
          <img
            src="/logo.webp"
            alt="Aegis Logo"
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Divisória vertical suave */}
        <div className="h-14 w-px bg-border/60 shrink-0" />

        {/* Direita: Título, mensagem dinâmica e barra de progresso */}
        <div className="flex flex-col flex-1 min-w-0 gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
              <span>Aegis</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${themeStyles.solid}`}
              />
            </h1>
            <span className="text-[10px] font-medium text-muted-foreground/50">
              v3.6
            </span>
          </div>

          {/* Mensagem dinâmica com transição fluida */}
          <div className="h-4 flex items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-medium text-muted-foreground truncate"
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Barra de progresso horizontal fluida sem sombras ou blur */}
          <div className="h-1 bg-muted/20 rounded-full overflow-hidden relative w-full mt-0.5">
            <motion.div
              animate={{
                left: ["-50%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute top-0 bottom-0 w-1/2 rounded-full ${themeStyles.solid}`}
            />
          </div>
        </div>
      </motion.div>

      {/* Rodapé minimalista em Sentence Case */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-10 flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40"
      >
        <span>Segurança</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>Privacidade</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <span>Controle</span>
      </motion.div>
    </div>
  );
}
