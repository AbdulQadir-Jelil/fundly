import { clampPercent } from "@/lib/currency";
import { categoryMeta, categoryLabel } from "@/lib/categories";
import { formatFriendlyDate, formatRelativeLabel } from "@/lib/date";
import type {
  ActivityItem,
  AppData,
  CategoryBreakdown,
  Expense,
  ExpenseCategory,
  Fund,
  FundTotals,
  MoneyInTransaction,
  MoneySource,
  ShareReportData,
} from "@/types";

/* -------------------------------------------------------------------------- */
/*  Core totals — the single place money is calculated                         */
/* -------------------------------------------------------------------------- */

/**
 * Derives a fund's financial position from its transaction + expense
 * records. Nothing is stored pre-summed, so the numbers can never drift.
 */
export function getFundTotals(
  fund: Fund,
  transactions: MoneyInTransaction[],
  expenses: Expense[],
): FundTotals {
  const received = transactions
    .filter((t) => t.fundId === fund.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const fundExpenses = expenses.filter((e) => e.fundId === fund.id);
  const spent = fundExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = received - spent;

  const spentPercent =
    received > 0 ? clampPercent((spent / received) * 100) : spent > 0 ? 100 : 0;

  return {
    received,
    spent,
    remaining,
    spentPercent,
    expenseCount: fundExpenses.length,
    transactionCount: transactions.filter((t) => t.fundId === fund.id).length,
  };
}

/** Totals across every fund — powers the dashboard balance card. */
export function getHouseholdTotals(data: AppData): FundTotals {
  const received = data.transactions.reduce((sum, t) => sum + t.amount, 0);
  const spent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    received,
    spent,
    remaining: received - spent,
    spentPercent:
      received > 0 ? clampPercent((spent / received) * 100) : spent > 0 ? 100 : 0,
    expenseCount: data.expenses.length,
    transactionCount: data.transactions.length,
  };
}

