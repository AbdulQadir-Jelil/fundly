"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cloneSeed, SEED_VERSION } from "@/lib/data/seed";
import { toISODate } from "@/lib/date";
import { createId } from "@/lib/utils";
import type {
  AppData,
  AppNotification,
  ArchivedExpense,
  Expense,
  ExpenseCategory,
  Fund,
  HouseholdMember,
  MoneyInTransaction,
  MoneySource,
  Preferences,
  User,
} from "@/types";

const STORAGE_KEY = "fundly.data.v1";

/* -------------------------------------------------------------------------- */
/*  Action payloads                                                            */
/* -------------------------------------------------------------------------- */

export type NewExpenseInput = {
  fundId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  receipt?: string;
  receiptName?: string;
  createdAt?: string;
};

export type NewFundInput = {
  name: string;
  purpose: string;
  note?: string;
  amount: number;
  source: MoneySource;
  date: string;
};

export type NewMoneyInput = {
  fundId: string;
  amount: number;
  source: MoneySource;
  sourceLabel?: string;
  note?: string;
  date: string;
};

export type ExpenseChanges = {
  description?: string;
  amount?: number;
  category?: ExpenseCategory;
  note?: string;
  receipt?: string;
  receiptName?: string;
};

type Action =
  | { type: "hydrate"; data: AppData }
  | { type: "sign-in"; user: User }
  | { type: "sign-out" }
  | { type: "sign-up"; user: User }
  | { type: "fund/create"; fund: Fund; transaction: MoneyInTransaction }
  | { type: "fund/add-money"; transaction: MoneyInTransaction }
  | { type: "expense/add"; expense: Expense }
  | {
      type: "expense/update";
      expenseId: string;
      expense: Expense;
      notification?: AppNotification;
    }
  | { type: "expense/delete"; expenseId: string }
  | { type: "expense/restore"; expenseId: string }
  | { type: "notification/add"; notification: AppNotification }
  | { type: "notification/mark-read"; id: string }
  | { type: "notification/mark-all-read" }
  | { type: "notification/clear" }
  | { type: "member/invite"; member: HouseholdMember }
  | { type: "member/remove"; memberId: string }
  | { type: "profile/update"; changes: Partial<User> }
  | { type: "preferences/update"; changes: Partial<Preferences> }
  | { type: "data/reset" };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function nowISO(): string {
  return toISODate(new Date());
}

function touchFund(funds: Fund[], fundId: string): Fund[] {
  const at = nowISO();
  return funds.map((f) => (f.id === fundId ? { ...f, updatedAt: at } : f));
}

function makeNotification(
  input: Omit<AppNotification, "id" | "createdAt" | "read">,
): AppNotification {
  return { id: createId("ntf"), createdAt: nowISO(), read: false, ...input };
}

