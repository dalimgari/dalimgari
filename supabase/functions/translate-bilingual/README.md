# Bilingual auto-translation

The `translate-bilingual` Supabase Edge Function supports two translation paths:

1. **Google Cloud Translation LLM** (`general/translation-llm`) when both Google secrets are configured. This is the preferred higher-quality option.
2. **MyMemory free translation API** when Google credentials are not configured. This fallback needs no API key, so Bengali-English text translation can work without creating a Google Cloud account.

## Optional Google Cloud upgrade

These secrets are optional; the no-key fallback is used if either is absent:

- `GOOGLE_CLOUD_TRANSLATE_API_KEY`: a Google Cloud API key restricted to the Cloud Translation API.
- `GOOGLE_CLOUD_PROJECT_ID`: the Google Cloud project ID used by the Translation LLM model.

Do not put secrets in `app.js`, GitHub Pages files, or other client-side configuration.

## Security and limitations

The Edge Function verifies the Supabase session and requires trusted `app_metadata.role = admin`. It only accepts Bengali-to-English or English-to-Bengali requests and caps each input at 30,000 characters. Provider credentials are never returned to the browser.

When Google credentials are unavailable, text is sent to MyMemory's third-party translation service. The free service has usage limits and can be less accurate or temporarily unavailable; long HTML content may require multiple requests. HTML tags and attributes are preserved by translating text nodes only, and code/style/preformatted blocks are not translated. No machine translation is guaranteed to be perfect; review names, village-specific terms, and historical content.

Translation remains an editable draft. Existing manually entered counterpart text is not automatically overwritten, and the administrator can edit either language before saving.
