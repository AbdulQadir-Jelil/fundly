"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Calendar } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";
import { formatNaira, parseAmount } from "@/lib/currency";
import { todayISO } from "@/lib/date";
import { getFundTotals } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import {
  hasErrors,
  validateExpense,
  type ExpenseValues,
  type ValidationErrors,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/navigation/AppShell";
import {
  AmountInput,
  Button,
  ButtonLink,
  Card,
  Input,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import type { ExpenseCategory } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Category picker                                                           */
/* -------------------------------------------------------------------------- */

export function CategoryPicker({
  value,
  onChange,
  error,
}: {
  value: ExpenseCategory | "";
  onChange: (value: ExpenseCategory) => void;
  error?: string;
}) {
  const errorId = "expense-category-error";

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-[15px] font-semibold text-ink-800">
        Category
      </legend>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-describedby={error ? errorId : undefined}
      >
        {CATEGORY_LIST.map((meta) => {
          const Icon = meta.icon;
          const selected = value === meta.value;

          return (
            <button
              key={meta.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(meta.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700",
                selected
                  ? "border-forest-600 bg-forest-50"
                  : "border-cream-400 bg-white hover:border-forest-300",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  selected
                    ? "bg-forest-700 text-white"
                    : meta.tone === "peach"
                      ? "bg-peach-100 text-peach-700"
                      : meta.tone === "forest"
                        ? "bg-forest-100 text-forest-700"
                        : meta.tone === "butter"
                          ? "bg-butter-100 text-butter-500"
                          : meta.tone === "sage"
                            ? "bg-sage-100 text-sage-700"
                            : "bg-ink-100 text-ink-600",
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  selected ? "text-forest-800" : "text-ink-700",
                )}
              >
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/*  Expense form — shared by create and edit                                   */
/* -------------------------------------------------------------------------- */

export function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, hydrated, addExpense, updateExpense } = useFundly();
  const toast = useToast();

  const isEdit = Boolean(expenseId);
  const existing = expenseId
    ? data.expenses.find((item) => item.id === expenseId)
    : undefined;

  const preselectedFundId =
    existing?.fundId ?? searchParams.get("fund") ?? data.funds[0]?.id ?? "";

  const [fundId, setFundId] = useState(preselectedFundId);
  const [values, setValues] = useState<ExpenseValues>({
    description: existing?.description ?? "",
    amount: existing ? String(existing.amount) : "",
    category: existing?.category ?? "",
    date: todayISO(),
    note: existing?.note ?? "",
  });
  const [errors, setErrors] = useState<ValidationErrors<keyof ExpenseValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fund = data.funds.find((item) => item.id === fundId);
  const totals = fund
    ? getFundTotals(fund, data.transactions, data.expenses)
    : null;

  const amount = parseAmount(values.amount);

  /** Balance after this expense lands — shown live so the user sees impact. */
  const projected = totals && amount !== null ? totals.remaining - amount : null;

  const set =
    (field: keyof ExpenseValues) => (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateExpense(values);
    setErrors(found);
    if (hasErrors(found)) return;

    const parsed = parseAmount(values.amount);
    if (parsed === null) {
      setErrors({ amount: "Enter a valid amount" });
      return;
    }

    if (!fundId) {
      setFormError("Choose which fund this expense belongs to.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (existing) {
        await updateExpense(existing.id, {
          description: values.description,
          amount: parsed,
          category: values.category as ExpenseCategory,
          note: values.note,
        });
        toast.success(
          "Expense updated",
          "The previous value is kept in the edit history.",
        );
      } else {
        await addExpense({
          fundId,
          description: values.description,
          amount: parsed,
          category: values.category as ExpenseCategory,
          note: values.note,
          createdAt: new Date(values.date).toISOString(),
        });
        toast.success(
          `${formatNaira(parsed)} recorded`,
          `${fund?.name ?? "Your fund"} balance updated.`,
        );
      }
      router.replace(`/funds/${fundId}`);
    } catch {
      setFormError(
        isEdit
          ? "We couldn't save those changes. Please try again."
          : "We couldn't record that expense. Please try again.",
      );
      setSubmitting(false);
    }
  }

  // Before localStorage is read the store still holds the seed dataset, so we
  // deliberately show a placeholder rather than seed balances that would be
  // replaced a frame later — flashing the wrong money is worse than a skeleton.
  if (!hydrated) {
    return (
      <AppShell title={isEdit ? "Edit expense" : "Add expense"}>
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (isEdit && !existing) {
    return (
      <AppShell title="Expense not found" backHref="/funds">
        <Card>
          <p className="text-[15px] text-ink-600">
            This expense is no longer available. It may have been removed.
          </p>
          <ButtonLink
            href="/funds"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Back to funds
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  if (data.funds.length === 0) {
    return (
      <AppShell title="Add expense" backHref="/dashboard">
        <Card>
          <p className="text-[15px] text-ink-600">
            You need a fund before you can record an expense.
          </p>
          <ButtonLink
            href="/funds/new"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Create a fund
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={isEdit ? "Edit expense" : "Add expense"}
      backHref={isEdit && existing ? `/funds/${existing.fundId}` : "/dashboard"}
    >
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-lg">
        <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
          {isEdit
            ? "Change any detail. The previous values stay in the expense's history."
            : "Record what was spent and the balance updates straight away."}
        </p>

        <Card padding="lg">
          {formError ? (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3 text-[14px] font-medium text-danger-700"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            {!isEdit ? (
              <Select
                label="Which fund?"
                value={fundId}
                onChange={(event) => {
                  setFundId(event.target.value);
                  setFormError(null);
                }}
                options={data.funds.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
                required
              />
            ) : null}

            <Input
              label="What was it for?"
              value={values.description}
              onChange={(event) => set("description")(event.target.value)}
              error={errors.description}
              placeholder="e.g. Rice and vegetables"
              maxLength={80}
              required
              data-autofocus
            />

            <AmountInput
              label="Amount spent"
              value={values.amount}
              onChange={set("amount")}
              error={errors.amount}
              placeholder="5,000"
            />

            <CategoryPicker
              value={values.category}
              onChange={(category) => {
                setValues((current) => ({ ...current, category }));
                setErrors((current) => ({ ...current, category: undefined }));
              }}
              error={errors.category}
            />

            <Input
              label="Date"
              type="date"
              value={values.date}
              onChange={(event) => set("date")(event.target.value)}
              error={errors.date}
              max={todayISO()}
              leadingIcon={<Calendar className="size-4" />}
              required
            />

            <Textarea
              label="Note"
              labelSuffix={<OptionalTag />}
              value={values.note}
              onChange={(event) => set("note")(event.target.value)}
              error={errors.note}
              placeholder="Anything worth remembering."
              rows={3}
              maxLength={160}
            />

            {/* Live impact on the fund balance. */}
            {projected !== null && totals ? (
              <div className="rounded-xl bg-cream-100 px-3.5 py-3">
                <p className="text-[13px] font-semibold text-ink-600">
                  {isEdit ? "Balance after saving" : "Balance after this"}
                </p>
                <p className="tabular mt-0.5 text-[19px] font-extrabold text-ink-900">
                  {formatNaira(projected)}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-500">
                  {projected < 0
                    ? "This would be more than the fund holds."
                    : `From ${formatNaira(totals.remaining)} currently.`}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  isEdit && existing ? `/funds/${existing.fundId}` : "/dashboard",
                )
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              loadingText={isEdit ? "Saving…" : "Recording…"}
            >
              {isEdit ? "Save changes" : "Record expense"}
            </Button>
          </div>
        </Card>
      </form>
    </AppShell>
  );
}

function OptionalTag() {
  return (
    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
      Optional
    </span>
  );
}