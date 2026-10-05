"use client";

import { AlertCircle } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Field — label + control + hint + error, wired for accessibility           */
/* -------------------------------------------------------------------------- */

export interface FieldProps {
  label: string;
  htmlFor: string;
  /** Optional hint shown under the label. */
  hint?: string;
  error?: string;
  /** Rendered at the right of the label row (e.g. an "Optional" badge). */
  labelSuffix?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  labelSuffix,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[15px] font-semibold text-ink-800"
        >
          {label}
          {required ? (
            <span className="ml-1 text-danger-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {labelSuffix}
      </div>

      {hint ? (
        <p id={`${htmlFor}-hint`} className="-mt-0.5 text-[13px] leading-snug text-ink-500">
          {hint}
        </p>
      ) : null}

      {children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-danger-600"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Shared control styling so every input looks identical. */
export const controlClasses = (error?: boolean): string =>
  cn(
    "w-full rounded-xl border bg-white px-3.5 text-[15px] text-ink-900",
    "placeholder:text-ink-400",
    "transition-colors duration-150",
    "focus:outline-none focus-visible:outline-none",
    "disabled:cursor-not-allowed disabled:bg-cream-100 disabled:text-ink-400",
    "min-h-[48px]",
    error
      ? "border-danger-500 bg-danger-50/40 focus:border-danger-600 focus:ring-4 focus:ring-danger-100"
      : "border-cream-500 hover:border-cream-500 focus:border-forest-500 focus:ring-4 focus:ring-forest-100",
  );

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  labelSuffix?: ReactNode;
  /** Optional leading adornment, e.g. a mail or lock icon. */
  leadingIcon?: ReactNode;
  /** Optional trailing slot, e.g. a password reveal toggle. */
  trailing?: ReactNode;
  containerClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Input                                                                      */
/* -------------------------------------------------------------------------- */

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    labelSuffix,
    leadingIcon,
    trailing,
    className,
    containerClassName,
    id,
    required,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const control = (
    <div className="relative">
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
        >
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={cn(
          controlClasses(Boolean(error)),
          leadingIcon && "pl-11",
          trailing && "pr-11",
          className,
        )}
        {...rest}
      />
      {trailing ? (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      ) : null}
    </div>
  );

  if (!label) return control;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      labelSuffix={labelSuffix}
      required={required}
      className={containerClassName}
    >
      {control}
    </Field>
  );
});

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                   */
/* -------------------------------------------------------------------------- */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  labelSuffix?: ReactNode;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      hint,
      error,
      labelSuffix,
      className,
      containerClassName,
      id,
      required,
      rows = 3,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    const control = (
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : hint
              ? `${textareaId}-hint`
              : undefined
        }
        className={cn(
          controlClasses(Boolean(error)),
          "min-h-[92px] resize-y py-3 leading-relaxed",
          className,
        )}
        {...rest}
      />
    );

    if (!label) return control;

    return (
      <Field
        label={label}
        htmlFor={textareaId}
        hint={hint}
        error={error}
        labelSuffix={labelSuffix}
        required={required}
        className={containerClassName}
      >
        {control}
      </Field>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Select                                                                     */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<InputHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  hint?: string;
  error?: string;
  labelSuffix?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    labelSuffix,
    options,
    placeholder,
    className,
    containerClassName,
    id,
    required,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${selectId}-error`
            : hint
              ? `${selectId}-hint`
              : undefined
        }
        className={cn(
          controlClasses(Boolean(error)),
          "cursor-pointer appearance-none pr-11",
          className,
        )}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
      />
    </div>
  );

  if (!label) return control;

  return (
    <Field
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      labelSuffix={labelSuffix}
      required={required}
      className={containerClassName}
    >
      {control}
    </Field>
  );
});