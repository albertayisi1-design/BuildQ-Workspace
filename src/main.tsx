import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale service workers in development to prevent module interception
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[PWA] Unregistered stale dev service worker:', registration.scope);
          }
        });
      }
    }).catch((err) => {
      console.warn('[PWA] Service worker cleanup warning:', err);
    });
  } catch (e) {
    console.warn('[PWA] Service worker check warning:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
