"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Copy, Share2, ShieldCheck } from "lucide-react";
import { categoryLabel, categoryMeta } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import {
  buildShareText,
  getCategoryBreakdown,
  getFundExpenses,
  getFundTotals,
} from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import { BalanceHero } from "@/components/domain/FundViews";
import {
  Button,
  Card,
  EmptyState,
  FilterChip,
  ProgressBar,
  Select,
  Skeleton,
  progressToneForPercent,
  useToast,
} from "@/components/ui";
import type { ShareReportData } from "@/types";

export function ReportsScreen() {
  const searchParams = useSearchParams();
  const { data, hydrated } = useFundly();
  const toast = useToast();

  const [fundId, setFundId] = useState(searchParams.get("fund") ?? "all");
  const [shared, setShared] = useState(false);

  /** Either one fund or the whole household. */
  const scope = useMemo(() => {
    if (fundId === "all") {
      const received = data.transactions.reduce((sum, t) => sum + t.amount, 0);
      const spent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        name: "Your household",
        received,
        spent,
        remaining: received - spent,
        spentPercent:
          received > 0 ? Math.min(100, (spent / received) * 100) : 0,
        expenseCount: data.expenses.length,
        expenses: data.expenses,
      };
    }

    const fund = data.funds.find((item) => item.id === fundId);
    if (!fund) return null;
    const totals = getFundTotals(fund, data.transactions, data.expenses);
    return {
      name: fund.name,
      received: totals.received,
      spent: totals.spent,
      remaining: totals.remaining,
      spentPercent: totals.spentPercent,
      expenseCount: totals.expenseCount,
      expenses: getFundExpenses(data, fund.id),
    };
  }, [data, fundId]);

  const categories = useMemo(
    () => (scope ? getCategoryBreakdown(scope.expenses) : []),
    [scope],
  );

  const report: ShareReportData | null = scope
    ? {
        fundName: scope.name,
        received: scope.received,
        spent: scope.spent,
        remaining: scope.remaining,
        expenseCount: scope.expenseCount,
        categories,
        updatedLabel: "recently",
      }
    : null;

  const shareText = report ? buildShareText(report) : "";

  function flashShared() {
    setShared(true);
    window.setTimeout(() => setShared(false), 2500);
  }

  async function handleShare() {
    if (!shareText) return;

    // Prefer the native share sheet — it is how people actually message a
    // family group.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: report?.fundName, text: shareText });
        flashShared();
        return;
      } catch {
        // Dismissed or unavailable — fall through to the clipboard so the
        // button never dead-ends.
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Report copied", "Paste it into your family chat.");
      flashShared();
    } catch {
      toast.error("Couldn't share", "Copy the summary manually instead.");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy", "Select the text and copy it manually.");
    }
  }

  // Only ever render figures once the store has read localStorage. Before that
  // the store still holds the seed dataset, and briefly showing seed balances
  // that are about to be replaced would be worse than a skeleton.
  if (!hydrated) {
    return (
      <AppShell title="Reports">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!scope || !report) {
    return (
      <AppShell title="Reports">
        <Card>
          <EmptyState
            icon={<Share2 className="size-8" />}
            title="No funds to report on yet"
            description="Create a fund and record a few expenses — then you can share a clear summary with your household."
            compact
          />
        </Card>
      </AppShell>
    );
  }
  return (
    <AppShell title="Reports">
      <div className="flex flex-col gap-5">
        <Select
          label="Report for"
          value={fundId}
          onChange={(event) => setFundId(event.target.value)}
          options={[
            { value: "all", label: "All funds (household)" },
            ...data.funds.map((fund) => ({
              value: fund.id,
              label: fund.name,
            })),
          ]}
        />

        <BalanceHero
          fundName={scope.name}
          received={scope.received}
          spent={scope.spent}
          remaining={scope.remaining}
          spentPercent={scope.spentPercent}
          expenseCount={scope.expenseCount}
        />

        {/* ---- Share --------------------------------------------- */}
        <Card>
          <h2 className="text-[16px] font-bold text-ink-900">
            Share this summary
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
            A short message you can drop straight into a family chat.
          </p>

          {/* The exact text that will be shared, shown verbatim. */}
          <pre className="tabular mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-cream-100 p-3.5 font-sans text-[13px] leading-relaxed text-ink-700">
            {shareText}
          </pre>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Button
              fullWidth
              size="lg"
              leftIcon={
                shared ? (
                  <Check className="size-5" />
                ) : (
                  <Share2 className="size-5" />
                )
              }
              onClick={handleShare}
            >
              {shared ? "Shared" : "Share summary"}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              leftIcon={<Copy className="size-4" />}
              onClick={handleCopy}
            >
              Copy
            </Button>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-500">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Nothing leaves your device until you share it.
          </p>
        </Card>

        {/* ---- Breakdown ---------------------------------------- */}
        <section>
          <h2 className="mb-2.5 text-[16px] font-bold text-ink-900">
            Where the money went
          </h2>

          <Card padding="none" className="px-4 py-1">
            {categories.length === 0 ? (
              <EmptyState
                icon={<Share2 className="size-7" />}
                title="Nothing spent yet"
                description="Record an expense and the split appears here."
                compact
              />
            ) : (
              <ul className="divide-y divide-cream-300">
                {categories.map((entry) => {
                  const Icon = categoryMeta(entry.category).icon;
                  return (
                    <li key={entry.category} className="flex items-center gap-3 py-3">
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-ink-600"
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[14px] font-semibold text-ink-800">
                            {categoryLabel(entry.category)}
                          </p>
                          <p className="tabular text-[14px] font-bold text-ink-900">
                            {formatNaira(entry.amount)}
                          </p>
                        </div>
                        <ProgressBar
                          value={entry.percent}
                          label={`${categoryLabel(entry.category)}: ${Math.round(entry.percent)}% of spending`}
                          size="sm"
                          tone={progressToneForPercent(entry.percent)}
                          className="mt-1.5"
                        />
                        <p className="tabular mt-1 text-[12px] text-ink-500">
                          {Math.round(entry.percent)}% · {entry.count}{" "}
                          {entry.count === 1 ? "expense" : "expenses"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>

        {/* Quick switch between funds. */}
        {data.funds.length > 1 ? (
          <section>
            <h2 className="mb-2.5 text-[16px] font-bold text-ink-900">
              Switch fund
            </h2>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {data.funds.map((fund) => (
                <FilterChip
                  key={fund.id}
                  label={fund.name}
                  active={fundId === fund.id}
                  onClick={() => setFundId(fund.id)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}