import { isPositiveAmount, parseAmount } from "@/lib/currency";
import type { ExpenseCategory } from "@/types";

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                */
/* -------------------------------------------------------------------------- */

/** Accepts an email address or a Nigerian/international phone number. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;

export function isValidEmailOrPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (EMAIL_RE.test(trimmed)) return true;
  // Phone: strip the usual separators before testing digits.
  const digits = trimmed.replace(/[\s()-]/g, "");
  return PHONE_RE.test(trimmed) && digits.replace(/\D/g, "").length >= 7;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/* -------------------------------------------------------------------------- */
/*  Field-level validators                                                    */
/* -------------------------------------------------------------------------- */

export function validateFullName(value: string): string | null {
  if (!value.trim()) return "Name is required";
  if (value.trim().length < 2) return "Enter your full name";
  if (!value.trim().includes(" ")) return "Enter your first and last name";
  if (!/^[\p{L}\p{M}'\-. ]+$/u.test(value.trim())) {
    return "Use letters only";
  }
  return null;
}

export function validateIdentifier(value: string): string | null {
  if (!value.trim()) return "Email or phone is required";
  if (!isValidEmailOrPhone(value)) return "Enter a valid email or phone number";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(value)) return "Include at least one letter";
  if (!/\d/.test(value)) return "Include at least one number";
  return null;
}

/** Fund name: required, reasonable length. */
export function validateFundName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Fund name is required";
  if (trimmed.length < 2) return "Enter a name with at least 2 characters";
  if (trimmed.length > 60) return "Keep the name under 60 characters";
  return null;
}

/** Amount: required and strictly greater than zero. */
export function validateAmount(value: string): string | null {
  if (!value.trim()) return "Amount is required";
  const parsed = parseAmount(value);
  if (parsed === null) return "Enter a valid amount";
  if (!isPositiveAmount(parsed)) return "Amount must be greater than 0";
  if (parsed > 999_999_999) return "That amount looks too large";
  return null;
}

/** Expense description: required. */
export function validateDescription(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Tell us what this was for";
  if (trimmed.length < 2) return "Add a little more detail";
  if (trimmed.length > 80) return "Keep it under 80 characters";
  return null;
}

/** Category: required, and must be a known category. */
export function validateCategory(value: ExpenseCategory | ""): string | null {
  if (!value) return "Choose a category";
  return null;
}

export function validateDate(value: string): string | null {
  if (!value) return "Date is required";
  if (Number.isNaN(new Date(value).getTime())) return "Enter a valid date";
  // Allow a small grace period for timezone drift, then block future dates.
  if (new Date(value).getTime() > Date.now() + 86_400_000) {
    return "Date can't be in the future";
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Form validators — return a map of field → message                          */
/* -------------------------------------------------------------------------- */

export type ValidationErrors<T extends string = string> = Partial<
  Record<T, string>
>;

export interface SignUpValues {
  name: string;
  identifier: string;
  password: string;
}

export function validateSignUp(
  values: SignUpValues,
): ValidationErrors<keyof SignUpValues> {
  const errors: ValidationErrors<keyof SignUpValues> = {};
  const name = validateFullName(values.name);
  if (name) errors.name = name;
  const identifier = validateIdentifier(values.identifier);
  if (identifier) errors.identifier = identifier;
  const password = validatePassword(values.password);
  if (password) errors.password = password;
  return errors;
}

export interface LoginValues {
  identifier: string;
  password: string;
}

export function validateLogin(
  values: LoginValues,
): ValidationErrors<keyof LoginValues> {
  const errors: ValidationErrors<keyof LoginValues> = {};
  const identifier = validateIdentifier(values.identifier);
  if (identifier) errors.identifier = identifier;
  if (!values.password) errors.password = "Password is required";
  return errors;
}

export interface CreateFundValues {
  name: string;
  amount: string;
  purpose: string;
  date: string;
  note: string;
}

export function validateCreateFund(
  values: CreateFundValues,
): ValidationErrors<keyof CreateFundValues> {
  const errors: ValidationErrors<keyof CreateFundValues> = {};
  const name = validateFundName(values.name);
  if (name) errors.name = name;
  const amount = validateAmount(values.amount);
  if (amount) errors.amount = amount;
  if (!values.purpose.trim()) errors.purpose = "Add a short purpose";
  const date = validateDate(values.date);
  if (date) errors.date = date;
  return errors;
}

export interface AddMoneyValues {
  amount: string;
  date: string;
  note: string;
}

export function validateAddMoney(
  values: AddMoneyValues,
): ValidationErrors<keyof AddMoneyValues> {
  const errors: ValidationErrors<keyof AddMoneyValues> = {};
  const amount = validateAmount(values.amount);
  if (amount) errors.amount = amount;
  const date = validateDate(values.date);
  if (date) errors.date = date;
  return errors;
}

export interface ExpenseValues {
  description: string;
  amount: string;
  category: ExpenseCategory | "";
  date: string;
  note: string;
}

export function validateExpense(
  values: ExpenseValues,
): ValidationErrors<keyof ExpenseValues> {
  const errors: ValidationErrors<keyof ExpenseValues> = {};
  const description = validateDescription(values.description);
  if (description) errors.description = description;
  const amount = validateAmount(values.amount);
  if (amount) errors.amount = amount;
  const category = validateCategory(values.category);
  if (category) errors.category = category;
  const date = validateDate(values.date);
  if (date) errors.date = date;
  return errors;
}

export interface InviteValues {
  name: string;
  relationship: string;
}

export function validateInvite(
  values: InviteValues,
): ValidationErrors<keyof InviteValues> {
  const errors: ValidationErrors<keyof InviteValues> = {};
  if (!values.name.trim()) {
    errors.name = "Name is required";
  } else if (values.name.trim().length < 2) {
    errors.name = "Enter their full name";
  }
  if (!values.relationship.trim()) {
    errors.relationship = "Add a relationship, e.g. Partner or Roommate";
  }
  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Async helper: resolves after a short delay so loading states are visible. */
export async function fakeRequest<T>(result: T, ms = 500): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return result;
}