import { createClient } from '@supabase/supabase-js'

// Production project is public client configuration; environment variables still take precedence.
const DEFAULT_SUPABASE_URL = 'https://yopfogoyjxwxplnabqii.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_N-6XHnwDNMhKDuyxlZSk9Q_GIGjiOFZ'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY
).trim()

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const supabaseConfig = {
  url: supabaseUrl,
  configured: Boolean(supabaseUrl && supabasePublishableKey),
}
