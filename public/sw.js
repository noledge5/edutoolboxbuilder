// Offline support: keeps the app (page, scripts, styles, fonts, icons) in a cache so it also opens without internet.
// Registered with ?v=<build id>, so every deployment installs a fresh copy and removes the old one.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'baukasten-' + VERSION;
const CORE = ['./', './manifest.webmanifest', './favicon.svg', './icons/icon-192.png', './icons/apple-touch-icon.png'];

/** The hashed build files the page needs: scripts and styles from index.html, fonts from the styles. */
async function buildFiles() {
  const html = await (await fetch('./', { cache: 'no-store' })).text();
  const files = [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => './' + m[1]);
  for (const css of files.filter((f) => f.endsWith('.css'))) {
    const text = await (await fetch(css)).text();
    for (const m of text.matchAll(/url\(\.?\/?([^)'"]+\.woff2)\)/g)) files.push('./assets/' + m[1].split('/').pop());
  }
  return [...new Set(files)];
}

/** Scripts and styles loaded only on demand (PDF import, PowerPoint, AI, …), from the build manifest. */
async function lazyFiles() {
  try {
    const manifest = await (await fetch('./assets/manifest.json', { cache: 'no-store' })).json();
    const files = Object.values(manifest).flatMap((c) => [c.file, ...(c.css || [])]);
    return [...new Set(files)].filter((f) => /^assets\/[^/]+\.(m?js|css)$/.test(f)).map((f) => './' + f);
  } catch {
    return [];
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      await cache.addAll(await buildFiles());
      // Best effort: one missing on-demand file must not cost the whole offline copy.
      await Promise.allSettled((await lazyFiles()).map((f) => cache.add(f)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/assets/')) {
    // Hashed file names never change: cache first.
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }
  // Page and other files: the network when online (so updates arrive), the cache when offline.
  // Each page is kept under its own address, so the student view (a/) or Lernquest never replaces the Baukasten.
  const page = url.origin + url.pathname;
  const isRoot = url.pathname === new URL('./', self.location.href).pathname;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode === 'navigate') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(page, copy));
        }
        return res;
      })
      .catch(
        async () =>
          (await caches.match(req, { ignoreSearch: true })) ||
          (req.mode === 'navigate' ? (await caches.match(page)) || (isRoot ? caches.match('./') : Response.error()) : Response.error()),
      ),
  );
});
