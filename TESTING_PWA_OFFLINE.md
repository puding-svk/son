# Testing the PWA Offline Functionality

## Prerequisites
- Build the project: `npm run build`
- Serve the dist folder on localhost or a test server

## Testing Scenarios

### Scenario 1: Offline Mode in Desktop Chrome DevTools

1. **Open the app while online**
   - Navigate to http://localhost:5173 (or your test server)
   - Wait for service worker to register (check browser console)

2. **Go offline in DevTools**
   - Open DevTools (F12)
   - Go to Network tab
   - Check the "Offline" checkbox
   - Reload the page (Ctrl+R or Cmd+R)

3. **Expected behavior**
   - ❌ If the offline.html page loads: This means all assets failed to load
   - ✅ If the form loads normally: Assets are cached and working

4. **Verify form functionality offline**
   - Try filling out the form
   - Try drawing on the situation canvas
   - Try exporting to PDF (should work as template and font are cached)
   - Try signatures (should work)
   - Data should auto-save to localStorage

### Scenario 2: Android PWA Installation

1. **Install the app**
   - Open Chrome browser on Android
   - Navigate to the app URL
   - Long-press the address bar area
   - Select "Add to Home screen"
   - Choose a name and confirm

2. **Test offline access**
   - Disable WiFi and mobile data
   - Open the app from home screen
   - Wait 2-3 seconds for it to fully load

3. **Expected behavior**
   - ✅ Form loads with all fields visible and functional
   - ✅ All controls respond to input
   - ✅ No error messages appear
   - ✅ Data can be entered and saved

4. **Troubleshooting if QR modal appears**
   - Check browser console logs: "App started in offline mode" should appear
   - Try waiting longer (service worker sometimes takes time to activate)
   - Pull-to-refresh and wait again
   - If persistent, hard-refresh by manipulating the URL (click address bar, click go)

### Scenario 3: Service Worker Verification

1. **Check service worker registration**
   - Open DevTools Console tab
   - Should see: "Service Worker registered successfully"
   - Or a registration error

2. **Check cached assets**
   - Go to Application → Cache Storage
   - Look for "accident-report-v1" cache
   - Should contain:
     - `/son/sprava_o_nehode_template.pdf`
     - `/son/fonts/NimbusSanL-Bol.otf`
     - `/son/impactMarker-background.png`
     - `/son/applogo.svg`
     - `/son/offline.html`

3. **Monitor network requests**
   - Network tab → go offline and reload
   - Should see assets loaded from "(service worker)" source
   - Should not see network errors (red icons)

### Scenario 4: Cold Start Offline (No Prior Visit)

1. **Clear all caches and site data**
   - Application → Clear site data
   - Delete service worker

2. **Try to access app while offline**
   - Expected: offline.html should load
   - Expected: Message: "The app is currently offline. Please check your internet connection."
   - This is normal - first visit must be online to cache assets

3. **Go back online and reload**
   - Assets should now cache properly
   - Follow Scenario 1 or 2 again

## Debug Commands

### Check service worker status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
```

### Force update service worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
```

### Check cached assets
```javascript
// In browser console
caches.keys().then(names => {
  Promise.all(names.map(name => 
    caches.open(name).then(cache => 
      cache.keys().then(keys => console.log(name, keys))
    )
  ));
});
```

### Monitor online/offline events
```javascript
// In browser console
window.addEventListener('online', () => console.log('🟢 ONLINE'));
window.addEventListener('offline', () => console.log('🔴 OFFLINE'));
console.log('Current status:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
```

## Known Limitations

1. **First visit must be online**
   - Users need to visit while connected once to cache assets
   - Subsequent visits can be fully offline

2. **Large JavaScript bundle**
   - The app JS is ~1.9MB (minified), ~745KB (gzipped)
   - Consider code splitting for faster loads

3. **PDF export offline**
   - Works offline, but only if template and font were cached during online visit
   - QR scanning requires camera (works offline on Android PWA)

## Expected Error Messages (These are OK)

- "Offline - Resource not available" - For resources not in cache
- Service Worker console warnings about failed asset caching - Handled gracefully
- Network tab showing red 503 errors for uncached requests - Normal fallback behavior

## Success Indicators

✅ Form loads offline without QR modal appearing
✅ All buttons and inputs respond immediately
✅ Canvas drawing tools work offline
✅ Signatures can be captured offline
✅ Data persists in localStorage
✅ PDF export works offline (using cached template)
✅ Reload app works from offline.html page when fully offline
