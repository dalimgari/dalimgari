import { readFileSync, existsSync } from "node:fs";

const required = [
  "index.html",
  "loader.js",
  "supabase/auth/auth.js",
  "supabase/client/supabase.js",
  "component/avatar/avatar.js",
  "component/menu/menu.js",
  "component/search/search.js"
];

for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const loader = readFileSync("loader.js", "utf8");
const auth = readFileSync("supabase/auth/auth.js", "utf8");
if (!loader.includes('content/profile.html')) throw new Error("Profile route is missing.");
if (!loader.includes("requireRouteAccess")) throw new Error("Protected-route guard is missing.");
if (!auth.includes("window.dalimgariAuth")) throw new Error("Auth API is not exposed to the loader.");

console.log("Smoke checks passed.");
