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

// Listen for orientation changes
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Handle screen.orientation API (modern browsers and Android PWA)
if (screen.orientation) {
  try {
    screen.orientation.addEventListener('change', () => {
      const orientation = screen.orientation.type;
      console.log('Screen orientation changed to:', orientation);
      handleOrientationChange();
    });
  } catch (e) {
    console.warn('Could not set up screen orientation listener:', e);
  }
}

// Request fullscreen orientation handling (Android PWA specific)
window.addEventListener('resize', () => {
  // Ensure layout updates on resize
  document.documentElement.style.height = window.innerHeight + 'px';
  document.documentElement.style.width = window.innerWidth + 'px';
});

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
