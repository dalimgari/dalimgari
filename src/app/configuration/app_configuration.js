export const app_configuration = {
  environment: import.meta.env.MODE,
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
}
