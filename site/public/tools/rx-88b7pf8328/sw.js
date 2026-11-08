/* Offline cache for the protected compendium.
 * It caches one thing: the ENCRYPTED index.html the server sends (never decrypted content; fonts are embedded).
 * The worker shares its origin with the rest of the site, so it ignores every other URL and never deletes
 * caches that are not its own. Page: network first, cache fallback, so updates arrive whenever online. */
const PREFIX = "pso-compendium-";
const CACHE = PREFIX + "v2";
const PAGE = new URL("./", self.location.href).href;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([PAGE])).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("authorization")) return;
  const url = new URL(req.url);
  if (url.search || (url.href !== PAGE && url.href !== PAGE + "index.html")) return;
  e.respondWith(fetch(req).then((res) => {
    const cc = (res.headers && res.headers.get("cache-control")) || "";
    if (res.ok && res.type === "basic" && !res.redirected && !/\b(?:no-store|private)\b/i.test(cc)) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(PAGE, copy)).catch(() => {});
    }
    return res;
  }).catch(() => caches.match(PAGE).then((hit) => hit || new Response("Offline and not cached yet.", { status: 503 }))));
});
