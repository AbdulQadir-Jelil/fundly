"use client";

import { useEffect } from "react";

/**
 * Registers the Fundly service worker.
 *
 * Registration is intentionally deferred until after `load` so it never
 * competes with the first render, and is skipped in development where
 * caching would fight hot reloading.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Registration failed (private mode, unsupported). The app still
          // works online — it just loses offline support.
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}