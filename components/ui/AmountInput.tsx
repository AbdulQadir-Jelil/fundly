"use client";

import { useCallback, useId, useMemo } from "react";
import { parseAmount, formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Input";

export interface AmountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called with the parsed number when the text is a usable amount. */
  onAmountChange?: (amount: number | null) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  labelSuffix?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  inputMode?: "text" | "decimal";
  className?: string;
  id?: string;
  name?: string;
}

/**
 * Naira-aware amount field.
 *
 * Keeps the raw string in state so partially-typed values ("" or "12,")
 * survive re-renders, while displaying grouped digits ("12,000") and
 * blocking anything that is not a plain number.
 */
export function AmountInput({
  label,
  value,
  onChange,
  onAmountChange,
  placeholder = "0",
  hint,
  error,
  labelSuffix,
  disabled,
  autoFocus,
  inputMode = "decimal",
  className,
  id,
  name,
}: AmountInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const handleChange = useCallback(
    (raw: string) => {
      // Keep digits and at most one decimal separator.
      const cleaned = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
      if (cleaned === value) return;
      onChange(cleaned);
      onAmountChange?.(parseAmount(cleaned));
    },
    [onAmountChange, onChange, value],
  );

  const handleBlur = useCallback(() => {
    const parsed = parseAmount(value);
    if (parsed === null || Number.isNaN(parsed)) return;
    onChange(formatNumber(parsed));
  }, [onChange, value]);

  const displayValue = useMemo(() => {
    const parsed = parseAmount(value);
    if (parsed === null) return value;
    // Only regroup when the user is not mid-typing a decimal.
    return value.includes(".") ? value : formatNumber(parsed);
  }, [value]);

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      labelSuffix={labelSuffix}
      className={className}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] font-semibold",
            error ? "text-danger-500" : "text-ink-500",
          )}
        >
          ₦
        </span>
        <input
          id={inputId}
          name={name ?? inputId}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            "w-full rounded-xl border bg-white pl-9 pr-4 text-[19px] font-semibold",
            "tabular text-ink-900 placeholder:font-normal placeholder:text-ink-400",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-ink-400",
            "min-h-[56px]",
            error
              ? "border-danger-500 bg-danger-50/40 focus:border-danger-600 focus:ring-4 focus:ring-danger-100"
              : "border-cream-500 focus:border-forest-500 focus:ring-4 focus:ring-forest-100",
          )}
        />
      </div>
    </Field>
  );
}