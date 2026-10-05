"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  RadioGroup — used for "Money received from" and similar choices           */
/* -------------------------------------------------------------------------- */

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional helper shown under the label. */
  hint?: string;
}

export interface RadioGroupProps<T extends string = string> {
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  /** Renders as a 2-column grid on wider screens. */
  columns?: 1 | 2;
  hint?: string;
  error?: string;
  className?: string;
  name?: string;
}

export function RadioGroup<T extends string = string>({
  legend,
  value,
  onChange,
  options,
  columns = 1,
  hint,
  error,
  className,
  name,
}: RadioGroupProps<T>) {
  const groupId = useId();
  const groupName = name ?? groupId;
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)}>
      <legend className="mb-1 text-[15px] font-semibold text-ink-800">
        {legend}
      </legend>

      {hint ? (
        <p id={hintId} className="-mt-0.5 text-[13px] leading-snug text-ink-500">
          {hint}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-label={legend}
        aria-describedby={error ? errorId : hintId}
        className={cn(
          "grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3.5 py-3",
                "transition-colors duration-150 ease-out",
                "hover:border-forest-300 hover:bg-forest-50/40",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest-700",
                selected
                  ? "border-forest-600 bg-forest-50"
                  : "border-cream-400",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={groupName}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  selected
                    ? "border-forest-600 bg-forest-600"
                    : "border-cream-500 bg-white",
                )}
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-[15px] font-medium",
                    selected ? "text-forest-800" : "text-ink-800",
                  )}
                >
                  {option.label}
                </span>
                {option.hint ? (
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[13px] font-medium text-danger-600"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/*  Checkbox — used in forms and settings rows                                 */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  description,
  className,
  disabled,
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "flex cursor-pointer items-start gap-3",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center pt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-700",
            checked
              ? "border-forest-600 bg-forest-600"
              : "border-cream-500 bg-white",
          )}
        >
          {checked ? (
            <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />
          ) : null}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink-800">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toggle — settings switches                                                */
/* -------------------------------------------------------------------------- */

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={toggleId}
          className="block text-[15px] font-medium text-ink-800"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-[13px] leading-snug text-ink-500">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-forest-600" : "bg-cream-500",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}