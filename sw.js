const CACHE_NAME = 'pos-v2-珠宝'; // Cambiamos el nombre para forzar la actualización en los dispositivos
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instala el Service Worker y precarga los archivos esenciales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Fuerza a la versión nueva a tomar el control de inmediato
  );
});

// Limpia las versiones de caché antiguas para que no ocupen espacio
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

// ESTRATEGIA: Network First (Intenta internet primero, si falla va a Caché)
self.addEventListener('fetch', (e) => {
  // Ignorar las peticiones externas como las de Google Apps Script o WhatsApp para que no se rompa la sincronización
  if (!e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Si la respuesta es buena, guardamos una copia fresca en el caché
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request)) // Si no hay internet, sirve el archivo local guardado
  );
});
