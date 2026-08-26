/* Plug and Go service worker — cache only a safe static shell.
 * Never treat live station status, prices, account, or auth responses as fresh while offline.
 */
const SHELL_CACHE = "png-shell-v1";
const STATIC_CACHE = "png-static-v1";
const OFFLINE_URL = "/offline";

const PRIVATE_PREFIXES = [
  "/account",
  "/vehicles",
  "/saved-stations",
  "/login",
  "/bookings",
  "/payments",
  "/invoices",
  "/session",
  "/api/account",
  "/api/auth",
  "/api/admin",
  "/api/bookings",
  "/api/payments",
  "/api/invoices",
  "/api/sessions",
  "/api/realtime",
  "/ops",
  "/technician",
  "/partner",
  "/fleet",
  "/api/ops",
  "/status",
  "/api/health",
];

function isPrivate(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function isApi(pathname) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url.pathname) || isApi(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match(OFFLINE_URL).then((cached) => cached || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon") {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
