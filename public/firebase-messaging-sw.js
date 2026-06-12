importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyCGlmY-ior7xqv_-4PiQcs1CoePb7IDM90',
  authDomain:        'collegepanel-1027b.firebaseapp.com',
  projectId:         'collegepanel-1027b',
  messagingSenderId: '335340683871',
  appId:             '1:335340683871:web:1cefa2dd4fc3ade75bd1ea',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification?.title || 'EV Rental',
    {
      body: payload.notification?.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data || {},
    }
  );
});
