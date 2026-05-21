import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging = null;

const getMessagingInstance = () => {
  if (!messaging) messaging = getMessaging(app);
  return messaging;
};

/**
 * Register service worker + get FCM token
 */
export const requestFcmToken = async () => {
  try {
    // 1. Check browser support
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return null;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn('Browser does not support service workers');
      return null;
    }

    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission:', permission);
      return null;
    }

    // 3. Register service worker explicitly
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    // 4. Get FCM token
    const msg = getMessagingInstance();
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!token) {
      console.warn('No FCM token received');
      return null;
    }

    return token;
  } catch (err) {
    console.error('FCM token error:', err.message);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback) => {
  try {
    const msg = getMessagingInstance();
    return onMessage(msg, (payload) => {
      // Show native notification even when app is open
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'EV Rental', {
          body: payload.notification?.body || '',
          icon: '/favicon.svg',
        });
      }
      if (callback) callback(payload);
    });
  } catch (err) {
    console.error('onForegroundMessage error:', err.message);
    return () => {};
  }
};
