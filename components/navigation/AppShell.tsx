"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft, Wallet } from "lucide-react";
import { useFundly } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { BottomNav, FloatingAddButton, Sidebar } from "./Nav";

export interface AppShellProps {
  children: React.ReactNode;
  /** Hides the shell chrome (used by auth screens and the share report). */
  bare?: boolean;
  /** Title rendered in the top bar. Falls back to the route segment. */
  title?: string;
  /** Overrides the auto back button (e.g. on detail screens). */
  backHref?: string | null;
  /** Extra classes on the scrolling content area. */
  contentClassName?: string;
  /** True on screens that manage their own floating action button. */
  hideFab?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Shell                                                                     */
/* -------------------------------------------------------------------------- */

export function AppShell({
  children,
  bare,
  title,
  backHref,
  contentClassName,
  hideFab,
}: AppShellProps) {
  const pathname = usePathname();

  if (bare) {
    return (
      <main id="main" className="min-h-dvh">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh bg-app">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title ?? titleFromPath(pathname)}
          backHref={backHref ?? defaultBackHref(pathname)}
        />

        <main
          id="main"
          className={cn(
            "mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6",
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>

      {hideFab ? null : <FloatingAddButton />}
      <BottomNav />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top bar                                                                   */
/* -------------------------------------------------------------------------- */

function TopBar({
  title,
  backHref,
}: {
  title: string;
  backHref: string | null;
}) {
  const { data, unreadCount } = useFundly();
  const user = data.user;

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-200/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            title="Go back"
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-cream-300/70 hover:text-ink-900"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight text-ink-900 lg:text-xl">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* A quiet shortcut; the primary money-in action lives on a fund. */}
          <IconLinkButton
            href="/funds/new"
            label="Create a fund"
            icon={<Wallet className="size-5" />}
            className="hidden sm:inline-flex"
          />

          <IconLinkButton
            href="/notifications"
            label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            icon={<Bell className="size-5" />}
            badge={unreadCount > 0}
          />

          <Link
            href="/profile"
            aria-label={user ? `Your profile, ${user.name}` : "Your profile"}
            className="ml-0.5 rounded-full transition-opacity hover:opacity-85"
          >
            <Avatar name={user?.name ?? "Fundly"} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Small icon link wrapper so the bar stays terse. */
function IconLinkButton({
  href,
  label,
  icon,
  badge,
  className,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
        "text-ink-600 transition-colors duration-150",
        "hover:bg-cream-300/70 hover:text-ink-900",
        className,
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {badge ? (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 size-2 rounded-full bg-danger-500 ring-2 ring-cream-200"
        />
      ) : null}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Route helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Derives a readable title from the first path segment. */
function titleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const map: Record<string, string> = {
    dashboard: "Home",
    funds: "Funds",
    transactions: "Activity",
    reports: "Reports",
    household: "Household",
    profile: "Profile",
    notifications: "Notifications",
  };
  return map[segment] ?? "Fundly";
}

/** Nested routes get a back button pointing at their parent. */
function defaultBackHref(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;
  return `/${segments[0]}`;
}