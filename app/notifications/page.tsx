"use client";

import { useState } from "react";
import {
  Banknote,
  BellRing,
  Check,
  Pencil,
  Receipt,
  Trash2,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { formatRelativeLabel } from "@/lib/date";
import { useFundly } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/navigation/AppShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  useToast,
} from "@/components/ui";
import type { NotificationKind } from "@/types";

/** Icon + tint per notification kind. */
const KIND_META: Record<
  NotificationKind,
  { icon: LucideIcon; chip: string }
> = {
  "fund-created": { icon: Wallet, chip: "bg-forest-100 text-forest-700" },
  "money-added": { icon: Banknote, chip: "bg-sage-100 text-sage-700" },
  "expense-added": { icon: Receipt, chip: "bg-peach-100 text-peach-700" },
  "expense-edited": { icon: Pencil, chip: "bg-peach-100 text-peach-700" },
  "expense-deleted": { icon: Trash2, chip: "bg-ink-100 text-ink-500" },
  "fund-updated": { icon: Pencil, chip: "bg-forest-100 text-forest-700" },
  balance: { icon: Banknote, chip: "bg-forest-100 text-forest-700" },
  "member-joined": { icon: UserPlus, chip: "bg-sage-100 text-sage-700" },
};

export default function NotificationsPage() {
  const {
    data,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useFundly();
  const toast = useToast();

  const [confirmClear, setConfirmClear] = useState(false);
  const notifications = data.notifications;

  return (
    <AppShell title="Notifications" hideFab>
      <div className="flex flex-col gap-4">
        {notifications.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Check className="size-4" />}
                onClick={() => {
                  markAllNotificationsRead();
                  toast.info("All caught up");
                }}
              >
                Mark all read
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmClear(true)}
              className="text-danger-600 hover:bg-danger-50"
            >
              Clear all
            </Button>

            <span className="ml-auto text-[13px] text-ink-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </span>
          </div>
        ) : null}

        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BellRing className="size-8" />}
              title="No notifications yet"
              description="When money is added, an expense is recorded or a member joins, you'll see it here."
              compact
            />
          </Card>
        ) : (
          <ul className="stagger flex flex-col gap-2.5">
            {notifications.map((notification) => {
              const meta = KIND_META[notification.kind];
              const Icon = meta.icon;

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => markNotificationRead(notification.id)}
                    className={cn(
                      "flex w-full items-start gap-3.5 rounded-2xl border bg-white p-4 text-left",
                      "transition-colors duration-150 hover:border-forest-200",
                      notification.read
                        ? "border-cream-300"
                        : "border-forest-200 bg-forest-50/40",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        meta.chip,
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-semibold text-ink-900">
                          {notification.title}
                        </p>
                        {!notification.read ? (
                          <Badge tone="info" dot>
                            New
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[14px] leading-relaxed text-ink-600">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[12px] text-ink-400">
                        {formatRelativeLabel(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearNotifications();
          setConfirmClear(false);
          toast.info("Notifications cleared");
        }}
        title="Clear all notifications?"
        message="Every notification will be removed from this device. Your funds and expenses are not affected."
        confirmLabel="Clear all"
        icon={<Trash2 className="size-5" />}
      />
    </AppShell>
  );
}