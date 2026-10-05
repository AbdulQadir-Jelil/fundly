"use client";

import Link from "next/link";
import {
  Activity,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { categoryMeta, categoryToneClasses } from "@/lib/categories";
import { fundAccentFor, getFundTotals } from "@/lib/selectors";
import { formatCompactDate } from "@/lib/date";
import type { ActivityItem, ActivityType, AppData, Expense, Fund } from "@/types";
import { cn } from "@/lib/utils";
import {
  Badge,
  EmptyState,
  IconButton,
  ProgressBar,
  progressToneForPercent,
} from "@/components/ui";

/* -------------------------------------------------------------------------- */
/*  Fund card                                                                 */
/* -------------------------------------------------------------------------- */

export function FundCard({
  fund,
  data,
  className,
}: {
  fund: Fund;
  data: AppData;
  className?: string;
}) {
  const totals = getFundTotals(fund, data.transactions, data.expenses);
  const accent = fundAccentFor(fund);
  const Icon = accent.icon;
  const overBudget = totals.remaining < 0;

  return (
    <Link
      href={`/funds/${fund.id}`}
      className={cn(
        "group flex items-center gap-3.5 rounded-2xl border border-cream-300 bg-white p-4",
        "transition-all duration-150 hover:border-forest-200 hover:shadow-lifted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accent.chip)}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-bold text-ink-900">{fund.name}</p>
          <p
            className={cn(
              "tabular shrink-0 text-[15px] font-bold",
              overBudget ? "text-danger-600" : "text-forest-800",
            )}
          >
            {formatNaira(totals.remaining)}
          </p>
        </div>

        <p className="mt-0.5 truncate text-[13px] text-ink-500">
          {fund.purpose} · {totals.expenseCount}{" "}
          {totals.expenseCount === 1 ? "expense" : "expenses"}
        </p>

        <ProgressBar
          value={totals.spentPercent}
          label={`${fund.name}: ${totals.spentPercent}% of received money spent`}
          size="sm"
          tone={overBudget ? "danger" : progressToneForPercent(totals.spentPercent)}
          className="mt-2.5"
        />
      </div>

      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Balance hero — the household-wide or single-fund position                 */
/* -------------------------------------------------------------------------- */

export function BalanceHero({
  fundName,
  received,
  spent,
  remaining,
  spentPercent,
  expenseCount,
  sourceLabel,
}: {
  fundName: string;
  received: number;
  spent: number;
  remaining: number;
  spentPercent: number;
  expenseCount: number;
  sourceLabel?: string;
}) {
  const over = remaining < 0;

  return (
    <section className="rounded-3xl bg-forest-card p-5 shadow-pop sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-forest-200">
            {fundName}
          </p>
          <p className="mt-0.5 text-[12px] text-forest-300">
            {sourceLabel ?? "Money received"}
          </p>
        </div>

        <Badge tone={over ? "danger" : "positive"} size="md">
          {over
            ? "Over budget"
            : `${Math.round(100 - spentPercent)}% left`}
        </Badge>
      </div>

      <p className="tabular mt-3 text-[36px] font-extrabold leading-none text-white sm:text-[42px]">
        {formatNaira(remaining)}
      </p>
      <p className="mt-1.5 text-[13px] text-forest-200">
        {over ? "spent beyond what was received" : "remaining to spend"}
      </p>

      <div className="mt-5">
        <ProgressBar
          value={spentPercent}
          label={`${Math.round(spentPercent)}% of received money spent`}
          size="md"
          tone={over ? "danger" : "sage"}
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Received" value={formatNaira(received)} />
        <Stat label="Spent" value={formatNaira(spent)} tone="text-peach-300" />
        <Stat label="Expenses" value={String(expenseCount)} sub="recorded" />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-forest-300">{label}</dt>
      <dd
        className={cn(
          "tabular mt-0.5 truncate text-[16px] font-bold text-white",
          tone,
        )}
      >
        {value}
        {sub ? (
          <span className="ml-1 text-[12px] font-medium text-forest-300">
            {sub}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Expense row                                                               */
/* -------------------------------------------------------------------------- */

export function ExpenseRow({
  expense,
  onEdit,
  showFund,
  fundName,
}: {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  showFund?: boolean;
  fundName?: string;
}) {
  const meta = categoryMeta(expense.category);
  const Icon = meta.icon;
  const chip = categoryToneClasses(meta.tone).chip;

  return (
    <div className="flex items-center gap-3 py-3">
      <span
        aria-hidden="true"
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", chip)}
      >
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-semibold text-ink-900">
            {expense.description}
          </p>
          {expense.revisions.length > 0 ? (
            <Badge tone="peach" dot>
              Edited
            </Badge>
          ) : null}
        </div>

        <p className="mt-0.5 truncate text-[13px] text-ink-500">
          {showFund && fundName ? `${fundName} · ` : ""}
          {meta.label} · {formatCompactDate(expense.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <p className="tabular text-[15px] font-bold text-peach-700">
          −{formatNaira(expense.amount)}
        </p>

        {onEdit ? (
          <IconButton
            label={`Edit ${expense.description}`}
            icon={<Pencil className="size-4" />}
            onClick={() => onEdit(expense)}
            variant="plain"
            size="sm"
            className="-mr-1"
          />
        ) : null}
      </div>
    </div>
  );
}

/** A divided list of expenses with an empty state. */
export function ExpenseList({
  expenses,
  empty,
  onEdit,
  fundNames,
}: {
  expenses: Expense[];
  empty?: React.ReactNode;
  onEdit?: (expense: Expense) => void;
  /** Map of fundId → name, for household-wide lists. */
  fundNames?: Map<string, string>;
}) {
  if (expenses.length === 0) {
    return (
      empty ?? (
        <EmptyState
          icon={<Receipt className="size-7" />}
          title="No expenses yet"
          description="Once money leaves this fund, record it here and the balance updates straight away."
          compact
        />
      )
    );
  }

  return (
    <ul className="divide-y divide-cream-300">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <ExpenseRow
            expense={expense}
            onEdit={onEdit}
            showFund={Boolean(fundNames)}
            fundName={fundNames?.get(expense.fundId)}
          />
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Activity timeline                                                         */
/* -------------------------------------------------------------------------- */

const activityIcons: Record<ActivityType, LucideIcon> = {
  "money-in": Plus,
  expense: Minus,
  "expense-edited": Pencil,
  "expense-deleted": Trash2,
  "fund-created": Sparkles,
  "fund-updated": Pencil,
};

const activityTones: Record<ActivityType, string> = {
  "money-in": "bg-sage-100 text-sage-700",
  expense: "bg-peach-100 text-peach-700",
  "expense-edited": "bg-peach-100 text-peach-700",
  "expense-deleted": "bg-ink-100 text-ink-500",
  "fund-created": "bg-forest-100 text-forest-700",
  "fund-updated": "bg-forest-100 text-forest-700",
};

export function ActivityList({
  items,
  showFund,
  fundNames,
}: {
  items: ActivityItem[];
  showFund?: boolean;
  fundNames?: Map<string, string>;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="size-7" />}
        title="Nothing here yet"
        description="Add money to a fund or record an expense and it will show up here."
        compact
      />
    );
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const Icon = activityIcons[item.type];
        const last = index === items.length - 1;

        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line between dots */}
            {!last ? (
              <span
                aria-hidden="true"
                className="absolute left-[19px] top-10 bottom-0 w-px bg-cream-400"
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl",
                activityTones[item.type],
              )}
            >
              <Icon className="size-[18px]" />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="min-w-0 truncate text-[15px] font-semibold text-ink-900">
                  {item.title}
                </p>

                {item.amount !== undefined ? (
                  <p
                    className={cn(
                      "tabular shrink-0 text-[14px] font-bold",
                      item.amount >= 0 ? "text-sage-600" : "text-peach-700",
                    )}
                  >
                    {item.amount >= 0 ? "+" : "−"}
                    {formatNaira(Math.abs(item.amount))}
                  </p>
                ) : null}
              </div>

              <p className="mt-0.5 truncate text-[13px] text-ink-500">
                {showFund && fundNames ? `${fundNames.get(item.fundId)} · ` : ""}
                {item.subtitle ? `${item.subtitle} · ` : ""}
                {formatCompactDate(item.date)}
              </p>

              {item.badge ? (
                <span className="mt-1.5 inline-block">
                  <Badge tone="peach" dot>
                    {item.badge}
                  </Badge>
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}