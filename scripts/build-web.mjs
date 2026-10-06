import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const excluded = new Set([
  ".git",
  ".github",
  "android",
  "dist",
  "node_modules"
]);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function copyEntry(source, target) {
  const name = path.basename(source);
  if (excluded.has(name)) return;

  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.cpSync(source, target, { recursive: true });
    return;
  }

  if (name === "package.json" || name === "package-lock.json" || name === "capacitor.config.json") {
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

for (const entry of fs.readdirSync(root)) {
  copyEntry(path.join(root, entry), path.join(dist, entry));
}

console.log(`Dalimgari Android web bundle created at ${dist}`);
