const CACHE_NAME = 'capoeira-system-v6';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',

  './icons/icon-v2-192.png',
  './icons/icon-v2-512.png',

  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',

  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',

  'https://unpkg.com/html5-qrcode',

  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js'
];

// INSTALAÇÃO
self.addEventListener('install', event => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ATIVAÇÃO
self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })
      );

    }).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);

  // Ignora extensões
  if (
    requestURL.protocol === 'chrome-extension:' ||
    requestURL.protocol === 'edge-extension:'
  ) {
    return;
  }

  event.respondWith(

    caches.match(event.request)
      .then(cachedResponse => {

        // CACHE PRIMEIRO
        if (cachedResponse) {
          return cachedResponse;
        }

        // INTERNET
        return fetch(event.request)
          .then(networkResponse => {

            // Resposta inválida
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });

            return networkResponse;

          })
          .catch(() => {

            // FALLBACK OFFLINE
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }

          });

      })
  );
});