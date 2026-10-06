import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const webEntries = new Set([
  "index.html",
  "core",
  "platform",
  "style"
]);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const name of webEntries) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing web asset: ${name}`);
  }

  const target = path.join(dist, name);
  fs.cpSync(source, target, { recursive: true });
}

console.log(`Dalimgari Android web bundle created at ${dist}`);
