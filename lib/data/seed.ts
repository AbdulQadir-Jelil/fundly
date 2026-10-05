import { daysAgoISO, toISODate } from "@/lib/date";
import type {
  AppData,
  AppNotification,
  Expense,
  Fund,
  HouseholdMember,
  MoneyInTransaction,
  User,
} from "@/types";

/**
 * Seed data for the prototype.
 *
 * Timestamps are generated relative to "now" so the product always looks
 * alive whenever it is opened. Money figures deliberately match the product
 * copy: House Groceries ₦50,000 received / ₦27,500 spent / ₦22,500 remaining,
 * School Expenses ₦80,000 / ₦35,000 / ₦45,000.
 */

export const SEED_VERSION = 3;

/** A fixed clock offset (hours) so seeded times look hand-written, not random. */
function at(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date(daysAgoISO(daysAgo));
  d.setHours(hour, minute, 0, 0);
  return toISODate(d);
}

const users: User[] = [
  {
    id: "usr_alex",
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+234 801 234 5678",
    avatarColor: "bg-forest-700",
    householdId: "hh_johnson",
    createdAt: daysAgoISO(64),
  },
];

const members: HouseholdMember[] = [
  {
    id: "mem_alex",
    name: "Alex Johnson",
    email: "alex@example.com",
    relationship: "Owner",
    role: "owner",
    joinedAt: daysAgoISO(64),
  },
  {
    id: "mem_partner",
    name: "Partner",
    relationship: "Family member",
    role: "member",
    joinedAt: daysAgoISO(60),
  },
];

const funds: Fund[] = [
  {
    id: "fund_groceries",
    name: "House Groceries",
    purpose: "Groceries",
    note: "Weekly food shopping for the house.",
    source: "me",
    createdAt: at(4, 8, 30),
    updatedAt: at(0, 10, 24),
    createdBy: "usr_alex",
  },
  {
    id: "fund_school",
    name: "School Expenses",
    purpose: "School",
    note: "Fees, books and transport for the new term.",
    source: "household",
    createdAt: at(9, 7, 15),
    updatedAt: at(2, 16, 40),
    createdBy: "usr_alex",
  },
];

const transactions: MoneyInTransaction[] = [
  {
    id: "txn_groceries_initial",
    fundId: "fund_groceries",
    kind: "fund",
    amount: 50_000,
    source: "me",
    createdAt: at(4, 8, 30),
    createdBy: "usr_alex",
  },
  {
    id: "txn_school_initial",
    fundId: "fund_school",
    kind: "fund",
    amount: 80_000,
    source: "household",
    sourceLabel: "Household",
    createdAt: at(9, 7, 15),
    createdBy: "usr_alex",
  },
];

/**
 * Expenses.
 *
 * House Groceries: 12,000 + 8,500 + 4,000 + 3,000 = ₦27,500 spent,
 * leaving ₦22,500 remaining from ₦50,000 received.
 * School Expenses: 25,000 + 6,000 + 4,000 = ₦35,000 spent,
 * leaving ₦45,000 remaining from ₦80,000 received.
 *
 * The "Rice" record carries an edit trail: it was first logged at ₦11,500
 * and later corrected to ₦12,000. This demonstrates that Fundly keeps an
 * honest record of changes instead of silently overwriting history.
 */
const expenses: Expense[] = [
  {
    id: "exp_rice",
    fundId: "fund_groceries",
    description: "Rice",
    amount: 12_000,
    category: "food",
    note: "Bought from the market.",
    createdAt: at(0, 10, 24),
    updatedAt: at(0, 12, 5),
    createdBy: "usr_alex",
    edited: true,
    revisions: [
      {
        at: at(0, 12, 5),
        byUserId: "usr_alex",
        amount: 11_500,
        description: "Rice",
        category: "food",
        note: "Bought from the market.",
        summary: "₦11,500 → ₦12,000",
      },
    ],
  },
  {
    id: "exp_chicken",
    fundId: "fund_groceries",
    description: "Chicken",
    amount: 8_500,
    category: "food",
    note: "2 whole chickens.",
    createdAt: at(0, 9, 10),
    updatedAt: at(0, 9, 10),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
  {
    id: "exp_vegetables",
    fundId: "fund_groceries",
    description: "Vegetables",
    amount: 4_000,
    category: "food",
    note: "Tomato, pepper, onions.",
    createdAt: at(2, 11, 45),
    updatedAt: at(2, 11, 45),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
  {
    id: "exp_transport_groceries",
    fundId: "fund_groceries",
    description: "Transport",
    amount: 3_000,
    category: "transport",
    note: "Danfo fare to the market.",
    createdAt: at(3, 15, 20),
    updatedAt: at(3, 15, 20),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
  {
    id: "exp_school_fees",
    fundId: "fund_school",
    description: "School fees",
    amount: 25_000,
    category: "school",
    note: "First term payment.",
    createdAt: at(5, 9, 0),
    updatedAt: at(5, 9, 0),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
  {
    id: "exp_books",
    fundId: "fund_school",
    description: "Books and supplies",
    amount: 6_000,
    category: "school",
    createdAt: at(4, 14, 30),
    updatedAt: at(4, 14, 30),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
  {
    id: "exp_school_transport",
    fundId: "fund_school",
    description: "School bus",
    amount: 4_000,
    category: "transport",
    createdAt: at(2, 16, 40),
    updatedAt: at(2, 16, 40),
    createdBy: "usr_alex",
    edited: false,
    revisions: [],
  },
];

const notifications: AppNotification[] = [
  {
    id: "ntf_rice",
    kind: "expense-added",
    title: "₦12,000 expense added to House Groceries",
    message: "Rice was recorded by Alex.",
    fundId: "fund_groceries",
    amount: 12_000,
    createdAt: at(0, 10, 24),
    read: false,
  },
  {
    id: "ntf_groceries_updated",
    kind: "fund-updated",
    title: "House Groceries was updated",
    message: "The Rice amount was changed from ₦11,500 to ₦12,000.",
    fundId: "fund_groceries",
    createdAt: at(0, 12, 5),
    read: false,
  },
  {
    id: "ntf_balance",
    kind: "balance",
    title: "Your remaining balance is ₦22,500",
    message: "House Groceries has ₦22,500 left to spend.",
    fundId: "fund_groceries",
    amount: 22_500,
    createdAt: at(1, 8, 45),
    read: true,
  },
  {
    id: "ntf_member",
    kind: "member-joined",
    title: "New member joined your household",
    message: "Partner joined Alex's Household.",
    createdAt: at(6, 8, 0),
    read: true,
  },
];

/** A fully-populated, ready-to-use dataset. */
export function createSeedData(): AppData {
  return {
    version: SEED_VERSION,
    user: users[0] ?? null,
    household: {
      id: "hh_johnson",
      name: "Alex's Household",
      memberIds: members.map((m) => m.id),
      createdAt: daysAgoISO(64),
    },
    users,
    members,
    funds,
    transactions,
    expenses,
    archive: [],
    notifications,
    preferences: {
      notificationsEnabled: true,
      expenseReminders: true,
      moneyAddedAlerts: true,
      weeklySummary: false,
      shareReportsByLink: true,
      showProfilePhoto: true,
    },
  };
}

/** Shallow clone helpers used by the store so state stays immutable. */
export function cloneSeed(): AppData {
  return structuredClone(createSeedData());
}