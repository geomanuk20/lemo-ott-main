/**
 * sync-version.js
 * ---------------
 * Reads the version from mobile/app.json and automatically syncs it to:
 *   - mobile/package.json
 *   - mobile/package-lock.json
 *   - mobile/android/app/build.gradle  (versionName + auto-computed versionCode)
 *   - mobile/ios/LemoOTT/Info.plist    (CFBundleShortVersionString + CFBundleVersion)
 *
 * versionCode is derived from the version string:
 *   "1.0.4" -> (1 * 10000) + (0 * 100) + 4 = 10004
 *
 * Run manually:  node scripts/sync-version.js
 * Auto-run:      added as "presync" / "prebuild" in package.json
 */

const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT         = path.resolve(__dirname, '..');
const APP_JSON     = path.join(ROOT, 'app.json');
const PKG_JSON     = path.join(ROOT, 'package.json');
const PKG_LOCK     = path.join(ROOT, 'package-lock.json');
const BUILD_GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const INFO_PLIST   = path.join(ROOT, 'ios', 'LemoOTT', 'Info.plist');

// ─── Read version from app.json ───────────────────────────────────────────────
const appJson  = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
const version  = appJson.expo.version;

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`[sync-version] ❌  Invalid or missing version in app.json: "${version}"`);
  process.exit(1);
}

// Compute numeric versionCode from semver: "1.0.4" → 10004
const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`[sync-version] 📦  version = ${version}  |  versionCode = ${versionCode}`);

// ─── 1. package.json ─────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(PKG_JSON, 'utf8'));
if (pkg.version !== version) {
  pkg.version = version;
  fs.writeFileSync(PKG_JSON, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`[sync-version] ✅  package.json            → ${version}`);
} else {
  console.log(`[sync-version] ⏭️   package.json            already ${version}`);
}

// ─── 2. package-lock.json ────────────────────────────────────────────────────
if (fs.existsSync(PKG_LOCK)) {
  const lock = JSON.parse(fs.readFileSync(PKG_LOCK, 'utf8'));
  let changed = false;
  if (lock.version !== version)               { lock.version = version; changed = true; }
  if (lock.packages?.['']?.version !== version) { lock.packages[''].version = version; changed = true; }
  if (changed) {
    fs.writeFileSync(PKG_LOCK, JSON.stringify(lock, null, 2) + '\n');
    console.log(`[sync-version] ✅  package-lock.json       → ${version}`);
  } else {
    console.log(`[sync-version] ⏭️   package-lock.json       already ${version}`);
  }
}

// ─── 3. android/app/build.gradle ─────────────────────────────────────────────
if (fs.existsSync(BUILD_GRADLE)) {
  let gradle = fs.readFileSync(BUILD_GRADLE, 'utf8');
  const prevGradle = gradle;
  gradle = gradle.replace(/versionCode\s+\d+/,   `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  if (gradle !== prevGradle) {
    fs.writeFileSync(BUILD_GRADLE, gradle);
    console.log(`[sync-version] ✅  build.gradle            → versionName="${version}" versionCode=${versionCode}`);
  } else {
    console.log(`[sync-version] ⏭️   build.gradle            already up-to-date`);
  }
}

// ─── 4. ios/LemoOTT/Info.plist ───────────────────────────────────────────────
if (fs.existsSync(INFO_PLIST)) {
  let plist = fs.readFileSync(INFO_PLIST, 'utf8');
  const prevPlist = plist;

  // CFBundleShortVersionString (marketing version)
  plist = plist.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${version}$2`
  );
  // CFBundleVersion (build number – use versionCode as string)
  plist = plist.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${versionCode}$2`
  );

  if (plist !== prevPlist) {
    fs.writeFileSync(INFO_PLIST, plist);
    console.log(`[sync-version] ✅  Info.plist              → ${version} (build ${versionCode})`);
  } else {
    console.log(`[sync-version] ⏭️   Info.plist              already up-to-date`);
  }
}

console.log('[sync-version] 🎉  All files are in sync.');
