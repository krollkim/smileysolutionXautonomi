"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

let toastCallback: ((toast: ToastMessage) => void) | null = null;

export function showToast(message: string, type: "success" | "error" = "success") {
  const toast: ToastMessage = {
    id: Math.random().toString(36).slice(2),
    type,
    message,
  };
  toastCallback?.(toast);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastCallback = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };

    return () => {
      toastCallback = null;
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`
              px-4 py-3 rounded-lg text-sm font-medium shadow-lg
              ${toast.type === "success"
                ? "bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-primary)]"
                : "bg-red-900/20 border border-red-800 text-red-300"
              }
            `}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
