"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Banknote, History, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { categoryLabel, moneySourceLabel } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import {
  formatDateTime,
  formatFriendlyDate,
  formatRelativeLabel,
} from "@/lib/date";
import {
  getFundActivity,
  getFundExpenses,
  getFundTotals,
  getFundTransactions,
} from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import {
  ActivityList,
  BalanceHero,
  ExpenseList,
} from "@/components/domain/FundViews";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  Modal,
  Segmented,
  Skeleton,
  useToast,
} from "@/components/ui";
import type { ArchivedExpense, Expense } from "@/types";

type Tab = "expenses" | "money-in" | "activity" | "history";

export function FundDetail({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { data, hydrated, deleteExpense, restoreExpense } = useFundly();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("expenses");
  const [actionExpense, setActionExpense] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fund = data.funds.find((item) => item.id === fundId);
  const expenses = useMemo(
    () => (fund ? getFundExpenses(data, fund.id) : []),
    [data, fund],
  );
  const transactions = useMemo(
    () => (fund ? getFundTransactions(data, fund.id) : []),
    [data, fund],
  );
  const activity = useMemo(
    () => (fund ? getFundActivity(data, fund.id) : []),
    [data, fund],
  );
  const archived = useMemo(
    () => data.archive.filter((item) => item.fundId === fundId),
    [data.archive, fundId],
  );

  if (!hydrated) {
    return (
      <AppShell title="Fund">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="mt-5 h-64 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!fund) {
    return (
      <AppShell title="Fund not found" backHref="/funds">
        <Card>
          <p className="text-[15px] text-ink-600">
            This fund is no longer available. It may have been removed.
          </p>
          <ButtonLink href="/funds" variant="primary" size="md" className="mt-4">
            Back to funds
          </ButtonLink>
        </Card>
      </AppShell>
    );
  }

  const totals = getFundTotals(fund, data.transactions, data.expenses);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await deleteExpense(target.id);
      toast.showToast({
        tone: "success",
        title: "Expense removed",
        message: "It stays in the history so the record is never lost.",
        action: {
          label: "Undo",
          onClick: () => {
            void restoreExpense(target.id);
            toast.info("Expense restored");
          },
        },
      });
      setPendingDelete(null);
    } catch {
      toast.error("Couldn't remove that expense");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title={fund.name} backHref="/funds">
      <div className="flex flex-col gap-5">
        {/* ---- Balance --------------------------------------------- */}
        <BalanceHero
          fundName={fund.name}
          received={totals.received}
          spent={totals.spent}
          remaining={totals.remaining}
          spentPercent={totals.spentPercent}
          expenseCount={totals.expenseCount}
          sourceLabel={`From ${moneySourceLabel(fund.source)}`}
        />

        {/* ---- Meta ------------------------------------------------ */}
        <Card padding="md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-500">Purpose</p>
              <p className="mt-0.5 text-[15px] font-bold text-ink-900">
                {fund.purpose}
              </p>
              {fund.note ? (
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">
                  {fund.note}
                </p>
              ) : null}
            </div>
            <Badge tone="neutral">
              Updated {formatRelativeLabel(fund.updatedAt).toLowerCase()}
            </Badge>
          </div>
        </Card>

        {/* ---- Primary actions ------------------------------------- */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <ButtonLink
            href={`/expenses/new?fund=${fund.id}`}
            variant="primary"
            size="lg"
            leftIcon={<Plus className="size-5" />}
          >
            Add expense
          </ButtonLink>
          <ButtonLink
            href={`/funds/${fund.id}/add-money`}
            variant="secondary"
            size="lg"
            leftIcon={<Banknote className="size-5" />}
          >
            Add money
          </ButtonLink>
          <ButtonLink
            href={`/reports?fund=${fund.id}`}
            variant="secondary"
            size="lg"
            leftIcon={<Share2 className="size-5" />}
            className="col-span-2 sm:col-span-1"
          >
            Share report
          </ButtonLink>
        </div>

        {/* ---- Tabs ------------------------------------------------ */}
        <div>
          <Segmented<Tab>
            label="Fund sections"
            value={tab}
            onChange={setTab}
            options={[
              { value: "expenses", label: "Expenses", count: expenses.length },
              {
                value: "money-in",
                label: "Money in",
                count: transactions.length,
              },
              { value: "activity", label: "Activity" },
              { value: "history", label: "History", count: archived.length },
            ]}
          />

          <div className="mt-4">
            {tab === "expenses" ? (
              <Card padding="none" className="px-4 py-2">
                <ExpenseList expenses={expenses} onEdit={setActionExpense} />
              </Card>
            ) : null}

            {tab === "money-in" ? (
              <Card padding="none" className="px-4 py-2">
                {transactions.length === 0 ? (
                  <p className="py-6 text-center text-[14px] text-ink-500">
                    No money has been added to this fund yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-cream-300">
                    {transactions.map((transaction) => (
                      <li key={transaction.id} className="flex items-center gap-3 py-3">
                        <span
                          aria-hidden="true"
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700"
                        >
                          <Banknote className="size-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-ink-900">
                            {transaction.kind === "fund"
                              ? "Starting amount"
                              : (transaction.note ?? "Money added")}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-ink-500">
                            {transaction.sourceLabel ??
                              moneySourceLabel(transaction.source)}
                            {" · "}
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <p className="tabular shrink-0 text-[15px] font-bold text-sage-600">
                          +{formatNaira(transaction.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ) : null}

            {tab === "activity" ? (
              <Card padding="none" className="px-4 py-4">
                <ActivityList items={activity} />
              </Card>
            ) : null}

            {tab === "history" ? (
              <Card padding="none" className="px-4 py-2">
                <ArchivedList archived={archived} />
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove this expense?"
        message={`"${pendingDelete?.description ?? ""}" will be taken out of the balance. It stays in the fund's history so nothing is hidden.`}
        confirmLabel="Remove expense"
        icon={<Trash2 className="size-5" />}
      />

      {/* Expense action sheet — edit or remove from one place. */}
      <Modal
        open={actionExpense !== null}
        onClose={() => setActionExpense(null)}
        title={actionExpense?.description ?? "Expense"}
        description={
          actionExpense
            ? `${categoryLabel(actionExpense.category)} · ${formatFriendlyDate(actionExpense.createdAt)}`
            : undefined
        }
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Pencil className="size-4" />}
              onClick={() => {
                const id = actionExpense?.id;
                setActionExpense(null);
                if (id) router.push(`/expenses/${id}/edit`);
              }}
            >
              Edit expense
            </Button>
            <Button
              variant="danger"
              fullWidth
              leftIcon={<Trash2 className="size-4" />}
              onClick={() => {
                setPendingDelete(actionExpense);
                setActionExpense(null);
              }}
            >
              Remove
            </Button>
          </div>
        }
      >
        {actionExpense ? <ExpenseSheetBody expense={actionExpense} /> : null}
      </Modal>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

function ExpenseSheetBody({ expense }: { expense: Expense }) {
  const rows: Array<[string, string]> = [
    ["Amount", formatNaira(expense.amount)],
    ["Category", categoryLabel(expense.category)],
    ["Recorded", formatDateTime(expense.createdAt)],
  ];

  if (expense.updatedAt !== expense.createdAt) {
    rows.push(["Last updated", formatDateTime(expense.updatedAt)]);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="tabular text-[30px] font-extrabold leading-none text-peach-700">
        −{formatNaira(expense.amount)}
      </p>

      <dl className="divide-y divide-cream-300">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 py-2.5">
            <dt className="text-[14px] text-ink-500">{label}</dt>
            <dd className="text-[14px] font-semibold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      {expense.note ? (
        <div>
          <p className="text-[13px] font-semibold text-ink-500">Note</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
            {expense.note}
          </p>
        </div>
      ) : null}

      {/* Revision trail — the reason edits are never destructive. */}
      {expense.revisions.length > 0 ? (
        <div className="rounded-xl bg-cream-100 p-3.5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-700">
            <History className="size-3.5" aria-hidden="true" />
            Edit history
          </p>
          <ul className="mt-2 space-y-1.5">
            {expense.revisions
              .slice()
              .reverse()
              .map((revision) => (
                <li
                  key={revision.at}
                  className="text-[13px] leading-relaxed text-ink-600"
                >
                  {revision.summary} ·{" "}
                  {formatRelativeLabel(revision.at).toLowerCase()}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ArchivedList({ archived }: { archived: ArchivedExpense[] }) {
  if (archived.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600"
        >
          <History className="size-5" />
        </span>
        <p className="text-[15px] font-bold text-ink-900">Nothing removed</p>
        <p className="max-w-xs text-[13px] leading-relaxed text-ink-500">
          Removed expenses are kept here so the record stays complete.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-cream-300">
      {archived.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500"
          >
            <Trash2 className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink-500 line-through">
              {item.description}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-ink-500">
              {categoryLabel(item.category)} · removed{" "}
              {formatRelativeLabel(item.deletedAt).toLowerCase()}
            </p>
          </div>
          <p className="tabular shrink-0 text-[14px] font-semibold text-ink-400 line-through">
            {formatNaira(item.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}