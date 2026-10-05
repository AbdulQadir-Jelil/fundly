"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  LogOut,
  RotateCcw,
  ShieldCheck,
  User,
} from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { formatFriendlyDate } from "@/lib/date";
import { getHouseholdTotals } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Toggle,
  useToast,
} from "@/components/ui";
import { validateFullName } from "@/lib/validations";

export default function ProfilePage() {
  const router = useRouter();
  const { data, updateProfile, updatePreferences, signOut, resetDemoData } =
    useFundly();
  const toast = useToast();

  const [name, setName] = useState(data.user?.name ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const [confirmReset, setConfirmReset] = useState(false);

  const totals = getHouseholdTotals(data);
  const user = data.user;
  const prefs = data.preferences;

  function saveName() {
    const problem = validateFullName(name);
    if (problem) {
      setNameError(problem);
      return;
    }
    updateProfile({ name: name.trim() });
    setNameError(undefined);
    toast.success("Profile updated");
  }

  function handleSignOut() {
    signOut();
    router.replace("/login");
  }

  return (
    <AppShell title="Profile" hideFab>
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        {/* ---- Identity ------------------------------------------- */}
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? "Fundly"} size="xl" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-bold text-ink-900">
                {user?.name ?? "Guest"}
              </h2>
              <p className="truncate text-[14px] text-ink-500">{user?.email}</p>
              {user ? (
                <p className="mt-0.5 text-[12px] text-ink-400">
                  Joined {formatFriendlyDate(user.createdAt).toLowerCase()}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-cream-300 pt-4">
            <Input
              label="Display name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
              }}
              error={nameError}
              leadingIcon={<User className="size-4" />}
            />
            <Button
              variant="secondary"
              size="md"
              className="mt-3"
              onClick={saveName}
              disabled={name.trim() === user?.name}
            >
              Save name
            </Button>
          </div>
        </Card>

        {/* ---- Stats ---------------------------------------------- */}
        <Card>
          <h2 className="text-[16px] font-bold text-ink-900">Your totals</h2>
          <dl className="mt-3 divide-y divide-cream-300">
            {[
              ["Received", formatNaira(totals.received)],
              ["Spent", formatNaira(totals.spent)],
              ["Remaining", formatNaira(totals.remaining)],
              ["Expenses recorded", String(totals.expenseCount)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2.5">
                <dt className="text-[14px] text-ink-500">{label}</dt>
                <dd className="tabular text-[14px] font-bold text-ink-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* ---- Notifications ------------------------------------- */}
        <Card>
          <CardHeading icon={<Bell className="size-4" />} title="Notifications" />

          <Toggle
            checked={prefs.notificationsEnabled}
            onChange={(notificationsEnabled) =>
              updatePreferences({ notificationsEnabled })
            }
            label="Push notifications"
            description="Get told when money is added or an expense is recorded."
          />

          <Toggle
            checked={prefs.expenseReminders}
            onChange={(expenseReminders) =>
              updatePreferences({ expenseReminders })
            }
            label="Expense reminders"
            description="A nudge if you haven't recorded anything today."
          />

          <Toggle
            checked={prefs.moneyAddedAlerts}
            onChange={(moneyAddedAlerts) =>
              updatePreferences({ moneyAddedAlerts })
            }
            label="Money added alerts"
            description="Know the moment a fund's balance goes up."
          />

          <Toggle
            checked={prefs.weeklySummary}
            onChange={(weeklySummary) => updatePreferences({ weeklySummary })}
            label="Weekly summary"
            description="One recap of the household's week every Sunday."
          />
        </Card>

        {/* ---- Privacy -------------------------------------------- */}
        <Card>
          <CardHeading
            icon={<ShieldCheck className="size-4" />}
            title="Privacy"
          />

          <Toggle
            checked={prefs.shareReportsByLink}
            onChange={(shareReportsByLink) =>
              updatePreferences({ shareReportsByLink })
            }
            label="Allow shareable reports"
            description="Lets Fundly build a summary you can send on. Your data still stays on this device."
          />

          <Toggle
            checked={prefs.showProfilePhoto}
            onChange={(showProfilePhoto) =>
              updatePreferences({ showProfilePhoto })
            }
            label="Show profile photo"
            description="Uses your initials — Fundly never uploads an image."
          />
        </Card>

        {/* ---- Data & session ------------------------------------- */}
        <Card>
          <h2 className="text-[16px] font-bold text-ink-900">Data</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-ink-600">
            Everything is stored on this device. Fundly never connects to a
            bank or sends your data anywhere.
          </p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<RotateCcw className="size-4" />}
              onClick={() => setConfirmReset(true)}
            >
              Reset demo data
            </Button>
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Download className="size-4" />}
              onClick={() =>
                toast.info("Export isn't available in this prototype")
              }
            >
              Export data
            </Button>
          </div>
        </Card>

        <Button
          variant="danger"
          size="lg"
          fullWidth
          leftIcon={<LogOut className="size-5" />}
          onClick={handleSignOut}
        >
          Log out
        </Button>

        <p className="pb-2 text-center text-[12px] text-ink-400">
          Fundly · Household spending made clear
        </p>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirmReset(false);
          toast.success("Demo data restored", "Everything is back to the start.");
        }}
        title="Reset all data?"
        message="Every fund, expense and notification on this device will be replaced with the original sample data. This cannot be undone."
        confirmLabel="Reset everything"
        icon={<RotateCcw className="size-5" />}
      />
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

function CardHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span aria-hidden="true" className="text-forest-700">
        {icon}
      </span>
      <h2 className="text-[16px] font-bold text-ink-900">{title}</h2>
    </div>
  );
}