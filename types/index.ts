/**
 * Fundly domain model.
 *
 * Money is stored as a whole number of Naira (NGN). Kobo are not tracked:
 * household tracking does not need them and whole numbers keep the UI calm.
 * All derived figures (spent, remaining, percentages, category splits) are
 * computed from these records by selectors in `lib/selectors.ts` so that a
 * number is never stored in two places.
 */

/* -------------------------------------------------------------------------- */
/*  Shared primitives                                                         */
/* -------------------------------------------------------------------------- */

/** ISO-8601 date-time string. */
export type ISODate = string;

export type ID = string;

/* -------------------------------------------------------------------------- */
/*  User & household                                                          */
/* -------------------------------------------------------------------------- */

export type HouseholdRole = "owner" | "member";

export interface HouseholdMember {
  id: ID;
  name: string;
  /** Neutral relationship label, e.g. "Partner", "Roommate", "Daughter". */
  relationship?: string;
  email?: string;
  phone?: string;
  role: HouseholdRole;
  joinedAt: ISODate;
}

export interface Household {
  id: ID;
  name: string;
  memberIds: ID[];
  createdAt: ISODate;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone?: string;
  /** Avatar tint seed — we render initials, never remote images. */
  avatarColor: string;
  householdId: ID;
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/*  Funds                                                                     */
/* -------------------------------------------------------------------------- */

/** Where money for a fund came from. Neutral wording by design. */
export type MoneySource = "me" | "someone-else" | "household" | "other";

export interface MoneySourceMeta {
  value: MoneySource;
  label: string;
  /** Short helper shown under the radio group. */
  hint: string;
}

export interface Fund {
  id: ID;
  name: string;
  /** Free-text purpose, e.g. "Groceries". */
  purpose: string;
  note?: string;
  source: MoneySource;
  createdAt: ISODate;
  updatedAt: ISODate;
  createdBy: ID;
}

/* -------------------------------------------------------------------------- */
/*  Transactions (money in) & expenses (money out)                            */
/* -------------------------------------------------------------------------- */

/**
 * A "money in" record. `type: "fund"` is the original contribution that came
 * with fund creation; `type: "topup"` is money added later.
 */
export type MoneyInKind = "fund" | "topup";

export interface MoneyInTransaction {
  id: ID;
  fundId: ID;
  kind: MoneyInKind;
  amount: number;
  source: MoneySource;
  /** Source person when `source` is "someone-else" or "other". */
  sourceLabel?: string;
  note?: string;
  createdAt: ISODate;
  createdBy: ID;
}

export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "household",
  "bills",
  "school",
  "health",
  "shopping",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Snapshot of an expense before it was edited. Never overwritten. */
export interface ExpenseRevision {
  /** ISO date the revision was captured. */
  at: ISODate;
  byUserId: ID;
  amount: number;
  description: string;
  category: ExpenseCategory;
  note?: string;
  /** Short human summary, e.g. "₦12,000 → ₦13,000". */
  summary: string;
}

export interface Expense {
  id: ID;
  fundId: ID;
  description: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  /** Receipt image as a data URL (small, stored locally). */
  receipt?: string;
  receiptName?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  createdBy: ID;
  /** True once the expense has been edited at least once. */
  edited: boolean;
  /** Append-only edit trail. Length > 0 means `edited` is true. */
  revisions: ExpenseRevision[];
}

/**
 * A deleted expense. Fundly never erases history — when an expense is
 * removed it moves here, so the transaction log can still show that it
 * existed and when it was removed.
 */
export interface ArchivedExpense {
  id: ID;
  fundId: ID;
  description: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  /** When the expense was originally created. */
  createdAt: ISODate;
  /** When it was deleted. */
  deletedAt: ISODate;
  revisions: ExpenseRevision[];
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */

export type NotificationKind =
  | "expense-added"
  | "money-added"
  | "fund-updated"
  | "fund-created"
  | "expense-edited"
  | "expense-deleted"
  | "balance"
  | "member-joined";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  message: string;
  /** Denormalised for fast list rendering. */
  fundId?: ID;
  amount?: number;
  createdAt: ISODate;
  read: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Preferences                                                               */
/* -------------------------------------------------------------------------- */

export interface Preferences {
  notificationsEnabled: boolean;
  expenseReminders: boolean;
  moneyAddedAlerts: boolean;
  weeklySummary: boolean;
  /** Privacy choices. */
  shareReportsByLink: boolean;
  showProfilePhoto: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Persisted shape                                                           */
/* -------------------------------------------------------------------------- */

export interface AppData {
  version: number;
  user: User | null;
  household: Household | null;
  users: User[];
  members: HouseholdMember[];
  funds: Fund[];
  transactions: MoneyInTransaction[];
  expenses: Expense[];
  /** Deleted expenses, retained so history stays transparent. */
  archive: ArchivedExpense[];
  notifications: AppNotification[];
  preferences: Preferences;
}

/* -------------------------------------------------------------------------- */
/*  Derived view models (never persisted)                                     */
/* -------------------------------------------------------------------------- */

export interface FundTotals {
  /** Sum of all money-in records. */
  received: number;
  /** Sum of all current expenses. */
  spent: number;
  /** received − spent. Can go negative; the UI handles that. */
  remaining: number;
  /** 0–100, spent as a share of received. Clamped. */
  spentPercent: number;
  expenseCount: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  /** 0–100 share of total spending. */
  percent: number;
  count: number;
}

export type ActivityType =
  | "money-in"
  | "expense"
  | "expense-edited"
  | "expense-deleted"
  | "fund-created"
  | "fund-updated";

export interface ActivityItem {
  id: ID;
  fundId: ID;
  type: ActivityType;
  title: string;
  subtitle?: string;
  /** Signed: positive for money in, negative for money out. */
  amount?: number;
  date: ISODate;
  /** Badge shown when an item was changed after creation. */
  badge?: string;
}

export interface ShareReportData {
  fundName: string;
  received: number;
  spent: number;
  remaining: number;
  expenseCount: number;
  categories: CategoryBreakdown[];
  updatedLabel: string;
}