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
};

// Listen for orientation changes
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Handle screen.orientation API (modern browsers and Android PWA)
if (screen.orientation) {
  try {
    screen.orientation.addEventListener('change', () => {
      handleOrientationChange();
    });
  } catch (e) {
    console.warn('Could not set up screen orientation listener:', e);
  }
}

// Try to unlock orientation on Android
const unlockOrientation = async () => {
  if (screen.orientation && screen.orientation.unlock) {
    try {
      await screen.orientation.unlock();
    } catch (e) {
      console.warn('Could not unlock orientation:', e);
    }
  }
};

// Request orientation unlock on load and user interaction
window.addEventListener('load', unlockOrientation);
document.addEventListener('click', unlockOrientation);
document.addEventListener('touchstart', unlockOrientation);

// Update viewport dimensions on resize
window.addEventListener('resize', () => {
  // Ensure layout updates on resize
  document.documentElement.style.height = window.innerHeight + 'px';
  document.documentElement.style.width = window.innerWidth + 'px';
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/son/service-worker.js').catch(
      (error) => {
        console.warn('Service Worker registration failed:', error);
      }
    );
  });
}
