const GOOGLE_MAPS_HOSTS = new Set(["google.com", "www.google.com", "maps.google.com"]);

export function normalizeGoogleMapsShareUrl(value: string): string | null {
  const input = value.trim();
  if (!input || input.length > 2048) return null;

  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
      return null;
    }

    const host = url.hostname.toLowerCase();
    const valid =
      (host === "maps.app.goo.gl" && url.pathname.length > 1) ||
      (host === "goo.gl" && url.pathname.startsWith("/maps/") && url.pathname.length > 6) ||
      (GOOGLE_MAPS_HOSTS.has(host) &&
        (url.pathname === "/maps" ||
          url.pathname.startsWith("/maps/") ||
          (host === "maps.google.com" &&
            (url.searchParams.has("q") || url.searchParams.has("ll")))));

    return valid ? url.toString() : null;
  } catch {
    return null;
  }
}
