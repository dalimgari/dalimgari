import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

describe('project smoke tests', () => {
  it('keeps the build and test scripts defined', async () => {
    const pkg = JSON.parse(await read('package.json'))
    assert.equal(typeof pkg.scripts.build, 'string')
    assert.equal(pkg.scripts.test, 'node --test tests/*.test.js')
  })

  it('keeps production deployment on main and Pages fallback enabled', async () => {
    const workflow = await read('.github/workflows/deploy.yml')
    assert.match(workflow, /branches: \[main\]/)
    assert.match(workflow, /npm test/)
    assert.match(workflow, /cp dist\/index\.html dist\/404\.html/)
    assert.match(workflow, /VITE_BASE_PATH: \/dalimgari\//)
    assert.match(workflow, /SITE_URL: https:\/\/dalimgari\.github\.io\/dalimgari/)
  })

  it('keeps the dedicated automated-test workflow on Node 22', async () => {
    const workflow = await read('.github/workflows/tests.yml')
    assert.match(workflow, /node-version: 22/)
    assert.match(workflow, /run: npm test/)
  })

  it('keeps the application route helper present', async () => {
    const routes = await read('src/lib/routes.js')
    assert.match(routes, /export function appPath/)
  })

  it('protects every management route with an explicit AdminRoute permission guard', async () => {
    const app = await read('src/App.jsx')
    assert.match(app, /import AdminRoute from ['"]\.\/components\/auth\/AdminRoute['"]/) 
    assert.match(app, /if\s*\(path\s*===\s*['"]\/dashboard['"]\)\s*page\s*=\s*<RoleRoute\s*\/>/)
    assert.match(app, /else if \(management\) \{[\s\S]*AdminRoute/)
    for (const permission of ['content_manage', 'media_manage', 'user_manage', 'audit_view', 'settings_manage']) {
      assert.match(app, new RegExp(permission))
    }
  })

  it('keeps the admin guard backed by Supabase permission RPCs', async () => {
    const guard = await read('src/components/auth/AdminRoute.jsx')
    const permissionService = await read('src/services/permissionService.js')
    assert.match(guard, /hasPermission, canAccessRoute/)
    assert.match(guard, /canAccessRoute\(routePath\)/)
    assert.match(guard, /hasPermission\(permission\)/)
    assert.match(permissionService, /current_user_has_permission/)
    assert.match(permissionService, /current_user_has_admin_access/)
    assert.match(guard, /window\.location\.replace\(appPath\('\/access-denied'\)\)/)
  })

  it('keeps storage hardening reproducible in migrations', async () => {
    const migration = await read('supabase/migrations/20261001201247_harden_media_storage_and_rbac_policies.sql')
    assert.match(migration, /file_size_limit = 52428800/)
    assert.match(migration, /allowed_mime_types/)
    assert.match(migration, /to authenticated/)
    assert.match(migration, /current_user_has_permission\('media_manage'\)/)
  })

  it('keeps the admin-access RPC reproducible in migrations', async () => {
    const migration = await read('supabase/migrations/20261001201305_add_admin_access_guard_rpc.sql')
    assert.match(migration, /current_user_has_admin_access/)
    assert.match(migration, /grant execute on function public\.current_user_has_admin_access\(\) to authenticated/)
  })

  it('keeps the admin security monitor wired end-to-end', async () => {
    const dashboard = await read('src/pages/admin/Dashboard.jsx')
    const card = await read('src/components/admin/SecurityStatusCard.jsx')
    const service = await read('src/services/securityTestService.js')
    const websiteScanner = await read('src/services/websiteScanService.js')
    const fn = await read('supabase/functions/admin-security-test/index.ts')
    const migration = await read('supabase/migrations/20261002130844_admin_security_test_status.sql')
    assert.match(dashboard, /SecurityStatusCard/)
    assert.match(card, /runSecurityTest/)
    assert.match(service, /admin-security-test/)
    assert.match(websiteScanner, /runWebsiteScan/)
    assert.match(websiteScanner, /PUBLIC_ROUTES/)
    assert.match(card, /পুরো ওয়েবসাইট স্ক্যান করুন/)
    assert.match(card, /runWebsiteScan/)
    assert.match(fn, /current_user_has_permission/)
    assert.match(fn, /run_security_tests/)
    assert.match(migration, /security_test_runs/)
    assert.match(migration, /settings_manage/)
  })
})