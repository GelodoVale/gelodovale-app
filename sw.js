const CACHE_NAME = 'gelodovale-v151';
const ASSETS = [
  'index.html',
  'form.html',
  'styles.css',
  'manifest.json',
  'gelcontrol.ico',
  'logo_vertical.png',
  'logo_horizontal.jpg',
  'js/app.js',
  'js/state.js',
  'js/whatsapp.js',
  'js/notifications.js',
  'js/auth.js',
  'js/dashboard.js',
  'js/clientes.js',
  'js/inventario.js',
  'js/rentals.js',
  'js/documents.js',
  'js/logistics.js',
  'js/comodatos.js',
  'js/layout.js',
  'js/admin.js',
  'js/sync.js',
  'js/utils.js',
  'js/storage.js',
  'js/widgets.js',
  'js/pdv.js',
  'js/diagnostics.js',
  'js/carne.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force fetch with cache: 'reload' to bypass browser HTTP cache and get fresh copies
      const requests = ASSETS.map(url => new Request(url, { cache: 'reload' }));
      return cache.addAll(requests);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Ignorar requisições externas como CDNs ou de extensão do chrome
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // Scope match exclusively to the current active cache
      return cache.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Atualizar cache em segundo plano (stale-while-revalidate) com cache: 'no-cache'
          fetch(e.request, { cache: 'no-cache' }).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(e.request, networkResponse);
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(e.request);
      });
    }).catch(() => {
      if (e.request.mode === 'navigate') {
        return caches.open(CACHE_NAME).then((cache) => cache.match('index.html'));
      }
    })
  );
});
