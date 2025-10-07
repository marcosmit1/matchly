// Service Worker to help with page persistence
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('matchly-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/app-logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if we have one
      if (response) {
        return response;
      }

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = response.clone();

        caches.open('matchly-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle page visibility changes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VISIBILITY_CHANGE') {
    // If the page is becoming visible again, prevent reload
    if (event.data.state === 'visible') {
      event.preventDefault();
    }
  }
});