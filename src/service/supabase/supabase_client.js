import { createClient } from '@supabase/supabase-js'

const supabase_url = import.meta.env.VITE_SUPABASE_URL
const supabase_anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase_client = createClient(supabase_url, supabase_anon_key)
