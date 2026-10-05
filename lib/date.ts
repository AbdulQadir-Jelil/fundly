/**
 * Date helpers.
 *
 * Dates are stored as ISO strings and rendered in a friendly, non-corporate
 * way: "Today", "Yesterday", "Mon, 12 May".
 */

export function toISODate(date: Date): string {
  return date.toISOString();
}

export function todayISO(): string {
  // Use local calendar day so "today" matches what the user sees.
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toISODate(d);
}

function startOfDay(input: Date | string): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whole-day difference between two dates (b − a). */
export function daysBetween(a: Date | string, b: Date | string): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** `true` when the date is the user's current calendar day. */
export function isToday(date: Date | string): boolean {
  return daysBetween(date, new Date()) === 0;
}

/** `true` when the date was the previous calendar day. */
export function isYesterday(date: Date | string): boolean {
  return daysBetween(date, new Date()) === 1;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

/** `"Today"` / `"Yesterday"` / `"28 Apr, 2025"` */
export function formatFriendlyDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return shortDateFormatter.format(d);
}

/** Compact variant for dense lists: `"28 Apr"` (adds year when not this year). */
export function formatCompactDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear ? compactDateFormatter.format(d) : shortDateFormatter.format(d);
}

/** `"Updated today"` / `"Updated 2 days ago"` — used on cards and reports. */
export function formatRelativeLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Updated recently";
  const diff = daysBetween(d, new Date());
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "Last week";
  if (diff < 60) return `${Math.floor(diff / 7)} weeks ago`;
  return compactDateFormatter.format(d);
}

/** `"Today, 10:24 AM"` — used in the activity timeline. */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatFriendlyDate(d)}, ${formatTime(d)}`;
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return timeFormatter.format(d);
}

/**
 * Greeting used on the dashboard: "Good morning" / "Good afternoon" /
 * "Good evening".
 */
export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** First name only, for the dashboard greeting. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}