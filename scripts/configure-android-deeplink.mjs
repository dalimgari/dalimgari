import fs from "node:fs";

const manifestPath = "android/app/src/main/AndroidManifest.xml";
const marker = 'android:scheme="com.dalimgari.app"';

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Android manifest not found: ${manifestPath}`);
}

const manifest = fs.readFileSync(manifestPath, "utf8");
if (manifest.includes(marker)) {
  console.log("Android auth deep-link intent filter already configured.");
  process.exit(0);
}

const activityPattern = /(<activity\b[^>]*android:name="[^"]*MainActivity"[^>]*>)/;
const match = manifest.match(activityPattern);
if (!match) {
  throw new Error("MainActivity declaration not found in AndroidManifest.xml");
}

const intentFilter = `
    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="com.dalimgari.app" android:host="reset-password" />
    </intent-filter>`;

const updated = manifest.replace(match[1], `${match[1]}\n${intentFilter}`);
fs.writeFileSync(manifestPath, updated);
console.log("Configured Android auth deep-link intent filter.");