const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                    */
/* -------------------------------------------------------------------------- */

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "hydrate":
      return action.data;

    case "sign-in":
      return { ...state, user: action.user };

    case "sign-out":
      return { ...state, user: null };

    case "sign-up":
      return {
        ...state,
        user: action.user,
        users: [action.user, ...state.users],
        members: [
          {
            id: createId("mem"),
            name: action.user.name,
            email: action.user.email,
            role: "owner" as const,
            relationship: "Owner",
            joinedAt: nowISO(),
          },
          ...state.members.filter((m) => m.role !== "owner"),
        ],
      };

    case "fund/create":
      return {
        ...state,
        funds: [action.fund, ...state.funds],
        transactions: [action.transaction, ...state.transactions],
        notifications: [
          makeNotification({
            kind: "fund-created",
            title: `${action.fund.name} was created`,
            message: `You received ${naira(action.transaction.amount)} for this fund.`,
            fundId: action.fund.id,
            amount: action.transaction.amount,
          }),
          ...state.notifications,
        ],
      };

    case "fund/add-money": {
      const fund = state.funds.find((f) => f.id === action.transaction.fundId);
      return {
        ...state,
        funds: touchFund(state.funds, action.transaction.fundId),
        transactions: [action.transaction, ...state.transactions],
        notifications: [
          makeNotification({
            kind: "money-added",
            title: `${naira(action.transaction.amount)} added to ${fund?.name ?? "your fund"}`,
            message: "Money added successfully.",
            fundId: action.transaction.fundId,
            amount: action.transaction.amount,
          }),
          ...state.notifications,
        ],
      };
    }

    case "expense/add": {
      const fund = state.funds.find((f) => f.id === action.expense.fundId);
      return {
        ...state,
        funds: touchFund(state.funds, action.expense.fundId),
        expenses: [action.expense, ...state.expenses],
        notifications: [
          makeNotification({
            kind: "expense-added",
            title: `${naira(action.expense.amount)} expense added to ${fund?.name ?? "your fund"}`,
            message: `${action.expense.description} was recorded.`,
            fundId: action.expense.fundId,
            amount: action.expense.amount,
          }),
          ...state.notifications,
        ],
      };
    }

    case "expense/update": {
      const existing = state.expenses.find((e) => e.id === action.expenseId);
      return {
        ...state,
        funds: existing ? touchFund(state.funds, existing.fundId) : state.funds,
        expenses: state.expenses.map((e) =>
          e.id === action.expenseId ? action.expense : e,
        ),
        notifications: action.notification
          ? [action.notification, ...state.notifications]
          : state.notifications,
      };
    }

    case "expense/delete": {
      const target = state.expenses.find((e) => e.id === action.expenseId);
      if (!target) return state;

      // Move to the archive rather than erasing — the transaction history
      // must keep showing that this activity happened.
      const archived: ArchivedExpense = {
        id: target.id,
        fundId: target.fundId,
        description: target.description,
        amount: target.amount,
        category: target.category,
        note: target.note,
        createdAt: target.createdAt,
        deletedAt: nowISO(),
        revisions: target.revisions,
      };

      return {
        ...state,
        funds: touchFund(state.funds, target.fundId),
        expenses: state.expenses.filter((e) => e.id !== action.expenseId),
        archive: [archived, ...state.archive],
        notifications: [
          makeNotification({
            kind: "expense-deleted",
            title: `${naira(target.amount)} expense removed`,
            message: `${target.description} was removed from this fund.`,
            fundId: target.fundId,
            amount: target.amount,
          }),
          ...state.notifications,
        ],
      };
    }

    case "expense/restore": {
      const archived = state.archive.find((a) => a.id === action.expenseId);
      if (!archived) return state;
      const restored: Expense = {
        id: archived.id,
        fundId: archived.fundId,
        description: archived.description,
        amount: archived.amount,
        category: archived.category,
        note: archived.note,
        createdAt: archived.createdAt,
        updatedAt: archived.deletedAt,
        createdBy: state.user?.id ?? "usr_alex",
        edited: archived.revisions.length > 0,
        revisions: archived.revisions,
      };
      return {
        ...state,
        funds: touchFund(state.funds, archived.fundId),
        expenses: [restored, ...state.expenses],
        archive: state.archive.filter((a) => a.id !== action.expenseId),
      };
    }

    case "notification/add":
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
      };

    case "notification/mark-read":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };

    case "notification/mark-all-read":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case "notification/clear":
      return { ...state, notifications: [] };

    case "member/invite": {
      const household = state.household
        ? {
            ...state.household,
            memberIds: [...state.household.memberIds, action.member.id],
          }
        : state.household;
      return {
        ...state,
        household,
        members: [...state.members, action.member],
        notifications: [
          makeNotification({
            kind: "member-joined",
            title: `${action.member.name} joined your household`,
            message: `${action.member.relationship ?? "A new member"} is now part of this household.`,
          }),
          ...state.notifications,
        ],
      };
    }

    case "member/remove": {
      const household = state.household
        ? {
            ...state.household,
            memberIds: state.household.memberIds.filter(
              (id) => id !== action.memberId,
            ),
          }
        : state.household;
      return {
        ...state,
        household,
        members: state.members.filter((m) => m.id !== action.memberId),
      };
    }

    case "profile/update":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.changes } : state.user,
        users: state.users.map((u) =>
          state.user && u.id === state.user.id
            ? { ...u, ...action.changes }
            : u,
        ),
        members: state.members.map((m) =>
          state.user && m.id === state.user.id
            ? { ...m, name: action.changes.name ?? m.name }
            : m,
        ),
      };

    case "preferences/update":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.changes },
      };

    case "data/reset":
      return cloneSeed();

    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

interface FundlyContextValue {
  data: AppData;
  /** `false` during the first client render, before localStorage is read. */
  hydrated: boolean;
  unreadCount: number;

  /* Auth */
  signIn: (identifier: string) => Promise<User>;
  signUp: (name: string, identifier: string) => Promise<User>;
  signOut: () => void;

