import { readFileSync, existsSync } from "node:fs";

const required = [
  "index.html","loader.js","supabase/auth/auth.js","supabase/client/supabase.js",
  "supabase/community.js","content/home.html","style/community.css",
  "component/avatar/avatar.js","component/menu/menu.js","component/search/search.js",
  "content/profile/overview.html","content/profile/post.html","content/profile/photo.html","content/profile/video.html","content/profile/album.html","content/profile/settings.html"
];
for (const file of required) if (!existsSync(file)) throw new Error(`Missing required file: ${file}`);

const loader=readFileSync("loader.js","utf8"),auth=readFileSync("supabase/auth/auth.js","utf8");
const community=readFileSync("supabase/community.js","utf8"),html=readFileSync("content/home.html","utf8");
if(!loader.includes("content/profile.html")||!loader.includes("requireRouteAccess")) throw new Error("Protected routing guard is missing.");
if(!auth.includes("window.dalimgariAuth")) throw new Error("Auth API is not exposed to the loader.");
for(const token of ["posts","post_media","community-media","theme_presets","user_preferences"]) if(!community.includes(token)&&!html.includes(token)) throw new Error(`Community integration missing: ${token}`);
if(!community.includes("post_media")||!community.includes("storage.from(\"community-media\")")) throw new Error("Community media attachment workflow is missing.");
if(!html.includes("data-feed")||!html.includes("data-home-media")||!html.includes("data-home-members")) throw new Error("Core home sections are missing.");
console.log("Smoke checks passed.");
