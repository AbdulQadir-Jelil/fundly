"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/navigation/Nav";

/**
 * Shared auth frame.
 *
 * Uses the "hill" decoration from the design system: a soft cream backdrop on
 * desktop, a compact card on mobile, and the ₦ mark as the anchor so the
 * brand is present on both.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-cream-200">
      {/* Decorative hills — hidden on small screens where space is tight. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="hill-back absolute -right-24 -top-24 size-[380px] rounded-full opacity-70 sm:right-[-6%] sm:top-[-12%]" />
        <div className="hill-front absolute -bottom-32 -left-24 size-[420px] rounded-full opacity-60 sm:left-[-8%]" />
      </div>

      <div className="relative flex w-full flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        {/* Brand */}
        <Link
          href="/"
          className="mx-auto flex shrink-0 items-center gap-2.5 sm:mx-0"
        >
          <BrandMark />
          <span className="text-[17px] font-extrabold text-forest-900">
            Fundly
          </span>
        </Link>

        <main
          id="main"
          className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
              {subtitle}
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-cream-400 bg-white p-5 shadow-card sm:p-6">
            {children}
          </div>

          <div className="mt-6 text-center text-[14px] text-ink-600 sm:text-left">
            {footer}
          </div>
        </main>

        <p className="shrink-0 text-center text-[12px] text-ink-400">
          Fundly · Household spending made clear
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form-level error banner                                                   */
/* -------------------------------------------------------------------------- */

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3 text-[14px] font-medium text-danger-700"
    >
      {message}
    </div>
  );
}