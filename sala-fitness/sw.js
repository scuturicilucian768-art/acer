// Service worker: aplicația pornește repede, merge și cu semnal slab, și primește notificări push.
// Căile sunt relative la locul aplicației, ca să meargă și într-un subfolder.
const C = 'gym-v3';
const B = new URL('./', self.location).pathname;
const SHELL = ['app.html', 'app.css', 'common.js', 'core.js', 'seed.js', 'env.js', 'fig.js', 'qr.js', 'img/icon-192.png'].map((x) => B + x);
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x.startsWith('gym-') && x !== C).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && SHELL.includes(u.pathname)) { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || caches.match(B + 'app.html'))));
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data.json(); } catch { d = { title: 'Sala ta', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Sala ta', { body: d.body || '', icon: B + 'img/icon-192.png', badge: B + 'img/badge-72.png', tag: d.tag || 'gym', renotify: true, data: { url: d.url ? new URL(d.url.replace(/^\//, ''), self.registration.scope).href : B + 'app.html' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || B + 'app.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => { const w = l.find((c) => new URL(c.url).pathname.includes('app')); return w ? (w.navigate(url).catch(() => {}), w.focus()) : self.clients.openWindow(url); }));
});
