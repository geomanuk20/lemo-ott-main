# Lemo OTT Mobile Application (React Native)

This is the mobile application frontend for the Lemo OTT platform, built using React Native and Expo.

## Features

- **Authentication**: Email & Password Login and Registration with persistent session caching.
- **Home Dashboard**: Custom autoplay banners, vertical rows of Movies, TV Series, New Releases, Sports, and Live TV.
- **Movies & Shows Catalogs**: Infinite scroll lists with genre and language quick-filtering.
- **Watchlist**: Save videos to your personalized list and synchronise them across all devices.
- **Profile Summary**: Plan expirations, registration metrics, and detailed transaction histories.
- **Advanced Player**: Integrated full-screen landscape video player handling Mux streams, native `.m3u8` HLS/DASH feeds, and YouTube/Vimeo embed widgets.

---

## Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed on your machine.

### 2. Installation
Navigate to the `mobile` directory and install the packages:
```bash
cd mobile
npm install
```

### 3. Start Backend Server
Ensure your backend Express server is running. By default, the app is pre-configured to query:
- Android emulators -> `http://10.0.2.2:5001/api`
- iOS simulators -> `http://localhost:5001/api`

*For testing on physical devices, update the `LOCAL_IP` variable inside [api.js](file:///Users/geomanuk/lemo%20apk/mobile/src/config/api.js) with your computer's local Wi-Fi IP address (e.g. `192.168.1.50`).*

### 4. Launch Expo App
Run the start command to launch the Expo dev server:
```bash
npm run start
```

- **iOS Simulator:** Press `i` to boot automatically.
- **Android Emulator:** Press `a` to boot automatically.
- **Physical Device:** Install the **Expo Go** application on your iPhone/Android, and scan the QR code displayed in the terminal!
