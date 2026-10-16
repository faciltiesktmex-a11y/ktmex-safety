/* ============================================================
   KTMEX Safety — Service Worker
   Versión de interfaz: 0.3.0

   - Navegación: red primero; la copia guardada solo sirve sin conexión.
   - Archivos de la app: se responde desde caché y se actualiza en segundo plano.
   - El servidor de Apps Script NUNCA se guarda en caché.
   - Al activarse solo borra SUS cachés viejos (prefijo "ktmex-safety-"):
     si este sitio comparte dominio con Facilities en GitHub Pages,
     así no borra la caché de Facilities.
   Cada versión nueva de index.html debe subir el número de CACHE.
   ============================================================ */
const PREFIJO = 'ktmex-safety-';
const CACHE = PREFIJO + 'v4-0.3.0-20261016';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './xlsx-fill.js', './fo015-map.js', './formatos.js',
  './forms/F-SGA-8.1-7.xlsx', './forms/FO-015.xlsx', './forms/FO-014.xlsx', './forms/FO-005.xlsx'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(APP_SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.indexOf(PREFIJO) === 0 && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.indexOf('script.google.com') >= 0 || url.hostname.indexOf('googleusercontent.com') >= 0) return;
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(r => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return r;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
