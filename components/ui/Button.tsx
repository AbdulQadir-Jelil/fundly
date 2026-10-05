"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const baseClasses =
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-all duration-150 ease-out select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-55 " +
  "active:scale-[0.985] touch-manipulation whitespace-nowrap";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-forest-700 text-white shadow-sm " +
    "hover:bg-forest-800 hover:shadow-lifted " +
    "focus-visible:outline-forest-700 " +
    "active:bg-forest-900",
  secondary:
    "bg-white text-forest-800 border border-cream-500 shadow-xs " +
    "hover:bg-cream-100 hover:border-forest-300 " +
    "focus-visible:outline-forest-700",
  outline:
    "bg-transparent text-forest-800 border border-forest-300 " +
    "hover:bg-forest-50 hover:border-forest-400 " +
    "focus-visible:outline-forest-700",
  ghost:
    "bg-transparent text-ink-600 hover:bg-cream-300/70 hover:text-ink-900 " +
    "focus-visible:outline-forest-700",
  danger:
    "bg-danger-500 text-white shadow-sm " +
    "hover:bg-danger-600 hover:shadow-lifted " +
    "focus-visible:outline-danger-600 active:bg-danger-700",
  success:
    "bg-sage-600 text-white shadow-sm hover:bg-sage-700 " +
    "focus-visible:outline-sage-700",
};

/* Comfortable touch targets: 44px minimum on mobile, per WCAG 2.5.5. */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[40px] px-3.5 text-sm",
  md: "min-h-[46px] px-4 text-[15px]",
  lg: "min-h-[52px] px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: Pick<
  ButtonBaseProps,
  "variant" | "size" | "fullWidth" | "className"
>): string {
  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps
  extends ButtonBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {}

/* -------------------------------------------------------------------------- */
/*  Button                                                                     */
/* -------------------------------------------------------------------------- */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      fullWidth,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, fullWidth, className })}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Link styled as a button                                                    */
/* -------------------------------------------------------------------------- */

export interface ButtonLinkProps
  extends ButtonBaseProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> {
  href: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}