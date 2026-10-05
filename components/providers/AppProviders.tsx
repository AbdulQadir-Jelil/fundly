"use client";

import type { ReactNode } from "react";
import { FundlyProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";

/**
 * Single client boundary for the whole app.
 *
 * Order matters: the store must wrap the toast layer because store actions
 * raise toasts from screens, and the service worker registers last so it never
 * delays first paint.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <FundlyProvider>
      <ToastProvider>
        <ServiceWorkerRegistrar />
        {children}
      </ToastProvider>
    </FundlyProvider>
  );
}