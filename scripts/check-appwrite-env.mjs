#!/usr/bin/env node

const required = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_BUCKET_PROFILE_PICTURES",
  "APPWRITE_BUCKET_MEDIA",
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error("Appwrite environment is not ready. Missing variables:");
  for (const name of missing) console.error(`- ${name}`);
  console.error("Set these in your local environment or Vercel project settings; never commit secrets.");
  process.exitCode = 1;
} else {
  let endpoint;
  try {
    endpoint = new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  } catch {
    console.error("NEXT_PUBLIC_APPWRITE_ENDPOINT must be a valid URL.");
    process.exit(1);
  }

  if (endpoint.protocol !== "https:") {
    console.error("Appwrite endpoint must use HTTPS.");
    process.exit(1);
  }

  if (process.env.NEXT_PUBLIC_APPWRITE_API_KEY) {
    console.error("Unsafe environment variable: API keys must not use the NEXT_PUBLIC_ prefix.");
    process.exit(1);
  }

  console.log("Appwrite environment variables are present. This check does not verify remote credentials or permissions.");
}
