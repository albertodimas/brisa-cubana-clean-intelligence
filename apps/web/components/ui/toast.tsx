"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "warning" | "info";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
  showProgress?: boolean;
};

type ToastContextValue = {
  showToast: (
    message: string,
    options?: {
      type?: ToastType;
      duration?: number;
      action?: ToastAction;
      showProgress?: boolean;
    },
  ) => void;
  hideToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback(
    (
      message: string,
      options: {
        type?: ToastType;
        duration?: number;
        action?: ToastAction;
        showProgress?: boolean;
      } = {},
    ) => {
      const { type = "info", duration, action, showProgress = true } = options;

      const id = crypto.randomUUID();

      // Smart duration based on toast type if not explicitly provided
      const defaultDurations: Record<ToastType, number> = {
        success: 3000,
        info: 4000,
        warning: 5000,
        error: 6000,
      };

      const finalDuration = duration ?? defaultDurations[type];
      const toast: Toast = {
        id,
        type,
        message,
        duration: finalDuration,
        action,
        showProgress,
      };

      setToasts((prev) => [...prev, toast]);

      if (finalDuration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, finalDuration);
      }
    },
    [hideToast],
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const portalTarget = React.useMemo(() => {
    return typeof window !== "undefined" ? (document.body ?? null) : null;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {isMounted &&
        portalTarget &&
        createPortal(
          <ToastContainer toasts={toasts} onClose={hideToast} />,
          portalTarget,
        )}
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: "bg-emerald-950/90 border-emerald-500/50 text-emerald-50",
  error: "bg-red-950/90 border-red-500/50 text-red-50",
  warning: "bg-amber-950/90 border-amber-500/50 text-amber-50",
  info: "bg-brisa-900/90 border-brisa-500/50 text-brisa-50",
};

const progressBarColors = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-brisa-500",
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const Icon = toastIcons[toast.type];
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (!toast.showProgress || !toast.duration || toast.duration <= 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / toast.duration!) * 50; // Update every 50ms
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.showProgress]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      className={cn(
        "relative flex flex-col w-full sm:min-w-[320px] sm:max-w-md rounded-lg border shadow-xl backdrop-blur-md pointer-events-auto overflow-hidden",
        toastStyles[toast.type],
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                onClose(toast.id);
              }}
              className="mt-2 text-sm font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white rounded p-0.5"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {toast.showProgress && toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-black/20">
          <motion.div
            className={cn("h-full", progressBarColors[toast.type])}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}
