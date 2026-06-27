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
      // Create a beautiful In-App Toast Notification
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.backgroundColor = '#1e293b';
      toast.style.color = '#fff';
      toast.style.padding = '16px 20px';
      toast.style.borderRadius = '12px';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
      toast.style.zIndex = '99999';
      toast.style.display = 'flex';
      toast.style.flexDirection = 'column';
      toast.style.gap = '4px';
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
      toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      toast.style.cursor = 'pointer';

      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">🔔</span>
          <strong style="font-size: 15px;">${payload.notification?.title || 'New Notification'}</strong>
        </div>
        <div style="font-size: 13px; color: #cbd5e1; margin-left: 28px;">
          ${payload.notification?.body || ''}
        </div>
      `;

      // Click to dismiss
      toast.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
      };

      document.body.appendChild(toast);

      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      }, 100);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(20px)';
          setTimeout(() => {
            if (document.body.contains(toast)) toast.remove();
          }, 300);
        }
      }, 5000);

      // Also try to show native notification
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(payload.notification?.title || 'TRIS Electric', {
            body: payload.notification?.body || '',
            icon: '/favicon.svg',
          });
        });
      }
      if (callback) callback(payload);
    });
  } catch (err) {
    console.error('onForegroundMessage error:', err.message);
    return () => {};
  }
};

