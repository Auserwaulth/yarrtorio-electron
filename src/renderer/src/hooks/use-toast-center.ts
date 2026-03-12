import { useCallback, useMemo, useState } from "react";
import type { AppSettings } from "@shared/types/mod";

export interface ToastItem {
  id: string;
  tone: "info" | "success" | "error";
  text: string;
}

export function useToastCenter(
  snackbarPosition: AppSettings["snackbarPosition"],
) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((tone: ToastItem["tone"], text: string) => {
    const toast: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tone,
      text,
    };

    setToasts((current) => [toast, ...current].slice(0, 4));

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 4000);
  }, []);

  const toastPositionClass = useMemo(
    () =>
      ({
        "top-left": "toast-top toast-start",
        "top-right": "toast-top toast-end",
        "bottom-left": "toast-bottom toast-start",
        "bottom-right": "toast-bottom toast-end",
      })[snackbarPosition],
    [snackbarPosition],
  );

  return {
    toasts,
    pushToast,
    toastPositionClass,
  };
}
