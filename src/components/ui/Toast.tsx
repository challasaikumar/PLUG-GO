"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { IconClose } from "./icons";

type ToastVariant = "info" | "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  push: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, variant }]);
    if (variant !== "error") {
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 6000);
    }
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast"
            role={toast.variant === "error" ? "alert" : "status"}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <p className="type-small" style={{ margin: 0, flex: 1 }}>
                {toast.message}
              </p>
              <button
                type="button"
                className="png-btn png-btn--outline png-btn--sm"
                style={{ width: 44, padding: 0, flexShrink: 0 }}
                aria-label="Dismiss notification"
                onClick={() =>
                  setToasts((current) => current.filter((item) => item.id !== toast.id))
                }
              >
                <IconClose />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
