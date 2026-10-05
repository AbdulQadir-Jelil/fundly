"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional count rendered after the label, e.g. "All (12)". */
  count?: number;
}

export interface SegmentedProps<T extends string = string> {
  /** Accessible name for the group. */
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "sm" | "md";
}

/**
 * Horizontally scrollable tab bar used for report ranges, list filters and
 * money-in / money-out toggles. Scrolls instead of wrapping so long option
 * sets never push the layout onto two lines on a 360px screen.
 */
export function Segmented<T extends string = string>({
  label,
  value,
  onChange,
  options,
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 py-1",
        "rounded-xl bg-cream-300/70",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold",
              "transition-colors duration-150",
              size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-3.5 py-2 text-[14px]",
              selected
                ? "bg-white text-forest-800 shadow-xs"
                : "text-ink-600 hover:text-ink-900",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "tabular rounded-full px-1.5 py-px text-[11px] font-bold",
                  selected
                    ? "bg-forest-100 text-forest-800"
                    : "bg-cream-200 text-ink-500",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  FilterChip — horizontal scrollable chips (categories, sources)             */
/* -------------------------------------------------------------------------- */

export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
}

export function FilterChip({
  label,
  active,
  onClick,
  icon,
  count,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2",
        "text-[13px] font-semibold transition-colors duration-150",
        active
          ? "border-forest-700 bg-forest-700 text-white"
          : "border-cream-400 bg-white text-ink-700 hover:border-forest-300 hover:bg-forest-50",
        className,
      )}
    >
      {icon}
      {label}
      {typeof count === "number" ? (
        <span
          className={cn(
            "tabular text-[11px] font-bold",
            active ? "text-forest-100" : "text-ink-400",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}