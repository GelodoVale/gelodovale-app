const CACHE_NAME = 'gelodovale-v175';
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
  'js/carne.js',
  'js/spellcheck.js',
  'js/typo.js',
  'js/help_content.js',
  'js/help.js',
  'js/dictionaries/pt_BR/pt_BR.aff',
  'js/dictionaries/pt_BR/pt_BR.dic'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
  // Ignorar requisições externas como CDNs ou extensões
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = e.request.url;
  const isCacheBusted = url.includes('cb=') || url.includes('nocache') || url.includes('v=76');
  const isNavigation = e.request.mode === 'navigate';

  // Network-First para navegação e requisições com cache-buster (garante código novo ao dar F5)
  if (isCacheBusted || isNavigation) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request, { ignoreSearch: true });
      })
    );
    return;
  }

  // Stale-While-Revalidate para outros arquivos estáticos
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(e.request, { cache: 'no-cache' }).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(e.request, networkResponse);
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(e.request);
      });
    })
  );
});
