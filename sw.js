    // sw.js - Service Worker para DocenteOS
const CACHE_NAME = 'docenteos-v95-aqua';

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        fetch(e.request).then(res => {
            if (res && res.status === 200 && res.type === 'basic') {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return res;
        }).catch(() => caches.match(e.request))
    );
});

self.addEventListener('push', e => {
    const data = e.data ? e.data.json() : { title: 'DocenteOS', body: 'Tienes tareas próximas' };
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+',
            badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+',
            vibrate: [200, 100, 200]
        })
    );
});
