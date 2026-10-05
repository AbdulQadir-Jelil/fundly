"use client";

import { useState } from "react";
import { Crown, Trash2, UserPlus, Users } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { formatRelativeLabel } from "@/lib/date";
import { getHouseholdTotals } from "@/lib/selectors";
import { useFundly } from "@/lib/store";
import { AppShell } from "@/components/navigation/AppShell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Input,
  Modal,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  hasErrors,
  validateInvite,
  type InviteValues,
  type ValidationErrors,
} from "@/lib/validations";
import type { HouseholdMember } from "@/types";

const EMPTY: InviteValues = { name: "", relationship: "" };

export default function HouseholdPage() {
  const { data, hydrated, inviteMember, removeMember } = useFundly();
  const toast = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [values, setValues] = useState<InviteValues>(EMPTY);
  const [errors, setErrors] = useState<ValidationErrors<keyof InviteValues>>({});
  const [saving, setSaving] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<HouseholdMember | null>(null);

  const totals = getHouseholdTotals(data);

  function openInvite() {
    setValues(EMPTY);
    setErrors({});
    setInviteOpen(true);
  }

  async function submitInvite() {
    if (saving) return;

    const found = validateInvite(values);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    try {
      await inviteMember(values.name, values.relationship);
      toast.success(
        `${values.name.trim()} added`,
        "They can now see the household.",
      );
      setInviteOpen(false);
    } catch {
      toast.error("Couldn't add that member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Household">
      <div className="flex flex-col gap-5">
        {/* ---- Summary -------------------------------------------- */}
        <Card>
          <div className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700"
            >
              <Users className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-bold text-ink-900">
                {data.household?.name ?? "Your household"}
              </h2>
              <p className="tabular mt-1 text-[14px] text-ink-600">
                {formatNaira(totals.received)} received ·{" "}
                {formatNaira(totals.spent)} spent across {data.funds.length}{" "}
                {data.funds.length === 1 ? "fund" : "funds"}
              </p>
            </div>
          </div>
        </Card>

        {/* ---- Members -------------------------------------------- */}
        <section>
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className="text-[16px] font-bold text-ink-900">
              Members ({data.members.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<UserPlus className="size-4" />}
              onClick={openInvite}
            >
              Add
            </Button>
          </div>

          {!hydrated ? (
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (
            <ul className="stagger flex flex-col gap-2.5">
              {data.members.map((member) => {
                const isOwner = member.role === "owner";
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3.5 rounded-2xl border border-cream-300 bg-white p-4"
                  >
                    <Avatar name={member.name} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-bold text-ink-900">
                          {member.name}
                        </p>
                        {isOwner ? (
                          <Crown
                            className="size-3.5 shrink-0 text-butter-500"
                            aria-label="Household owner"
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-ink-500">
                        {member.relationship ?? "Member"} · joined{" "}
                        {formatRelativeLabel(member.joinedAt).toLowerCase()}
                      </p>
                    </div>

                    {isOwner ? (
                      <Badge tone="neutral">Owner</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => setPendingRemove(member)}
                        className="shrink-0 px-2.5 text-danger-600 hover:bg-danger-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---- Household totals ---------------------------------- */}
        <Card>
          <h2 className="text-[16px] font-bold text-ink-900">
            Household totals
          </h2>
          <dl className="mt-3 divide-y divide-cream-300">
            {[
              ["Total received", formatNaira(totals.received), "text-sage-600"],
              ["Total spent", formatNaira(totals.spent), "text-peach-700"],
              [
                "Still available",
                formatNaira(totals.remaining),
                "text-forest-800",
              ],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex justify-between gap-3 py-2.5">
                <dt className="text-[14px] text-ink-500">{label}</dt>
                <dd className={`tabular text-[14px] font-bold ${tone}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        values={values}
        errors={errors}
        saving={saving}
        onChange={(next, field) => {
          setValues(next);
          setErrors((current) => ({ ...current, [field]: undefined }));
        }}
        onSubmit={submitInvite}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          removeMember(pendingRemove.id);
          toast.info(`${pendingRemove.name} removed`);
          setPendingRemove(null);
        }}
        title="Remove this member?"
        message={`${pendingRemove?.name ?? "They"} will no longer appear in your household. Their recorded expenses stay in place.`}
        confirmLabel="Remove member"
        icon={<Trash2 className="size-5" />}
      />
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Invite dialog                                                             */
/* -------------------------------------------------------------------------- */

function InviteModal({
  open,
  onClose,
  values,
  errors,
  saving,
  onChange,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  values: InviteValues;
  errors: ValidationErrors<keyof InviteValues>;
  saving: boolean;
  onChange: (values: InviteValues, field: keyof InviteValues) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a household member"
      description="They'll be able to see the funds and expenses you track."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={saving} loadingText="Adding…">
            Add member
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <Input
          label="Full name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value }, "name")}
          error={errors.name}
          placeholder="e.g. Aisha Johnson"
          data-autofocus
          required
        />

        <Input
          label="Relationship"
          value={values.relationship}
          onChange={(event) =>
            onChange({ ...values, relationship: event.target.value }, "relationship")
          }
          error={errors.relationship}
          hint="A neutral label, e.g. Partner, Roommate or Daughter."
          placeholder="Partner"
          required
        />

        {/* Lets Enter submit from inside the dialog form. */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  );
}