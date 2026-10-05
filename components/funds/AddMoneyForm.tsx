"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Calendar } from "lucide-react";
import { MONEY_SOURCES } from "@/lib/categories";
import { formatNaira, parseAmount } from "@/lib/currency";
import { todayISO } from "@/lib/date";
import { getFundTotals } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import {
  hasErrors,
  validateAddMoney,
  type AddMoneyValues,
  type ValidationErrors,
} from "@/lib/validations";
import { AppShell } from "@/components/navigation/AppShell";
import {
  AmountInput,
  Button,
  Card,
  Input,
  RadioGroup,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";

const EMPTY: AddMoneyValues = { amount: "", date: todayISO(), note: "" };

export function AddMoneyForm({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { data, hydrated, addMoney } = useFundly();
  const toast = useToast();

  const [values, setValues] = useState<AddMoneyValues>(EMPTY);
  const [source, setSource] = useState(MONEY_SOURCES[0]?.value ?? "me");
  const [sourceLabel, setSourceLabel] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<keyof AddMoneyValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fund = data.funds.find((item) => item.id === fundId);
  const totals = fund
    ? getFundTotals(fund, data.transactions, data.expenses)
    : null;

  const set =
    (field: keyof AddMoneyValues) => (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateAddMoney(values);
    setErrors(found);
    if (hasErrors(found)) return;

    const amount = parseAmount(values.amount);
    if (amount === null) {
      setErrors({ amount: "Enter a valid amount" });
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await addMoney({
        fundId,
        amount,
        source,
        sourceLabel: sourceLabel.trim() || undefined,
        note: values.note,
        date: values.date,
      });

      toast.success(
        `${formatNaira(amount)} added`,
        `${fund?.name ?? "Your fund"} balance is up to date.`,
      );
      router.replace(`/funds/${fundId}`);
    } catch {
      setFormError("We couldn't add that money. Please try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <AppShell title="Add money">
        <Skeleton className="h-96 w-full max-w-lg rounded-2xl" />
      </AppShell>
    );
  }

  if (!fund || !totals) {
    return (
      <AppShell title="Add money" backHref="/funds">
        <Card>
          <p className="text-[15px] text-ink-600">
            We couldn't find that fund. It may have been removed.
          </p>
          <Link
            href="/funds"
            className="mt-3 inline-block text-[15px] font-semibold text-forest-700"
          >
            Back to funds
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Add money" backHref={`/funds/${fundId}`}>
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-lg">
        <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
          Adding money to{" "}
          <span className="font-semibold text-ink-900">{fund.name}</span>{" "}
          raises the balance. It currently holds{" "}
          <span className="tabular font-semibold text-forest-700">
            {formatNaira(totals.remaining)}
          </span>
          .
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
            <AmountInput
              label="Amount received"
              value={values.amount}
              onChange={set("amount")}
              placeholder="10,000"
              error={errors.amount}
              autoFocus
            />

            <RadioGroup
              legend="Who is this from?"
              value={source}
              onChange={setSource}
              options={MONEY_SOURCES}
              columns={2}
            />

            {source === "someone-else" || source === "other" ? (
              <Input
                label="Name"
                value={sourceLabel}
                onChange={(event) => {
                  setSourceLabel(event.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Aisha"
                hint="Helps everyone know where the money came from."
                maxLength={60}
              />
            ) : null}

            <Input
              label="Date received"
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
              placeholder="What this money is for, if anything."
              rows={3}
              maxLength={160}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => router.replace(`/funds/${fundId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} loadingText="Adding…">
              Add money
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