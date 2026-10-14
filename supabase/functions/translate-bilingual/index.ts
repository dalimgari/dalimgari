import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([\da-f]+);/gi, (_, n: string) => {
      const code = Number.parseInt(n, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _;
    });
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function splitByUtf8Bytes(value: string, maxBytes = 430): string[] {
  const parts: string[] = [];
  let remaining = value;
  const encoder = new TextEncoder();

  while (remaining.length) {
    let chunk = "";
    let bytes = 0;
    let lastSpace = -1;
    let usedChars = 0;
    for (const char of remaining) {
      const size = encoder.encode(char).length;
      if (bytes + size > maxBytes) break;
      chunk += char;
      bytes += size;
      usedChars += char.length;
      if (/\s/u.test(char)) lastSpace = usedChars - char.length;
    }
    if (!chunk) {
      const first = Array.from(remaining)[0];
      chunk = first;
      usedChars = first.length;
    } else if (usedChars < remaining.length && lastSpace > 0 && lastSpace > chunk.length * 0.55) {
      chunk = chunk.slice(0, lastSpace);
      usedChars = chunk.length;
    }
    parts.push(chunk);
    remaining = remaining.slice(usedChars);
  }
  return parts;
}

async function translateMyMemoryText(text: string, source: string, target: string): Promise<string> {
  const chunks = splitByUtf8Bytes(text);
  const translated: string[] = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) {
      translated.push(chunk);
      continue;
    }
    const endpoint = new URL("https://api.mymemory.translated.net/get");
    endpoint.searchParams.set("q", chunk);
    endpoint.searchParams.set("langpair", `${source}|${target}`);
    const response = await fetch(endpoint, { method: "GET", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Free translation service returned HTTP ${response.status}.`);
    const result = await response.json().catch(() => ({}));
    const value = result?.responseData?.translatedText;
    if (typeof value !== "string" || !value.trim() || Number(result?.responseStatus) >= 400) {
      throw new Error("Free translation service could not translate this text. Try a shorter field later.");
    }
    translated.push(value);
  }
  return translated.join("");
}

async function translateMyMemory(text: string, source: string, target: string, format: "text" | "html"): Promise<string> {
  if (format === "text") return translateMyMemoryText(text, source, target);

  // Translate text nodes only; preserve HTML tags, attributes, comments and code/style blocks.
  const tokens = text.match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g) || [];
  const output: string[] = [];
  let protectedTag: string | null = null;
  for (const token of tokens) {
    if (token.startsWith("<")) {
      output.push(token);
      const closing = token.match(/^<\s*\/\s*(script|style|pre|code)\b/i);
      const opening = token.match(/^<\s*(script|style|pre|code)\b/i);
      if (closing && protectedTag === closing[1].toLowerCase()) protectedTag = null;
      else if (opening && !/\/\s*>$/.test(token)) protectedTag = opening[1].toLowerCase();
      continue;
    }
    if (protectedTag || !token.trim()) {
      output.push(token);
      continue;
    }
    const decoded = decodeHtmlEntities(token);
    const translated = await translateMyMemoryText(decoded, source, target);
    output.push(escapeHtmlText(translated));
  }
  return output.join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return respond({ error: "Server authentication is not configured." }, 500);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return respond({ error: "Sign in as an administrator to use automatic translation." }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Your session is invalid or expired." }, 401);
  if (String(authData.user.app_metadata?.role || "").toLowerCase() !== "admin") {
    return respond({ error: "Administrator access is required for translation." }, 403);
  }

  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";
    const source = body?.source_language;
    const target = body?.target_language;
    const format = body?.format === "html" ? "html" : "text";

    if (!text.trim()) return respond({ error: "Enter text to translate." }, 400);
    if (text.length > 30000) return respond({ error: "Text is too long. The limit is 30,000 characters per translation." }, 413);
    if (!((source === "bn" && target === "en") || (source === "en" && target === "bn"))) {
      return respond({ error: "Only Bengali-English and English-Bengali translation is supported." }, 400);
    }

    const googleApiKey = Deno.env.get("GOOGLE_CLOUD_TRANSLATE_API_KEY");
    const googleProjectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");

    // Use the higher-quality Google Translation LLM when credentials are configured.
    // Otherwise use the no-key MyMemory translation API so setup does not block the feature.
    if (!googleApiKey || !googleProjectId) {
      const translatedText = await translateMyMemory(text, source, target, format);
      return respond({ translated_text: translatedText, model: "mymemory-free-fallback" });
    }

    const model = `projects/${googleProjectId}/locations/global/models/general/translation-llm`;
    const endpoint = new URL("https://translation.googleapis.com/language/translate/v2");
    endpoint.searchParams.set("key", googleApiKey);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ q: [text], source, target, format, model }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = String(result?.error?.message || "");
      console.error("Google Cloud Translation request failed:", response.status, providerMessage.slice(0, 300));
      return respond({ error: "Translation failed. Check the Google Cloud Translation API setup and try again." }, 502);
    }

    const translatedText = result?.data?.translations?.[0]?.translatedText;
    if (typeof translatedText !== "string" || !translatedText.trim()) {
      return respond({ error: "The translation service returned an empty result." }, 502);
    }

    return respond({ translated_text: translatedText, model: "general/translation-llm" });
  } catch (error) {
    console.error("Bilingual translation error:", error instanceof Error ? error.message : "Unknown error");
    return respond({ error: "Could not translate this field. Your original text has not been changed." }, 502);
  }
});
