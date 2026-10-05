import type { HTMLAttributes, ReactNode } from "react";
import { initialsOf } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the soft raised look used on summaries. */
  elevated?: boolean;
  /** Adds the forest-green gradient treatment. */
  tone?: "default" | "forest";
  padding?: "none" | "sm" | "md" | "lg";
}

const cardPadding: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3.5",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export function Card({
  className,
  elevated,
  tone = "default",
  padding = "md",
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        tone === "forest"
          ? "bg-linear-to-br from-forest-800 to-forest-600 text-white shadow-lg shadow-forest-900/20"
          : cn(
              "bg-white text-ink-900",
              elevated
                ? "border border-cream-300 shadow-md shadow-forest-900/5"
                : "border border-cream-300",
            ),
        cardPadding[padding],
        className,
      )}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "positive"
  | "warning"
  | "danger"
  | "info"
  | "peach";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Renders a leading dot in the tone colour. */
  dot?: boolean;
  size?: "sm" | "md";
}

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-cream-200 text-ink-700 ring-cream-400",
  positive: "bg-sage-100 text-sage-800 ring-sage-300",
  warning: "bg-amber-100 text-amber-800 ring-amber-300",
  danger: "bg-danger-50 text-danger-600 ring-danger-200",
  info: "bg-forest-50 text-forest-700 ring-forest-200",
  peach: "bg-peach-100 text-peach-700 ring-peach-200",
};

const badgeDots: Record<BadgeTone, string> = {
  neutral: "bg-ink-500",
  positive: "bg-sage-600",
  warning: "bg-amber-600",
  danger: "bg-danger-500",
  info: "bg-forest-600",
  peach: "bg-peach-500",
};

export function Badge({
  tone = "neutral",
  dot,
  size = "sm",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-[12px]" : "px-3 py-1 text-[13px]",
        badgeTones[tone],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", badgeDots[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar — initials fallback with deterministic colour                       */
/* -------------------------------------------------------------------------- */

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const avatarSizes: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "size-7 text-[11px]",
  sm: "size-9 text-[13px]",
  md: "size-11 text-[15px]",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

const avatarPalette = [
  "bg-forest-100 text-forest-800",
  "bg-sage-100 text-sage-800",
  "bg-peach-100 text-peach-700",
  "bg-amber-100 text-amber-800",
  "bg-forest-200 text-forest-900",
];

/** Deterministic palette slot for a name, so the same person keeps their tint. */
function avatarPaletteIndex(name: string): number {
  let total = 0;
  for (const char of name) total += char.charCodeAt(0);
  return total % avatarPalette.length;
}

export function Avatar({ name, src, size = "md", className, ...rest }: AvatarProps) {
  const paletteIndex = avatarPaletteIndex(name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
        avatarSizes[size],
        !src && avatarPalette[paletteIndex],
        className,
      )}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  ProgressBar                                                                */
/* -------------------------------------------------------------------------- */

export interface ProgressBarProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  tone?: "forest" | "sage" | "warning" | "danger" | "peach";
  /** Accessible label, e.g. "Rent budget used". */
  label: string;
  /** Renders the track taller and adds a soft sheen. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const progressTones: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  forest: "bg-linear-to-r from-forest-600 to-forest-500",
  sage: "bg-linear-to-r from-sage-500 to-sage-400",
  warning: "bg-linear-to-r from-amber-500 to-amber-400",
  danger: "bg-linear-to-r from-danger-500 to-danger-400",
  peach: "bg-linear-to-r from-peach-500 to-peach-400",
};

const progressSizes: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export function ProgressBar({
  value,
  tone = "forest",
  label,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const rounded = Math.round(clamped);

  return (
    <div
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-cream-300",
        progressSizes[size],
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          progressTones[tone],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Picks a tone based on how much of a budget has been consumed. */
export function progressToneForPercent(percent: number): ProgressBarProps["tone"] {
  if (percent >= 100) return "danger";
  if (percent >= 85) return "warning";
  if (percent >= 60) return "peach";
  return "forest";
}

/* -------------------------------------------------------------------------- */
/*  Skeleton — loading placeholders                                           */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-cream-300/80", className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                 */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Secondary link/button under the primary action. */
  secondaryAction?: ReactNode;
  className?: string;
  /** Shrinks the icon and spacing for use inside a card. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-4 py-8" : "gap-4 px-6 py-14",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-2xl bg-forest-50 text-forest-600",
          compact ? "size-12" : "size-16",
        )}
      >
        {icon}
      </div>
      <div className="max-w-sm space-y-1.5">
        <h3
          className={cn(
            "font-bold text-ink-900",
            compact ? "text-[15px]" : "text-lg",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="text-[14px] leading-relaxed text-ink-500">
            {description}
          </p>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="mt-1 flex flex-col items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}