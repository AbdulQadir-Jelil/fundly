"use client";

import Link from "next/link";
import { ArrowRight, Plus, Share2, Wallet } from "lucide-react";
import { useMemo } from "react";
import { formatNaira } from "@/lib/currency";
import { categoryLabel } from "@/lib/categories";
import { firstName, greetingFor } from "@/lib/date";
import {
  getCategoryBreakdown,
  getHouseholdTotals,
  getRecentActivity,
} from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import {
  ActivityList,
  BalanceHero,
  FundCard,
} from "@/components/domain/FundViews";
import {
  ButtonLink,
  Card,
  EmptyState,
  ProgressBar,
  Skeleton,
  progressToneForPercent,
} from "@/components/ui";

export default function DashboardPage() {
  const { data, hydrated } = useFundly();

  const totals = useMemo(() => getHouseholdTotals(data), [data]);
  const activity = useMemo(() => getRecentActivity(data, 6), [data]);
  const categories = useMemo(
    () => getCategoryBreakdown(data.expenses).slice(0, 4),
    [data.expenses],
  );
  const fundNames = useMemo(
    () => new Map(data.funds.map((fund) => [fund.id, fund.name])),
    [data.funds],
  );

  const hasFunds = data.funds.length > 0;

  return (
    <AppShell title="Home">
      {/* Greeting — desktop only; the top bar carries the page title. */}
      <p className="mb-4 hidden text-[15px] font-medium text-ink-600 lg:block">
        {greetingFor()}, {firstName(data.user?.name ?? "there")}
      </p>

      {!hydrated ? (
        <DashboardSkeleton />
      ) : !hasFunds ? (
        <FirstRunEmpty />
      ) : (
        <div className="stagger flex flex-col gap-5">
          {/* ---- Balance ------------------------------------------- */}
          <BalanceHero
            fundName={
              totals.remaining < 0
                ? "You've spent more than was received"
                : "Available across your funds"
            }
            received={totals.received}
            spent={totals.spent}
            remaining={totals.remaining}
            spentPercent={totals.spentPercent}
            expenseCount={totals.expenseCount}
          />

          {/* ---- Quick actions ------------------------------------ */}
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink
              href="/expenses/new"
              variant="primary"
              size="lg"
              leftIcon={<Plus className="size-5" />}
            >
              Add expense
            </ButtonLink>
            <ButtonLink
              href="/funds/new"
              variant="secondary"
              size="lg"
              leftIcon={<Wallet className="size-5" />}
            >
              New fund
            </ButtonLink>
          </div>

          {/* ---- Funds -------------------------------------------- */}
          <section>
            <SectionHeader title="Your funds" href="/funds" linkLabel="See all" />

            <ul className="flex flex-col gap-2.5">
              {data.funds.slice(0, 3).map((fund) => (
                <li key={fund.id}>
                  <FundCard fund={fund} data={data} />
                </li>
              ))}
            </ul>
          </section>

          {/* ---- Split + activity -------------------------------- */}
          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <SectionHeader title="Where money went" href="/reports" />

              <Card padding="none" className="px-4 py-1">
                {categories.length === 0 ? (
                  <EmptyState
                    icon={<Wallet className="size-7" />}
                    title="Nothing spent yet"
                    description="Once you record an expense, the split shows up here."
                    compact
                  />
                ) : (
                  <ul className="divide-y divide-cream-300">
                    {categories.map((entry) => (
                      <li key={entry.category} className="py-3">
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
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section>
              <SectionHeader title="Recent activity" href="/transactions" />

              <Card padding="none" className="px-4 py-4">
                <ActivityList items={activity} showFund fundNames={fundNames} />
              </Card>
            </section>
          </div>

          {/* ---- Share nudge ------------------------------------- */}
          <Card
            tone="forest"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-[16px] font-bold">
                Share a summary with your household
              </h2>
              <p className="mt-1 text-[14px] text-forest-100">
                Send the totals straight to the family chat.
              </p>
            </div>
            <ButtonLink
              href="/reports"
              variant="secondary"
              size="md"
              leftIcon={<Share2 className="size-4" />}
              className="shrink-0"
            >
              Share report
            </ButtonLink>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="text-[16px] font-bold text-ink-900">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-forest-700 hover:text-forest-800"
        >
          {linkLabel ?? "See all"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function FirstRunEmpty() {
  return (
    <Card>
      <EmptyState
        icon={<Wallet className="size-8" />}
        title="Welcome to Fundly"
        description="Create your first fund to start tracking money in and every expense out. It takes less than a minute."
        action={
          <ButtonLink
            href="/funds/new"
            variant="primary"
            size="lg"
            leftIcon={<Wallet className="size-5" />}
          >
            Create your first fund
          </ButtonLink>
        }
      />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[52px] w-full rounded-xl" />
        <Skeleton className="h-[52px] w-full rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}