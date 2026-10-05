"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Optional inline action, e.g. "Undo". */
  action?: { label: string; onClick: () => void };
  duration: number;
}

type ToastInput = Omit<Partial<Toast>, "id"> & { title: string };

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: ToastInput) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4200;

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const counter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (input: ToastInput): string => {
      counter.current += 1;
      const id = `toast_${counter.current}`;
      const toast: Toast = {
        id,
        tone: input.tone ?? "success",
        title: input.title,
        message: input.message,
        action: input.action,
        duration: input.duration ?? DEFAULT_DURATION,
      };

      // Keep at most three on screen; drop the oldest first.
      setToasts((current) => {
        const next = [...current, toast];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });

      if (toast.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), toast.duration),
        );
      }

      return id;
    },
    [dismissToast],
  );

  // Clear pending timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      success: (title, message) => showToast({ tone: "success", title, message }),
      error: (title, message) => showToast({ tone: "error", title, message }),
      info: (title, message) => showToast({ tone: "info", title, message }),
      dismissToast,
    }),
    [dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}

/* -------------------------------------------------------------------------- */
/*  Viewport                                                                   */
/* -------------------------------------------------------------------------- */

const toastIcons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5" />,
  error: <AlertTriangle className="size-5" />,
  info: <Info className="size-5" />,
};

const toastToneClasses: Record<ToastTone, string> = {
  success: "bg-sage-50 text-sage-700",
  error: "bg-danger-50 text-danger-600",
  info: "bg-forest-50 text-forest-700",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-200 flex flex-col items-center gap-2",
        "top-3 px-3 pt-safe sm:top-5 sm:items-end sm:px-5",
      )}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl",
            "border border-cream-300 bg-white p-3.5 pr-2 shadow-lifted",
            "animate-toast-in",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
              toastToneClasses[toast.tone],
            )}
          >
            {toastIcons[toast.tone]}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[15px] font-semibold leading-snug text-ink-900">
              {toast.title}
            </p>
            {toast.message ? (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                {toast.message}
              </p>
            ) : null}
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="mt-2 rounded-lg px-1 text-[13px] font-bold text-forest-700 hover:text-forest-800"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>

          <IconButton
            label="Dismiss notification"
            icon={<X className="size-4" />}
            onClick={() => onDismiss(toast.id)}
            variant="plain"
            size="sm"
            className="-mt-0.5 shrink-0"
          />
        </div>
      ))}
    </div>,
    document.body,
  );
}