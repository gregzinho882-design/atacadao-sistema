const CACHE_STATIC = "atacadao-static-v2";
const CACHE_API = "atacadao-api-v2";

const STATIC_ASSETS = ["/", "/manifest.json", "/logo-atacadao.png", "/icon-pwa.png"];
const API_CACHEABLE = ["/api/stock-items", "/api/product-codes"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then((c) => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_API)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isApiCacheable = API_CACHEABLE.some((p) => url.pathname === p);

  if (isApiCacheable) {
    e.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        try {
          const fresh = await fetch(e.request);
          if (fresh && fresh.status === 200) {
            cache.put(e.request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await cache.match(e.request);
          return cached || new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" },
          });
        }
      })
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title || "Atacadão Frios", {
      body: data.body || "",
      icon: "/icon-pwa.png",
      badge: "/icon-pwa.png",
    })
  );
});
