// PlantPal - Service Worker
// این فایل مسئول کش کردن فایل‌ها و نمایش نوتیفیکیشن است.

const CACHE_NAME = 'plantpal-v13';

const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/rtl.css',
  './css/components.css',
  './js/lib/chart.umd.min.js',
  './js/database.js',
  './js/i18n.js',
  './js/theme.js',
  './js/date.js',
  './js/icons.js',
  './js/ui.js',
  './js/plants.js',
  './js/care.js',
  './js/notes.js',
  './js/dashboard.js',
  './js/notifications.js',
  './js/reports.js',
  './js/settings.js',
  './js/app.js',
  './assets/images/default-plant.png',
  './assets/icons/icon-512.png',
  './assets/icons/leaf.svg',
  './assets/icons/settings.svg',
  './assets/icons/arrow-left.svg',
  './assets/icons/x.svg',
  './assets/icons/health-healthy.svg',
  './assets/icons/health-growing.svg',
  './assets/icons/health-warning.svg',
  './assets/icons/health-sick.svg',
  './assets/icons/magnifying-glass.svg',
  './assets/icons/funnel.svg'
];

self.addEventListener('install', function(event) {
  console.log('✓ Service Worker در حال نصب...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('✓ فایل‌ها کش شدند');
      return cache.addAll(CACHE_FILES);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('✓ Service Worker فعال شد');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('✓ کش قدیمی حذف شد:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('./');
    })
  );
});