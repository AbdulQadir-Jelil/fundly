"use client";

import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Pinned action row at the bottom of the dialog. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Hides the header close button when the action is destructive-only. */
  hideClose?: boolean;
  /** Disables backdrop + Escape dismissal (e.g. while saving). */
  dismissible?: boolean;
  className?: string;
}

const modalSizes: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* -------------------------------------------------------------------------- */
/*  Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose,
  dismissible = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Remember the trigger so focus returns to it when the dialog closes.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  const requestClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  // Escape to close + Tab cycling inside the panel.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  // Lock body scroll while open, compensating for the scrollbar width so the
  // page behind does not shift sideways.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  // Move focus into the dialog on open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target =
      panel.querySelector<HTMLElement>("[data-autofocus]") ??
      panel.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    target.focus();
  }, [open]);

  useEffect(() => {
    if (open) return;
    restoreFocusRef.current?.focus?.();
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="absolute inset-0 animate-fade-in bg-ink-900/45 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white",
          "animate-slide-up shadow-pop sm:animate-scale-in sm:max-h-[88vh]",
          "rounded-t-3xl sm:rounded-3xl",
          modalSizes[size],
          "sm:m-4",
          className,
        )}
      >
        {/* Drag affordance on mobile sheets */}
        <div aria-hidden="true" className="flex justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-cream-500" />
        </div>

        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-bold leading-tight text-ink-900"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-[14px] leading-relaxed text-ink-500"
              >
                {description}
              </p>
            ) : null}
          </div>
          {hideClose ? null : (
            <IconButton
              label="Close"
              icon={<X className="size-5" />}
              onClick={onClose}
              variant="plain"
              size="sm"
              className="-mr-1.5 -mt-0.5 shrink-0"
            />
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="border-t border-cream-300 bg-cream-50 px-5 py-4 pb-safe sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  ConfirmDialog — destructive confirmation built on Modal                    */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shows a loading spinner on the confirm button. */
  loading?: boolean;
  tone?: "danger" | "primary";
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  tone = "danger",
  icon,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissible={!loading}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tone === "danger"
                ? "bg-danger-50 text-danger-600"
                : "bg-forest-50 text-forest-700",
            )}
          >
            {icon}
          </span>
        ) : null}
        <p className="pt-2 text-[15px] leading-relaxed text-ink-700">
          {message}
        </p>
      </div>
    </Modal>
  );
}