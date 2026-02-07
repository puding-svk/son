import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/son/service-worker.js').then(
      (registration) => {
        console.log('Service Worker registered successfully:', registration);
      },
      (error) => {
        console.warn('Service Worker registration failed:', error);
      }
    );
  });
}

