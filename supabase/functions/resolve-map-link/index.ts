import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// GitHub Pages is the production origin for this repository. JWT verification
// remains the authorization boundary; CORS only restricts which browser origins
// may read responses. Requests without an Origin header remain usable by trusted
// non-browser callers that provide a valid JWT.
const ALLOWED_ORIGINS = new Set(["https://dalimgari.github.io"]);

function responseHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });

const ALLOWED_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
]);
const GOOGLE_MAPS_HOSTS = new Set(["google.com", "www.google.com", "maps.google.com"]);
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;

function isAllowedMapsUrl(url: URL): boolean {
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return false;
  if (GOOGLE_MAPS_HOSTS.has(host) && !url.pathname.startsWith("/maps")) return false;
  return true;
}

function coords(s: string): string | null {
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
    /!3d(-?\d+(?:\.\d+)?)(?:\u0021|%21)!4d(-?\d+(?:\.\d+)?)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lon) &&
          lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return lat + "," + lon;
      }
    }
  }
  return null;
}

async function fetchGoogleMapsHtml(startUrl: URL): Promise<{ finalUrl: URL; html: string }> {
  let currentUrl = startUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    if (!isAllowedMapsUrl(currentUrl)) {
      throw new Error("The link redirected to an unsupported destination.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(currentUrl.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DalimgariMapResolver/1.2)" },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        try { await response.body?.cancel(); } catch { /* Ignore redirect-body cleanup errors. */ }
        if (!location) throw new Error("Google Maps returned an invalid redirect.");
        if (redirects === MAX_REDIRECTS) throw new Error("Too many redirects.");
        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch {
          throw new Error("Google Maps returned an invalid redirect.");
        }
        // Validate every redirect destination BEFORE making the next request.
        if (!isAllowedMapsUrl(nextUrl)) {
          throw new Error("The link redirected to an unsupported destination.");
        }
        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        try { await response.body?.cancel(); } catch { /* Ignore cleanup errors. */ }
        throw new Error("Google Maps could not open this share link.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("text/html")) {
        try { await response.body?.cancel(); } catch { /* Ignore cleanup errors. */ }
        throw new Error("Google Maps returned an unsupported response.");
      }

      if (!response.body) throw new Error("Google Maps returned an empty response.");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > MAX_HTML_BYTES) {
            await reader.cancel();
            throw new Error("Google Maps response exceeded the allowed size.");
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { finalUrl: currentUrl, html: new TextDecoder().decode(merged) };
    } finally {
      // The timeout covers both response headers and body streaming.
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects.");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed." }), {
      status: 403,
      headers: responseHeaders(null),
    });
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405, origin);

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400, origin);
  }

  const input = String(body.url || "").trim();
  if (input.length > 4096) return json({ error: "The Google Maps link is too long." }, 400, origin);

  let startUrl: URL;
  try {
    startUrl = new URL(input);
  } catch {
    return json({ error: "Enter a valid Google Maps link." }, 400, origin);
  }

  if (!isAllowedMapsUrl(startUrl)) {
    return json({ error: "Enter a supported HTTPS Google Maps link." }, 400, origin);
  }

  try {
    const { finalUrl, html } = await fetchGoogleMapsHtml(startUrl);
    const query = finalUrl.searchParams.get("q") || finalUrl.searchParams.get("query") || "";
    const match = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    const location = coords(finalUrl.toString()) || coords(html) ||
      (match && Number(match[1]) >= -90 && Number(match[1]) <= 90 &&
        Number(match[2]) >= -180 && Number(match[2]) <= 180
        ? Number(match[1]) + "," + Number(match[2])
        : null);

    if (!location) {
      return json({
        error: "This share link does not expose the exact pin coordinates. Enter the pin's latitude,longitude to save it exactly.",
      }, 422, origin);
    }

    return json({
      location,
      embed_url: "https://maps.google.com/maps?q=" + encodeURIComponent(location) + "&z=19&output=embed",
      exact_coordinates: true,
      resolved_url: finalUrl.toString(),
    }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "The link redirected to an unsupported destination." ||
        message === "Too many redirects." ||
        message === "Google Maps response exceeded the allowed size.") {
      return json({ error: message }, 422, origin);
    }
    if (message === "Google Maps could not open this share link.") {
      return json({ error: message }, 502, origin);
    }
    console.error("resolve-map-link failed:", message);
    return json({ error: "Could not resolve this Google Maps link. Check the link and try again." }, 502, origin);
  }
});