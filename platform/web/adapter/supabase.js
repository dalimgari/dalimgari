// Web Supabase Adapter

const SUPABASE_URL = "https://yopfogoyjxwxplnabqii.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = window.Dalimgari?.config?.supabasePublishableKey;

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Dalimgari: Supabase publishable key is not configured.");
} else {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  window.Dalimgari = window.Dalimgari || {};
  window.Dalimgari.supabase = supabase;
}
