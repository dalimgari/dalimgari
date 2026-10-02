import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authorization = req.headers.get('Authorization') ?? ''
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

  const { data: allowed, error: permissionError } = await userClient.rpc('current_user_has_permission', { required_permission: 'settings_manage' })
  if (permissionError || !allowed) return new Response(JSON.stringify({ error: 'Security test permission required' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: data, error } = await adminClient.rpc('run_security_tests')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify(data), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
})