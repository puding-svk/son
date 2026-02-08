import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Handle orientation changes
const handleOrientationChange = () => {
  // Force layout recalculation by triggering a resize event
  window.dispatchEvent(new Event('resize'));
  
  // Force reflow by accessing scrollHeight
  document.documentElement.scrollHeight;
  
  // Log orientation for debugging
  console.log('Orientation changed:', window.innerWidth, 'x', window.innerHeight);
};

window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Handle screen.orientation API (modern browsers)
if (screen.orientation) {
  screen.orientation.addEventListener('change', () => {
    console.log('Screen orientation:', screen.orientation.type);
    handleOrientationChange();
  });
}

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
