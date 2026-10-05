"use client";

import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { CATEGORY_LIST } from "@/lib/categories";
import { getRecentActivity } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import { ActivityList } from "@/components/domain/FundViews";
import {
  Card,
  EmptyState,
  FilterChip,
  Select,
  Segmented,
} from "@/components/ui";
import type { ActivityType, ExpenseCategory } from "@/types";

type Range = "all" | "7d" | "30d";

const RANGE_OPTIONS: Array<{ value: Range; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function withinRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const days = range === "7d" ? 7 : 30;
  const diff = Date.now() - new Date(iso).getTime();
  return diff <= days * 86_400_000;
}

export default function TransactionsPage() {
  const { data } = useFundly();

  const [range, setRange] = useState<Range>("30d");
  const [fundId, setFundId] = useState("all");
  const [type, setType] = useState<ActivityType | "all">("all");
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");

  const all = useMemo(() => getRecentActivity(data, 500), [data]);

  const filtered = useMemo(
    () =>
      all.filter((item) => {
        if (!withinRange(item.date, range)) return false;
        if (fundId !== "all" && item.fundId !== fundId) return false;
        if (type !== "all" && item.type !== type) return false;

        // Category only applies to expense-ish activity, which is matched by
        // the underlying expense's category via the id prefix we keep stable.
        if (category !== "all") {
          if (item.type !== "expense" && item.type !== "expense-edited") {
            return false;
          }
          const expense = data.expenses.find((entry) => entry.id === item.id);
          if (expense?.category !== category) return false;
        }

        return true;
      }),
    [all, category, data.expenses, fundId, range, type],
  );

  const fundNames = useMemo(
    () => new Map(data.funds.map((fund) => [fund.id, fund.name])),
    [data.funds],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<ExpenseCategory, number>();
    for (const expense of data.expenses) {
      counts.set(expense.category, (counts.get(expense.category) ?? 0) + 1);
    }
    return counts;
  }, [data.expenses]);

  return (
    <AppShell title="Activity">
      <div className="flex flex-col gap-4">
        {/* ---- Filters --------------------------------------------- */}
        <div className="flex flex-col gap-3">
          <Segmented<Range>
            label="Date range"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Select
              label="Fund"
              value={fundId}
              onChange={(event) => setFundId(event.target.value)}
              options={[
                { value: "all", label: "All funds" },
                ...data.funds.map((fund) => ({
                  value: fund.id,
                  label: fund.name,
                })),
              ]}
            />

            <Select
              label="Type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ActivityType | "all")
              }
              options={[
                { value: "all", label: "Everything" },
                { value: "money-in", label: "Money in" },
                { value: "expense", label: "Expenses" },
                { value: "expense-edited", label: "Edited" },
                { value: "fund-created", label: "Funds created" },
              ]}
            />
          </div>

          {/* Category chips scroll horizontally so they never wrap. */}
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink-700">
              Category
            </p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <FilterChip
                label="All"
                active={category === "all"}
                onClick={() => setCategory("all")}
                count={data.expenses.length}
              />
              {CATEGORY_LIST.map((meta) => {
                const Icon = meta.icon;
                return (
                  <FilterChip
                    key={meta.value}
                    label={meta.label}
                    active={category === meta.value}
                    onClick={() => setCategory(meta.value)}
                    icon={<Icon className="size-3.5" aria-hidden="true" />}
                    count={categoryCounts.get(meta.value) ?? 0}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- Results --------------------------------------------- */}
        <Card padding="none" className="px-4 py-4">
          <p className="mb-3 text-[13px] font-semibold text-ink-500">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-7" />}
              title="No activity matches"
              description="Try widening the date range or clearing a filter."
              compact
            />
          ) : (
            <ActivityList
              items={filtered}
              showFund={fundId === "all"}
              fundNames={fundNames}
            />
          )}
        </Card>
      </div>
    </AppShell>
  );
}