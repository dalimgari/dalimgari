const baseUrl = new URL(process.env.BASE_URL ?? "https://dalimgari.vercel.app/");
if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost" && baseUrl.hostname !== "127.0.0.1") {
  throw new Error("BASE_URL must use HTTPS (except local development).");
}
baseUrl.pathname = baseUrl.pathname.replace(/\/+$/, "") + "/";

const publicPaths = [
  "",
  "about",
  "pages",
  "albums",
  "privacy",
  "map",
  "login",
  "signup",
  "forgot-password",
  "p/village-history",
  "p/early-settlement",
  "p/the-name-dalimgari",
  "p/dalimgari-liberation-war",
];

const failures = [];
async function request(path, options = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "Dalimgari-Production-Smoke/1.0", ...options.headers },
  });
  return response;
}

async function checkPublicRoute(path) {
  try {
    const response = await request(path);
    await response.arrayBuffer();
    if (response.status !== 200) {
      failures.push(`GET /${path} returned HTTP ${response.status}; expected 200`);
      return;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      failures.push(`GET /${path} returned unexpected content-type: ${contentType || "(missing)"}`);
    }
  } catch (error) {
    failures.push(`GET /${path} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`Smoke-testing ${baseUrl.origin}`);

try {
  const response = await request("api/health");
  const payload = await response.json().catch(() => null);
  if (response.status !== 200 || payload?.status !== "ok" || payload?.application !== "dalimgari") {
    failures.push(`Health endpoint failed: HTTP ${response.status}, body=${JSON.stringify(payload)}`);
  }
} catch (error) {
  failures.push(`Health endpoint request failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const response = await request("");
  await response.arrayBuffer();
  const requiredHeaders = [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "DENY"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
  ];
  for (const [name, expected] of requiredHeaders) {
    if (response.headers.get(name)?.toLowerCase() !== expected.toLowerCase()) {
      failures.push(`Homepage security header ${name} missing or unexpected`);
    }
  }
} catch (error) {
  failures.push(`Homepage security-header check failed: ${error instanceof Error ? error.message : String(error)}`);
}

for (const path of publicPaths) await checkPublicRoute(path);

for (const path of ["dashboard", "profile"]) {
  try {
    const response = await request(path, { redirect: "manual" });
    await response.arrayBuffer();
    const location = response.headers.get("location") ?? "";
    if (![307, 308].includes(response.status) || !location.startsWith("/login")) {
      failures.push(`Unauthenticated GET /${path} was not redirected to /login (HTTP ${response.status}, location=${location || "(missing)"})`);
    }
  } catch (error) {
    failures.push(`Protected route /${path} check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error(`\nProduction smoke test failed (${failures.length} issue(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Production smoke test passed: health, ${publicPaths.length} public routes, security headers, and unauthenticated route guards.`);
}
