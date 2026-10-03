import PROJECT_PATHS from '../src/config/projectPaths.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

test('Supabase DB contract', async () => {
  assert.ok(url, 'Supabase URL is required; refusing to skip DB contract tests')
  assert.ok(key, 'Supabase publishable/anon key is required; refusing to skip DB contract tests')

  const supabase = createClient(url, key)
  const expectedTables = [
    'admin_information', 'albums', 'analytics_visits', 'audit_logs', 'global_ui_labels', 'icon_management', 'profile_avatar_settings',
    'homepage_settings', 'media', 'pages', 'permissions', 'post_media', 'posts', 'profiles',
    'role_permissions', 'roles', 'rural_visual_settings', 'sidebar_settings', 'theme_settings',
    'user_roles', 'website_information',
  ]

  const checks = await Promise.all(expectedTables.map(async (table) => {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return [table, error]
  }))

  for (const [table, error] of checks) {
    assert.equal(error, null, table + ' is not reachable through Supabase REST: ' + (error?.message || ''))
  }

  const { data, error } = await supabase.rpc('get_sitemap_content')
  assert.equal(error, null, 'get_sitemap_content RPC failed: ' + (error?.message || ''))
  assert.ok(data && Array.isArray(data.pages) && Array.isArray(data.posts))

  const analytics = await supabase.rpc('record_analytics_visit', {
    p_path: '/__db-contract-test__',
    p_referrer: null,
    p_user_agent: 'db-contract-test',
    p_session_id: 'contract-' + Date.now(),
    p_device_class: 'test',
    p_language: 'bn',
    p_theme: 'test',
  })
  assert.equal(analytics.error, null, 'record_analytics_visit RPC failed: ' + (analytics.error?.message || ''))
})
