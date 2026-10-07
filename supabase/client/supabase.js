const SUPABASE_URL = "https://yopfogoyjxwxplnabqii.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sWfWMmJXXwuP1aqf8gki9g_gO9U_kgu";

window.dalimgariSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