/** Spending split by category, largest first. */
export function getCategoryBreakdown(
  expenses: Expense[],
): CategoryBreakdown[] {
  if (expenses.length === 0) return [];

  const totals = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const expense of expenses) {
    const current = totals.get(expense.category) ?? { amount: 0, count: 0 };
    current.amount += expense.amount;
    current.count += 1;
    totals.set(expense.category, current);
  }

  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return [...totals.entries()]
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      count,
      percent:
        grandTotal > 0 ? clampPercent((amount / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/* -------------------------------------------------------------------------- */
/*  Fund lookups                                                              */
/* -------------------------------------------------------------------------- */

export function getFundById(data: AppData, fundId: string): Fund | undefined {
  return data.funds.find((f) => f.id === fundId);
}

export function getFundExpenses(
  data: AppData,
  fundId: string,
): Expense[] {
  return data.expenses
    .filter((e) => e.fundId === fundId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFundTransactions(
  data: AppData,
  fundId: string,
): MoneyInTransaction[] {
  return data.transactions
    .filter((t) => t.fundId === fundId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getExpenseById(
  data: AppData,
  expenseId: string,
): Expense | undefined {
  return data.expenses.find((e) => e.id === expenseId);
}

/** Most recently touched fund, used for the dashboard's recent activity. */
export function getLatestUpdatedAt(
  fund: Fund,
  transactions: MoneyInTransaction[],
  expenses: Expense[],
): string {
  const candidates = [
    fund.updatedAt,
    fund.createdAt,
    ...transactions.filter((t) => t.fundId === fund.id).map((t) => t.createdAt),
    ...expenses.filter((e) => e.fundId === fund.id).map((e) => e.updatedAt),
  ];
  return candidates.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
  );
}

/* -------------------------------------------------------------------------- */
/*  Activity feed — the unified chronological timeline                         */
/* -------------------------------------------------------------------------- */

/**
 * Merges money-in records and expenses into a single, scannable timeline.
 *
 * Deleted expenses still appear (marked "Removed") so the history stays
 * transparent, exactly as the product promises.
 */
export function getFundActivity(
  data: AppData,
  fundId: string,
): ActivityItem[] {
  const fund = getFundById(data, fundId);
  if (!fund) return [];

  const items: ActivityItem[] = [];

  for (const tx of data.transactions) {
    if (tx.fundId !== fundId) continue;
    items.push({
      id: tx.id,
      fundId,
      type: tx.kind === "fund" ? "fund-created" : "money-in",
      title:
        tx.kind === "fund" ? "Fund created" : `${fund.name} was topped up`,
      subtitle: moneyInSubtitle(tx),
      amount: tx.amount,
      date: tx.createdAt,
    });
  }

  for (const expense of data.expenses) {
    if (expense.fundId !== fundId) continue;
    items.push({
      id: expense.id,
      fundId,
      type: expense.revisions.length > 0 ? "expense-edited" : "expense",
      title: expense.description,
      subtitle: categoryLabel(expense.category),
      amount: -expense.amount,
      date: expense.createdAt,
      badge: expense.revisions.length > 0 ? "Edited" : undefined,
    });
  }

  return items.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function moneyInSubtitle(tx: MoneyInTransaction): string {
  const labels: Record<MoneySource, string> = {
    me: "From me",
    "someone-else": tx.sourceLabel
      ? `From ${tx.sourceLabel}`
      : "From someone else",
    household: "Household",
    other: tx.sourceLabel ? `From ${tx.sourceLabel}` : "Other",
  };
  return labels[tx.source];
}

/** Household-wide recent activity for the dashboard. */
export function getRecentActivity(data: AppData, limit = 6): ActivityItem[] {
  const all = data.funds.flatMap((fund) => getFundActivity(data, fund.id));
  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*  Report payload + share text                                               */
/* -------------------------------------------------------------------------- */

export function getShareReportData(
  data: AppData,
  fundId: string,
): ShareReportData | null {
  const fund = getFundById(data, fundId);
  if (!fund) return null;

  const totals = getFundTotals(fund, data.transactions, data.expenses);
  const expenses = getFundExpenses(data, fundId);

  return {
    fundName: fund.name,
    received: totals.received,
    spent: totals.spent,
    remaining: totals.remaining,
    expenseCount: totals.expenseCount,
    categories: getCategoryBreakdown(expenses),
    updatedLabel: formatRelativeLabel(
      getLatestUpdatedAt(fund, data.transactions, data.expenses),
    ),
  };
}

/**
 * Compact, WhatsApp-friendly summary. Deliberately short — long messages
 * get ignored in family chats.
 */
export function buildShareText(report: ShareReportData): string {
  const expenseLine =
    report.expenseCount === 1
      ? "1 expense recorded."
      : `${report.expenseCount} expenses recorded.`;

  return [
    "Fundly",
    report.fundName,
    "",
    `Received: ₦${report.received.toLocaleString("en-NG")}`,
    `Spent: ₦${report.spent.toLocaleString("en-NG")}`,
    `Remaining: ₦${report.remaining.toLocaleString("en-NG")}`,
    "",
    `${expenseLine}`,
    `Updated ${report.updatedLabel.toLowerCase()}.`,
    "",
    "Fundly · Household spending made clear",
  ].join("\n");
}

/** Card metadata for a fund (icon + tints), chosen from the purpose text. */
export function fundAccentFor(fund: Fund): {
  icon: ReturnType<typeof categoryMeta>["icon"];
  chip: string;
} {
  const purpose = fund.purpose.toLowerCase();
  const name = fund.name.toLowerCase();

  if (/grocery|food|market|meal|kitchen/.test(purpose + name)) {
    return { icon: categoryMeta("food").icon, chip: "bg-peach-100 text-peach-700" };
  }
  if (/school|fee|education|tuition|pupil|student/.test(purpose + name)) {
    return {
      icon: categoryMeta("school").icon,
      chip: "bg-forest-100 text-forest-700",
    };
  }
  if (/transport|travel|fuel|car|bus/.test(purpose + name)) {
    return { icon: categoryMeta("transport").icon, chip: "bg-butter-100 text-butter-500" };
  }
  if (/health|medic|hospital|pharmac/.test(purpose + name)) {
    return { icon: categoryMeta("health").icon, chip: "bg-sage-100 text-sage-700" };
  }
  if (/bill|utilit|water|electric|light|data|airtime/.test(purpose + name)) {
    return { icon: categoryMeta("bills").icon, chip: "bg-ink-100 text-ink-600" };
  }
  if (/rent|house|home|repair|furnish/.test(purpose + name)) {
    return { icon: categoryMeta("household").icon, chip: "bg-forest-100 text-forest-700" };
  }
  return { icon: categoryMeta("other").icon, chip: "bg-sage-100 text-sage-700" };
}

/** `"Edited today"` label for a revision timestamp. */
export function formatEditedLabel(at: string): string {
  return `Edited ${formatFriendlyDate(at).toLowerCase()}`;
}