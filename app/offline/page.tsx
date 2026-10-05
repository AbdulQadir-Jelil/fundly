import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-600"
      >
        <WifiOff className="size-8" />
      </span>

      <h1 className="text-2xl font-bold text-ink-900">You are offline</h1>

      <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-ink-600">
        Fundly needs a connection the first time you open a page. Once the app
        is installed, your funds and expenses stay available without one — they
        are saved on this device.
      </p>

      <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
        <ButtonLink href="/dashboard" variant="primary">
          Try again
        </ButtonLink>
        <ButtonLink href="/funds/new" variant="secondary">
          Create a fund
        </ButtonLink>
      </div>

      <p className="mt-8 text-[13px] text-ink-400">
        Fundly · Household spending made clear
      </p>
    </main>
  );
}