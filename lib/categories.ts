import {
  Bus,
  CookingPot,
  CreditCard,
  HeartPulse,
  Home,
  MoreHorizontal,
  ShoppingBag,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import type { ExpenseCategory, MoneySource } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Expense categories                                                        */
/* -------------------------------------------------------------------------- */

export interface CategoryMeta {
  value: ExpenseCategory;
  label: string;
  icon: LucideIcon;
  /** Icon + tint treatment. Keeps the accent palette restrained. */
  tone: "peach" | "forest" | "butter" | "sage" | "ink";
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  food: { value: "food", label: "Food", icon: CookingPot, tone: "peach" },
  transport: { value: "transport", label: "Transport", icon: Bus, tone: "butter" },
  household: { value: "household", label: "Household", icon: Home, tone: "forest" },
  bills: { value: "bills", label: "Bills", icon: CreditCard, tone: "ink" },
  school: { value: "school", label: "School", icon: ShoppingBag, tone: "forest" },
  health: { value: "health", label: "Health", icon: HeartPulse, tone: "sage" },
  shopping: { value: "shopping", label: "Shopping", icon: ShoppingBasket, tone: "peach" },
  other: { value: "other", label: "Other", icon: MoreHorizontal, tone: "ink" },
};

export const CATEGORY_LIST: CategoryMeta[] = [
  CATEGORY_META.food,
  CATEGORY_META.transport,
  CATEGORY_META.household,
  CATEGORY_META.bills,
  CATEGORY_META.school,
  CATEGORY_META.health,
  CATEGORY_META.shopping,
  CATEGORY_META.other,
];

export function categoryMeta(category: ExpenseCategory): CategoryMeta {
  return CATEGORY_META[category] ?? CATEGORY_META.other;
}

export function categoryLabel(category: ExpenseCategory): string {
  return categoryMeta(category).label;
}

/** Tailwind classes for the category's icon chip. */
export function categoryToneClasses(tone: CategoryMeta["tone"]): {
  chip: string;
} {
  switch (tone) {
    case "peach":
      return { chip: "bg-peach-100 text-peach-700" };
    case "forest":
      return { chip: "bg-forest-100 text-forest-700" };
    case "butter":
      return { chip: "bg-butter-100 text-butter-500" };
    case "sage":
      return { chip: "bg-sage-100 text-sage-700" };
    case "ink":
    default:
      return { chip: "bg-ink-100 text-ink-600" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Money sources — deliberately neutral wording                               */
/* -------------------------------------------------------------------------- */

export const MONEY_SOURCES: Array<{
  value: MoneySource;
  label: string;
  hint: string;
}> = [
  { value: "me", label: "Me", hint: "Money you added yourself." },
  {
    value: "someone-else",
    label: "Someone else",
    hint: "A family member, friend or relative.",
  },
  {
    value: "household",
    label: "Household",
    hint: "Shared money everyone contributes to.",
  },
  { value: "other", label: "Other", hint: "Any other source." },
];

export function moneySourceLabel(source: MoneySource): string {
  return MONEY_SOURCES.find((s) => s.value === source)?.label ?? "Other";
}

/* -------------------------------------------------------------------------- */
/*  Avatar tints                                                               */
/* -------------------------------------------------------------------------- */

export const AVATAR_TINTS = [
  "bg-forest-700 text-white",
  "bg-peach-500 text-white",
  "bg-sage-600 text-white",
  "bg-ink-700 text-white",
  "bg-butter-500 text-white",
  "bg-forest-500 text-white",
] as const;