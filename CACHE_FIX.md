# Cache Fix Instructions

## Quick Fix: Hard Refresh Browser

1. **Chrome/Edge**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. **Firefox**: Press `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows/Linux)
3. **Safari**: Press `Cmd+Option+R` (Mac)

## Clear Browser Cache Completely

### Chrome/Edge:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Firefox:

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Keep DevTools open while developing

### Safari:

1. Safari > Preferences > Advanced
2. Check "Show Develop menu"
3. Develop > Empty Caches
4. Then hard refresh

## Disable Service Workers (if any)

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in left sidebar
4. Click "Unregister" for any service workers

## Next.js Dev Server Cache

The config has been updated to disable caching in development. After making changes:

1. Restart the dev server: Stop it (Ctrl+C) and run `npm run dev` again
2. The server will now send `Cache-Control: no-store` headers

## If Still Having Issues

1. Close all browser tabs with your app
2. Clear browser cache completely
3. Restart the dev server
4. Open a new incognito/private window
5. Navigate to your app
