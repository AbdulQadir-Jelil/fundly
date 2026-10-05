"use client";

import { Wallet } from "lucide-react";
import { useMemo } from "react";
import { formatNaira } from "@/lib/currency";
import { getHouseholdTotals } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import { FundCard } from "@/components/domain/FundViews";
import {
  ButtonLink,
  Card,
  EmptyState,
  Skeleton,
} from "@/components/ui";

export default function FundsPage() {
  const { data, hydrated } = useFundly();
  const totals = useMemo(() => getHouseholdTotals(data), [data]);

  return (
    <AppShell title="Funds">
      {!hydrated ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : data.funds.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="size-8" />}
            title="No funds yet"
            description="A fund is any pot of money you want to keep an eye on — school fees, groceries, repairs."
            action={
              <ButtonLink
                href="/funds/new"
                variant="primary"
                size="lg"
                leftIcon={<Wallet className="size-5" />}
              >
                Create a fund
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Household-wide position, so the list has a frame. */}
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-ink-500">
                Total received
              </p>
              <p className="tabular mt-0.5 text-[22px] font-extrabold text-ink-900">
                {formatNaira(totals.received)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-ink-500">
                {data.funds.length} {data.funds.length === 1 ? "fund" : "funds"}
              </p>
              <p className="tabular mt-0.5 text-[15px] font-bold text-forest-700">
                {formatNaira(totals.remaining)} left
              </p>
            </div>
          </Card>

          <ul className="stagger flex flex-col gap-2.5">
            {data.funds.map((fund) => (
              <li key={fund.id}>
                <FundCard fund={fund} data={data} />
              </li>
            ))}
          </ul>

          <ButtonLink
            href="/funds/new"
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<Wallet className="size-5" />}
            className="border-dashed"
          >
            Create another fund
          </ButtonLink>
        </div>
      )}
    </AppShell>
  );
}