  /* Funds */
  createFund: (input: NewFundInput) => Promise<Fund>;
  addMoney: (input: NewMoneyInput) => Promise<void>;

  /* Expenses */
  addExpense: (input: NewExpenseInput) => Promise<Expense>;
  updateExpense: (
    expenseId: string,
    changes: ExpenseChanges,
  ) => Promise<{ previousAmount: number } | null>;
  deleteExpense: (expenseId: string) => Promise<void>;
  restoreExpense: (expenseId: string) => Promise<void>;

  /* Notifications */
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  /* Household */
  inviteMember: (name: string, relationship: string) => Promise<void>;
  removeMember: (memberId: string) => void;

  /* Profile & preferences */
  updateProfile: (changes: Partial<User>) => void;
  updatePreferences: (changes: Partial<Preferences>) => void;

  resetDemoData: () => void;
}

const FundlyContext = createContext<FundlyContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function FundlyProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, null, cloneSeed);
  const [hydrated, setHydrated] = useState(false);
  const hasHydrated = useRef(false);

  // Read persisted state once, on the client, after first paint.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        // Only adopt the payload when the shape matches this build.
        if (parsed && parsed.version === SEED_VERSION) {
          dispatch({ type: "hydrate", data: parsed });
        }
      }
    } catch {
      // Corrupt or unavailable storage: fall back to the seed dataset.
    } finally {
      hasHydrated.current = true;
      setHydrated(true);
    }
  }, []);

  // Persist on every change, but only after hydration to avoid clobbering
  // stored data with the initial seed.
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode) — the app still works in
      // memory for this session.
    }
  }, [data]);

  const unreadCount = useMemo(
    () => data.notifications.filter((n) => !n.read).length,
    [data.notifications],
  );

  /* ---- Auth ----------------------------------------------------------- */

  const signIn = useCallback(
    async (identifier: string): Promise<User> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const existing =
        data.user ??
        data.users[0] ??
        ({
          id: createId("usr"),
          name: "Alex Johnson",
          email: identifier,
          avatarColor: "bg-forest-700",
          householdId: "hh_johnson",
          createdAt: nowISO(),
        } satisfies User);

      const user: User = { ...existing, email: identifier };
      dispatch({ type: "sign-in", user });
      return user;
    },
    [data.user, data.users],
  );

  const signUp = useCallback(
    async (name: string, identifier: string): Promise<User> => {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const user: User = {
        id: createId("usr"),
        name,
        email: identifier,
        avatarColor: "bg-forest-700",
        householdId: data.household?.id ?? "hh_johnson",
        createdAt: nowISO(),
      };
      dispatch({ type: "sign-up", user });
      return user;
    },
    [data.household?.id],
  );

  const signOut = useCallback(() => {
    dispatch({ type: "sign-out" });
  }, []);

  /* ---- Funds ---------------------------------------------------------- */

  const createFund = useCallback(
    async (input: NewFundInput): Promise<Fund> => {
      await new Promise((resolve) => setTimeout(resolve, 550));
      const userId = data.user?.id ?? "usr_alex";
      const at = input.date ? new Date(input.date).toISOString() : nowISO();

      const fund: Fund = {
        id: createId("fund"),
        name: input.name.trim(),
        purpose: input.purpose.trim(),
        note: input.note?.trim() || undefined,
        source: input.source,
        createdAt: at,
        updatedAt: at,
        createdBy: userId,
      };

      const transaction: MoneyInTransaction = {
        id: createId("txn"),
        fundId: fund.id,
        kind: "fund",
        amount: input.amount,
        source: input.source,
        note: input.note?.trim() || undefined,
        createdAt: at,
        createdBy: userId,
      };

      dispatch({ type: "fund/create", fund, transaction });
      return fund;
    },
    [data.user?.id],
  );

  const addMoney = useCallback(
    async (input: NewMoneyInput): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const transaction: MoneyInTransaction = {
        id: createId("txn"),
        fundId: input.fundId,
        kind: "topup",
        amount: input.amount,
        source: input.source,
        sourceLabel: input.sourceLabel,
        note: input.note?.trim() || undefined,
        createdAt: input.date ? new Date(input.date).toISOString() : nowISO(),
        createdBy: data.user?.id ?? "usr_alex",
      };
      dispatch({ type: "fund/add-money", transaction });
    },
    [data.user?.id],
  );

  /* ---- Expenses ------------------------------------------------------- */

  const addExpense = useCallback(
    async (input: NewExpenseInput): Promise<Expense> => {
      await new Promise((resolve) => setTimeout(resolve, 550));
      const expense: Expense = {
        id: createId("exp"),
        fundId: input.fundId,
        description: input.description.trim(),
        amount: input.amount,
        category: input.category,
        note: input.note?.trim() || undefined,
        receipt: input.receipt,
        receiptName: input.receiptName,
        createdAt: input.createdAt ?? nowISO(),
        updatedAt: input.createdAt ?? nowISO(),
        createdBy: data.user?.id ?? "usr_alex",
        edited: false,
        revisions: [],
      };
      dispatch({ type: "expense/add", expense });
      return expense;
    },
    [data.user?.id],
  );

  const updateExpense = useCallback(
    async (
      expenseId: string,
      changes: ExpenseChanges,
    ): Promise<{ previousAmount: number } | null> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const current = data.expenses.find((e) => e.id === expenseId);
      if (!current) return null;

      const fund = data.funds.find((f) => f.id === current.fundId);
      const nextAmount = changes.amount ?? current.amount;
      const at = nowISO();

      // Every edit is preserved as a revision, so the old value is never
      // silently overwritten — it stays visible in the expense's history.
      const revision = {
        at,
        byUserId: data.user?.id ?? "usr_alex",
        amount: current.amount,
        description: current.description,
        category: current.category,
        note: current.note,
        summary: `${naira(current.amount)} → ${naira(nextAmount)}`,
      };

      const updated: Expense = {
        ...current,
        ...changes,
        updatedAt: at,
        edited: true,
        revisions: [...current.revisions, revision],
      };

      dispatch({
        type: "expense/update",
        expenseId,
        expense: updated,
        notification: makeNotification({
          kind: "expense-edited",
          title: `${fund?.name ?? "A fund"} was updated`,
          message: `${updated.description} was changed from ${naira(current.amount)} to ${naira(nextAmount)}.`,
          fundId: current.fundId,
          amount: nextAmount,
        }),
      });

      return { previousAmount: current.amount };
    },
    [data.expenses, data.funds, data.user?.id],
  );

  const deleteExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      dispatch({ type: "expense/delete", expenseId });
    },
    [],
  );

  const restoreExpense = useCallback(
    async (expenseId: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      dispatch({ type: "expense/restore", expenseId });
    },
    [],
  );

  /* ---- Notifications --------------------------------------------------- */

  const markNotificationRead = useCallback((id: string) => {
    dispatch({ type: "notification/mark-read", id });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    dispatch({ type: "notification/mark-all-read" });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: "notification/clear" });
  }, []);

  /* ---- Household ------------------------------------------------------ */

  const inviteMember = useCallback(
    async (name: string, relationship: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({
        type: "member/invite",
        member: {
          id: createId("mem"),
          name: name.trim(),
          relationship: relationship.trim(),
          role: "member",
          joinedAt: nowISO(),
        },
      });
    },
    [],
  );

  const removeMember = useCallback((memberId: string) => {
    dispatch({ type: "member/remove", memberId });
  }, []);

  /* ---- Profile & preferences ------------------------------------------ */

  const updateProfile = useCallback((changes: Partial<User>) => {
    dispatch({ type: "profile/update", changes });
  }, []);

  const updatePreferences = useCallback((changes: Partial<Preferences>) => {
    dispatch({ type: "preferences/update", changes });
  }, []);

  const resetDemoData = useCallback(() => {
    dispatch({ type: "data/reset" });
  }, []);
  const value = useMemo<FundlyContextValue>(
    () => ({
      data,
      hydrated,
      unreadCount,
      signIn,
      signUp,
      signOut,
      createFund,
      addMoney,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      inviteMember,
      removeMember,
      updateProfile,
      updatePreferences,
      resetDemoData,
    }),
    [
      data,
      hydrated,
      unreadCount,
      signIn,
      signUp,
      signOut,
      createFund,
      addMoney,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      inviteMember,
      removeMember,
      updateProfile,
      updatePreferences,
      resetDemoData,
    ],
  );

  return (
    <FundlyContext.Provider value={value}>{children}</FundlyContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useFundly(): FundlyContextValue {
  const context = useContext(FundlyContext);
  if (!context) {
    throw new Error("useFundly must be used inside <FundlyProvider>");
  }
  return context;
}