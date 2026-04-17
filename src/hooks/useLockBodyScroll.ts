"use client";

import { useEffect } from "react";

/**
 * Hook para travar o scroll do body quando um componente (ex: Modal) está montado.
 * @param lock Se true, trava o scroll. Se false, não faz nada.
 */
export function useLockBodyScroll(lock = true) {
  useEffect(() => {
    if (!lock) {
      document.body.style.overflow = "auto";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [lock]);
}
