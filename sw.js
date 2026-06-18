const CACHE = "predictor-restore-v3";

// JS e HTML: network-first (evita cache antigo sem previsões)
const NETWORK_FIRST = ["/js/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/.netlify/functions/")) return;

  const url = e.request.url;
  const networkFirst = NETWORK_FIRST.some(p => url.includes(p));

  if (networkFirst) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (res.ok && url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
