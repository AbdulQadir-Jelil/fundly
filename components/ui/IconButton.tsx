"use client";

import Link from "next/link";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type IconButtonVariant =
  | "plain"
  | "surface"
  | "primary"
  | "danger"
  | "ghost-dark";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must expose an accessible name. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Renders an unread dot in the top-right corner. */
  badge?: boolean;
  className?: string;
}

const iconButtonVariants: Record<IconButtonVariant, string> = {
  plain: "bg-transparent text-ink-600 hover:bg-cream-300/70 hover:text-ink-900",
  surface:
    "bg-white text-ink-700 border border-cream-400 shadow-xs hover:bg-cream-100 hover:text-forest-700",
  primary:
    "bg-forest-700 text-white shadow-sm hover:bg-forest-800 focus-visible:outline-forest-700",
  danger:
    "bg-danger-50 text-danger-600 hover:bg-danger-100 focus-visible:outline-danger-600",
  "ghost-dark": "bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white",
};

/* 40 / 44 / 48px hit areas — comfortable for thumbs. */
const iconButtonSizes: Record<IconButtonSize, string> = {
  sm: "size-10 rounded-lg",
  md: "size-11 rounded-xl",
  lg: "size-12 rounded-xl",
};

/* -------------------------------------------------------------------------- */
/*  IconButton — button element                                               */
/* -------------------------------------------------------------------------- */

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      icon,
      variant = "plain",
      size = "md",
      badge,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95 touch-manipulation",
          iconButtonVariants[variant],
          iconButtonSizes[size],
          className,
        )}
        {...rest}
      >
        <span aria-hidden="true" className="flex items-center justify-center">
          {icon}
        </span>
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger-500 ring-2 ring-white"
          />
        ) : null}
      </button>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  IconLink — anchor element                                                 */
/* -------------------------------------------------------------------------- */

export interface IconLinkProps {
  label: string;
  href: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  badge?: boolean;
  className?: string;
  prefetch?: boolean;
}

export function IconLink({
  label,
  href,
  icon,
  variant = "plain",
  size = "md",
  badge,
  className,
  prefetch,
}: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      prefetch={prefetch}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:scale-95 touch-manipulation",
        iconButtonVariants[variant],
        iconButtonSizes[size],
        className,
      )}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
      {badge ? (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger-500 ring-2 ring-white"
        />
      ) : null}
    </Link>
  );
}