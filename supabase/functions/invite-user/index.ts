import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })

    const { data: allowed, error: permissionError } = await ctx.supabase.rpc('current_user_has_permission', { required_permission: 'user_manage' })
    if (permissionError || !allowed) return Response.json({ error: 'Permission denied' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
    if (!email || !email.includes('@')) return Response.json({ error: 'A valid email is required' }, { status: 400 })

    const redirectTo = new URL('/dalimgari/login', req.url).toString()
    const { data, error } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: displayName ? { display_name: displayName } : undefined,
      redirectTo,
    })
    if (error) return Response.json({ error: error.message }, { status: 400 })

    return Response.json({ user: { id: data.user?.id, email: data.user?.email } })
  }),
}
