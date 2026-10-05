/* eslint-disable no-restricted-globals */
/**
 * Fundly service worker.
 *
 * Fundly keeps its data in localStorage, so the offline story is mostly about
 * the shell: once installed, the app must open and show real data even with no
 * connection. Three caching layers:
 *
 *   1. Precache  — the offline page and the icon set, on install.
 *   2. Navigations — network first, falling back to the cached shell, then to
 *      the offline page. Keeps content fresh while staying usable offline.
 *   3. Static assets — stale-while-revalidate, so icons and scripts load
 *      instantly and quietly update in the background.
 */

const VERSION = "v1";
const SHELL_CACHE = `fundly-shell-${VERSION}`;
const ASSET_CACHE = `fundly-assets-${VERSION}`;
const RUNTIME_CACHE = `fundly-runtime-${VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

/* -------------------------------------------------------------------------- */
/*  Install / activate                                                        */
/* -------------------------------------------------------------------------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individual failures must not abort the whole install.
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline: try the exact page, then the app shell, then the offline page.
    const cached = await caches.match(request);
    if (cached) return cached;

    const shell = await caches.match("/offline");
    if (shell) return shell;

    return new Response(
      "<!doctype html><meta charset=\"utf-8\"><title>Fundly — Offline</title>" +
        '<body style="font-family:system-ui;padding:2rem;text-align:center">' +
        "<h1>You are offline</h1><p>Reconnect to open Fundly.</p></body>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type !== "opaque") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  // Respond immediately from cache when we have it; refresh in the background.
  return cached ?? (await network) ?? Response.error();
}

/* -------------------------------------------------------------------------- */
/*  Fetch                                                                     */
/* -------------------------------------------------------------------------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never interfere with non-GET traffic or cross-origin calls.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, cache + offline page as fallbacks.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Next.js build assets and static files: hashed, so safe to serve stale.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|jpe?g|svg|webp|ico)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});

/* -------------------------------------------------------------------------- */
/*  Messages                                                                  */
/* -------------------------------------------------------------------------- */

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
