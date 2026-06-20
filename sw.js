// ── SERVICE WORKER ──
self.addEventListener('install', (e) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
  });
  
  // listen for messages from the app
  self.addEventListener('message', (e) => {
    if (e.data.type === 'SCHEDULE_NOTIFICATION') {
      const { delay, title, body, tag } = e.data.payload;
  
      // schedule the notification after the delay
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          tag,
          icon: '/icon.png',
          badge: '/icon.png',
          vibrate: [200, 100, 200],
        });
      }, delay);
    }
  });