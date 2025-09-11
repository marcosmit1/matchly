// Push notification service worker

self.addEventListener("push", function (event) {
  console.log("Push event received:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log("📱 Push data parsed:", data);
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const title = data.title || "PongBros";
  const body = data.body || "";
  const url = data.url || "/";
  const image = data.image;
  const tag = data.tag || "default";

  const options = {
    body: body,
    icon: "/app-logo.png",
    badge: "/app-logo.png",
    tag: tag,
    data: {
      url: url,
      notificationId: data.notificationId,
    },
    actions: [
      {
        action: "open",
        title: "Open App",
        icon: "/app-logo.png",
      },
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  if (image) {
    options.image = image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";
  
  console.log("📱 Notification click - URL to open:", urlToOpen);
  console.log("📱 Base URL:", self.location.origin);
  console.log("📱 Full URL:", self.location.origin + urlToOpen);

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        console.log("📱 Existing clients:", clientList.length);
        
        // First, check if there's already a PWA window open (any page from our app)
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          console.log("📱 Checking client:", client.url);
          
          // If we find our app already open, use postMessage for reliable navigation
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("📱 Found existing PWA window, using postMessage to navigate to:", urlToOpen);
            client.focus();
            
            // Always use postMessage for navigation within existing PWA windows
            // This is more reliable than client.navigate() for SPAs
            client.postMessage({
              type: 'NAVIGATE_TO',
              url: urlToOpen
            });
            
            console.log("📱 Sent navigation message to PWA");
            return Promise.resolve();
          }
        }

        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          const baseUrl = self.location.origin;
          const fullUrl = baseUrl + urlToOpen;
          console.log("📱 No existing PWA found, opening new window:", fullUrl);
          return clients.openWindow(fullUrl);
        } else {
          console.error("📱 clients.openWindow not available");
        }
      })
      .catch(error => {
        console.error("📱 Error handling notification click:", error);
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
  // Could track analytics here if needed
});

// Install event
self.addEventListener("install", function (event) {
  console.log("Push SW installed");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", function (event) {
  console.log("Push SW activated");
  event.waitUntil(clients.claim());
});
