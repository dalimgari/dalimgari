# Bilingual auto-translation setup

The `translate-bilingual` Supabase Edge Function uses Google Cloud Translation's Translation LLM model (`general/translation-llm`) for Bengali-English field translation.

## Required Supabase Edge Function secrets

Set these secrets for the production Supabase project before using the feature:

- `GOOGLE_CLOUD_TRANSLATE_API_KEY`: a Google Cloud API key restricted to the Cloud Translation API.
- `GOOGLE_CLOUD_PROJECT_ID`: the Google Cloud project ID used by the Translation LLM model.

Do not put either value in `app.js`, GitHub Pages files, or any client-side configuration.

## Google Cloud setup

1. Select or create a Google Cloud project.
2. Enable the Cloud Translation API and billing as required by Google Cloud.
3. Create an API key and restrict it to the Cloud Translation API. Keep it private.
4. Set the two values above as Supabase Edge Function secrets.
5. Deploy the `translate-bilingual` Edge Function.
6. Merge/deploy the website branch that calls this function.

The Edge Function validates the caller's Supabase session and requires trusted `app_metadata.role = admin`. It only accepts Bengali-to-English or English-to-Bengali requests, caps each input at 30,000 characters, and never returns the provider API key to the browser.

Translation is a draft. Admins can edit both fields before saving. Existing manually entered counterpart text is not overwritten automatically. Google Cloud Translation LLM is a high-quality model, but no machine translation is guaranteed to be perfect; review personal names, village-specific terms, and historical details.
