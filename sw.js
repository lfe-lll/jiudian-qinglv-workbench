const CACHE_NAME = 'hotel-workbench-v7';
const ASSETS = [
  './',
  './index.html',
  './hotel-operator-workbench.html',
  './manifest.json',
  './assets/charts.js',
  './_shared/js/echarts.min.js',
  './_shared/fonts/InstrumentSans-Regular.ttf',
  './_shared/fonts/InstrumentSans-Bold.ttf',
  './_shared/fonts/JetBrainsMono-Regular.ttf'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).catch(function() {
      // 本地文件模式下缓存可能失败，静默处理
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) {
        return n !== CACHE_NAME;
      }).map(function(n) {
        return caches.delete(n);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request).catch(function() {
        // 离线时返回缓存或静默失败
        return new Response('');
      });
    })
  );
});
