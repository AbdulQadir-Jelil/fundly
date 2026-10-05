/**
 * Nigerian Naira formatting helpers.
 *
 * Everything in Fundly is whole Naira, so we format with
 * `maximumFractionDigits: 0` and always emit the ₦ sign first.
 */

const NairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `50000` → `"₦50,000"` */
export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return NairaFormatter.format(Math.round(safe)).replace(/ /g, " ");
}

/** `50000` → `"50,000"` (no symbol). Used inside input affordances. */
export function formatNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
}

/** `50000` → `"₦50,000.00"` — used in receipts / detail views. */
export function formatNairaPrecise(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(safe));
}

/**
 * Parses user-typed currency into a number.
 * Accepts `₦50,000`, `50,000`, `50000`, `50 000`, `₦ 12 500.50`.
 * A leading minus sign is preserved, so `-500` parses as `-500` rather than
 * silently becoming `500` — callers validate positivity themselves.
 * Returns `null` when the text contains no digits at all.
 */
export function parseAmount(input: string): number | null {
  if (!input) return null;
  const negative = /^\s*[-−(]/.test(input);
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/**
 * Formats a value for display inside an editable amount input:
 * strips the symbol and keeps digit grouping, e.g. `"12,000"`.
 */
export function toAmountInputValue(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  return formatNumber(amount);
}

/** True when the amount is a usable, positive money value. */
export function isPositiveAmount(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Clamp a value into a 0–100 range (progress bars).
 *
 * Rounded to two decimal places so derived percentages never surface binary
 * floating-point noise — `27500 / 50000 * 100` is `55.00000000000001` in
 * IEEE 754, and that number is shown to users and compared against thresholds.
 */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round(clamped * 100) / 100;
}