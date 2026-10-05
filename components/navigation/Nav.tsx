"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useFundly } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shows the unread notification dot when true. */
  badgeNotifications?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/funds", label: "Funds", icon: Wallet },
  { href: "/transactions", label: "Activity", icon: BarChart3 },
  { href: "/household", label: "Household", icon: Users },
  {
    href: "/profile",
    label: "Profile",
    icon: Settings,
    badgeNotifications: true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bottom navigation — mobile only (< lg)                                    */
/* -------------------------------------------------------------------------- */

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useFundly();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 lg:hidden",
        "border-t border-cream-400 bg-white/95 backdrop-blur-md",
        "pb-safe shadow-[0_-1px_0_rgba(31,33,29,0.04)]",
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {PRIMARY_NAV.map((item) => (
          <li key={item.href} className="flex-1">
            <BottomNavLink
              item={item}
              active={isActive(pathname, item.href)}
              badge={item.badgeNotifications === true && unreadCount > 0}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BottomNavLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-[58px] flex-col items-center justify-center gap-1",
        "px-1 py-1.5 text-[11px] font-semibold transition-colors duration-150",
        active ? "text-forest-700" : "text-ink-500 hover:text-ink-700",
      )}
    >
      {/* Active pill sits behind the icon. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 flex h-7 w-12 items-center justify-center rounded-lg transition-colors duration-150",
          active ? "bg-forest-50" : "bg-transparent",
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
      </span>

      <span className="relative">
        {item.label}
        {badge ? <span className="sr-only"> (unread notifications)</span> : null}
      </span>

      {badge ? (
        <span
          aria-hidden="true"
          className="absolute right-[22%] top-1.5 size-2 rounded-full bg-danger-500 ring-2 ring-white"
        />
      ) : null}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating action button — add expense                                      */
/* -------------------------------------------------------------------------- */

export function FloatingAddButton() {
  return (
    <Link
      href="/expenses/new"
      aria-label="Add expense"
      className={cn(
        "fixed right-4 z-50 flex size-14 items-center justify-center rounded-full lg:hidden",
        "bg-forest-700 text-white shadow-lifted",
        "transition-transform duration-150 ease-out",
        "hover:bg-forest-800 active:scale-95",
        "bottom-[calc(env(safe-area-inset-bottom,0px)+72px)]",
      )}
    >
      <Plus className="size-6" strokeWidth={2.5} />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar — desktop only (lg+)                                              */
/* -------------------------------------------------------------------------- */

export function Sidebar() {
  const pathname = usePathname();
  const { data, unreadCount } = useFundly();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-cream-400 bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <BrandMark />
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold leading-tight text-forest-900">
            Fundly
          </p>
          <p className="truncate text-[12px] leading-tight text-ink-500">
            {data.household?.name ?? "Household"}
          </p>
        </div>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const badge = item.badgeNotifications === true && unreadCount > 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[46px] items-center gap-3 rounded-xl px-3",
                    "text-[15px] font-semibold transition-colors duration-150",
                    active
                      ? "bg-forest-50 text-forest-800"
                      : "text-ink-600 hover:bg-cream-100 hover:text-ink-900",
                  )}
                >
                  <Icon
                    className={cn("size-5 shrink-0", active && "text-forest-700")}
                    strokeWidth={active ? 2.3 : 2}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge ? (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-danger-500"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick actions pinned to the bottom of the rail */}
      <div className="flex flex-col gap-2 px-3 pb-5">
        <Link
          href="/expenses/new"
          className={cn(
            "flex min-h-[46px] items-center justify-center gap-2 rounded-xl",
            "bg-forest-700 px-3 text-[15px] font-semibold text-white",
            "transition-colors hover:bg-forest-800",
          )}
        >
          <Plus className="size-5" strokeWidth={2.4} />
          Add expense
        </Link>
        <Link
          href="/funds/new"
          className={cn(
            "flex min-h-[46px] items-center justify-center gap-2 rounded-xl",
            "border border-forest-200 bg-white px-3 text-[15px] font-semibold",
            "text-forest-800 transition-colors hover:bg-forest-50",
          )}
        >
          <Wallet className="size-5" />
          New fund
        </Link>
      </div>
    </aside>
  );
}

/** The ₦ mark, matching the generated app icon. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-forest-card",
        "font-bold text-cream-100 shadow-xs",
        size === "sm" ? "size-9 text-[15px]" : "size-10 text-[17px]",
      )}
    >
      ₦
    </span>
  );
}

/** Route matching that treats nested paths as active (e.g. /funds/x). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}