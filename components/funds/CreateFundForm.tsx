"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Calendar } from "lucide-react";
import { MONEY_SOURCES } from "@/lib/categories";
import { parseAmount } from "@/lib/currency";
import { todayISO } from "@/lib/date";
import { useFundly } from "@/lib/store";
import {
  hasErrors,
  validateCreateFund,
  type CreateFundValues,
  type ValidationErrors,
} from "@/lib/validations";
import { AppShell } from "@/components/navigation/AppShell";
import {
  AmountInput,
  Button,
  Card,
  Input,
  RadioGroup,
  Textarea,
  useToast,
} from "@/components/ui";

const EMPTY: CreateFundValues = {
  name: "",
  amount: "",
  purpose: "",
  date: todayISO(),
  note: "",
};

export function CreateFundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createFund } = useFundly();
  const toast = useToast();

  const [values, setValues] = useState<CreateFundValues>(EMPTY);
  const [source, setSource] = useState(MONEY_SOURCES[0]?.value ?? "me");
  const [errors, setErrors] = useState<ValidationErrors<keyof CreateFundValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (field: keyof CreateFundValues) => (value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found = validateCreateFund(values);
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
      const fund = await createFund({
        name: values.name,
        purpose: values.purpose,
        note: values.note,
        amount,
        source,
        date: values.date,
      });

      toast.success(
        `${fund.name} created`,
        "The starting amount has been recorded.",
      );

      // A fund created from an expense form returns there to be filed.
      const returnTo = searchParams.get("returnTo");
      router.replace(returnTo ?? `/funds/${fund.id}`);
    } catch {
      setFormError("We couldn't create that fund. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="New fund">
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-lg">
        <p className="mb-4 text-[15px] leading-relaxed text-ink-600">
          A fund is any pot of money you want to keep an eye on. Tell us what
          it's for and how much it started with.
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
            <Input
              label="Fund name"
              value={values.name}
              onChange={(event) => set("name")(event.target.value)}
              error={errors.name}
              placeholder="School Expenses"
              maxLength={60}
              required
              data-autofocus
            />

            <AmountInput
              label="Money received for this fund"
              value={values.amount}
              onChange={set("amount")}
              hint="The amount given at the start."
              error={errors.amount}
              placeholder="50,000"
            />

            <Input
              label="What is it for?"
              value={values.purpose}
              onChange={(event) => set("purpose")(event.target.value)}
              error={errors.purpose}
              hint="A short purpose, e.g. Groceries or School fees."
              placeholder="Groceries"
              required
            />

            <RadioGroup
              legend="Where is the money from?"
              value={source}
              onChange={setSource}
              options={MONEY_SOURCES}
              columns={2}
            />

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
              placeholder="Anything worth remembering about this fund."
              rows={3}
              maxLength={160}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} loadingText="Creating…">
              Create fund
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