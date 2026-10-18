# Firebase Fleet Manager — Android App (Android 15 & 14 Ready)

This directory contains the native Android project for **Firebase Fleet Manager**, fully engineered and configured to support the latest Android versions (**Android 15 — API 35** and **Android 14 — API 34**).

---

## 🚀 Two Ways to Run on Android

### Option 1: Instant Native PWA Installation (Zero Build Required)
Because we have configured the Web App Manifest, Service Worker, and high-resolution adaptive app icons on GitHub Pages:
1. Open Google Chrome (or any modern Android browser) on your phone.
2. Navigate to: **[https://purushothamanks.github.io/Firebase-Fleet-Manager/](https://purushothamanks.github.io/Firebase-Fleet-Manager/)**
3. Tap the browser menu (three dots in top right) or look for the prompt banner:
   ➔ Tap **"Install App"** (or **"Add to Home Screen"**).
4. The app will be installed directly onto your phone's home screen and app drawer as a standalone native app:
   - Fullscreen app window (no browser address bar).
   - Custom high-res satellite icon.
   - Offline asset caching with Service Worker.
   - Automatic sync with 24/7 Supabase Cloud state.

---

### Option 2: Build & Run Native Android Studio Project (APK)
This project is configured as a modern native Android application written in **Kotlin**:

#### Architecture & Features:
- **Latest SDK**: `compileSdk = 35`, `targetSdk = 35` (Android 15 & Android 14).
- **Minimum Support**: `minSdk = 24` (Android 7.0+, covering >99.8% of global devices).
- **Edge-to-Edge Display**: Implements `enableEdgeToEdge()` and window insets matching Android 15's mandatory edge-to-edge guidelines.
- **Predictive Back Navigation**: Integrates `onBackPressedDispatcher` with `OnBackPressedCallback`.
- **Swipe-to-Refresh**: Native `SwipeRefreshLayout` pulling down from top re-syncs all fleet states.
- **Dialogs & Alerts**: Native `WebChromeClient` handles JavaScript `alert()`, `confirm()`, and `prompt()` (for administrator bypass key passkeys).
- **Dual Mode (Online + Offline)**: Automatically connects to `https://purushothamanks.github.io/Firebase-Fleet-Manager/` when online, and falls back to bundled `assets/www/` when offline.

#### How to Build the APK:

1. **In Android Studio**:
   - Open Android Studio.
   - Select **Open an existing project** and choose:
     `/home/purushothaman/Videos/Projects/Firebase-Fleet-Manager/android`
   - Android Studio will automatically sync the Gradle files.
   - Click **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
   - The generated APK will be in:
     `app/build/outputs/apk/debug/app-debug.apk`.

2. **Via Command Line**:
   ```bash
   cd /home/purushothaman/Videos/Projects/Firebase-Fleet-Manager/android
   ./gradlew assembleDebug
   ```

3. **Install on Phone via USB / ADB**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```
