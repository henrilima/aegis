"use client";

import { useEffect } from "react";

/**
 * Hook para travar o scroll do body quando um componente (ex: Modal) está montado.
 * @param lock Se true, trava o scroll. Se false, não faz nada.
 */
export function useLockBodyScroll(lock = true) {
  useEffect(() => {
    if (!lock) return;

    // Salva estilo original
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // Trava scroll
    document.body.style.overflow = "hidden";

    // Destrava ao desmontar
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
}
