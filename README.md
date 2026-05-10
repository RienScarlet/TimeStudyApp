# Time Study V2

A single-file, offline-first industrial time study app — built with plain HTML, CSS, and JavaScript. No server, no dependencies to install, no accounts. Hosted on GitHub Pages and installable as a PWA on Android and iOS.

---

## Live App

**[Open Time Study V2 →]([https://your-username.github.io/your-repo-name/TimeStudyApp_V2.html](https://rienscarlet.github.io/TimeStudyApp/TimeStudyApp_V2.html))**

---

## Features

- **Live Timers** — start, pause, and stop timed sessions per activity
- **Manual Entry** — log entries with custom start/end times
- **Activity Log** — searchable, filterable history of all entries
- **Summary & Charts** — per-activity breakdowns and visual charts
- **Notes** — a freeform study notes pad, auto-saved
- **Multi-Profile & Multi-Study** — separate profiles each with their own studies
- **Recycle Bin** — soft-delete with 30-day recovery window
- **Photo Attachments** — attach photos to sessions and entries (auto-compressed before storage)
- **Export** — CSV, XLSX, and full JSON backup/restore
- **Dark Mode** — Light, Dark, or follow Device setting
- **Offline First** — fully functional with no internet connection after first visit
- **PWA** — installable to your Android or iOS home screen

---

## Installation (Save as PWA)

### Android (Chrome)

1. Open the live app link in **Chrome**
2. Tap the **three-dot menu** (top right)
3. Tap **"Add to Home screen"**
4. Confirm the name and tap **Add**
5. The app icon will appear on your home screen and open in standalone mode (no browser UI)

### iOS (Safari)

1. Open the live app link in **Safari**
2. Tap the **Share button** (box with arrow at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Confirm the name and tap **Add**

> **Note:** PWA installation requires the app to be served over HTTPS. GitHub Pages provides this automatically.

---

## Offline Use

The app uses a Service Worker to cache itself after the first visit. Once cached:

- All features work with no internet connection
- All data is saved locally in your browser's `localStorage`
- XLSX export requires the app to have been opened online at least once (the library is cached on first load); CSV and JSON export work fully offline at all times

A small **"● Offline"** pill appears in the bottom-right corner when you are not connected.

---

## File Structure

```
/
├── TimeStudyApp_V2.html   # The entire app — one self-contained file
├── manifest.json          # PWA manifest (name, icons, shortcuts)
├── sw.js                  # Service worker (offline caching strategy)
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## Data & Storage

All data is stored in your browser's `localStorage` under the key `timeStudyDb_v2`. Nothing is sent to any server.

| Type | Storage |
|---|---|
| Time entries, activities, notes | `localStorage` |
| Photos | `localStorage` as compressed JPEG (max 1024px, ~150–300 KB each) |
| Backup / restore | JSON export and import |

**Storage limit:** Browsers typically allow 5–10 MB of localStorage. Photos are automatically compressed before saving so you can store approximately 20–30 images before approaching the limit. A warning appears in the app when storage exceeds 7 MB.

To free space: export a JSON backup, then delete old entries or photos from within the app.

---

## Caching Strategy (`sw.js`)

| Asset type | Strategy |
|---|---|
| App shell (HTML, manifest, icons) | Cache-first, revalidate in background |
| CDN assets (XLSX library) | Cache-first, network fallback, pre-warmed at install |
| All other requests | Pass-through (not intercepted) |

The service worker automatically clears outdated caches when a new version is deployed.

---

## Updating the App

When a new version of `TimeStudyApp_V2.html` is pushed to GitHub, the service worker detects the change and shows an **"🔄 A new version is available"** banner at the bottom of the screen. Tap **Update** to apply it immediately, or **Later** to apply it on the next launch.

---

## Browser Compatibility

| Browser | Supported |
|---|---|
| Chrome (Android) | ✅ Full PWA support |
| Safari (iOS 16.4+) | ✅ Full PWA support |
| Firefox (Android) | ✅ App works; PWA install limited |
| Desktop Chrome / Edge | ✅ Full support |
| Desktop Safari | ✅ App works; PWA install via Safari 17+ |

---

## Development

The entire app is a single HTML file — no build step, no package manager, no framework.

To run locally:

```bash
# Any static file server works, e.g.:
npx serve .
# Then open http://localhost:3000/TimeStudyApp_V2.html
```

> Opening `TimeStudyApp_V2.html` directly as a `file://` URL will work for most features, but the Service Worker will not register (service workers require HTTP/HTTPS). Use a local server to test offline behaviour.

---

## License

MIT — do whatever you like with it.
