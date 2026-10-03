import PROJECT_PATHS from '../src/config/projectPaths.js'
import { ROUTES, PERMISSIONS } from '../src/lib/routes.js'
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
  it('keeps application routes and permissions centralized', async () => {
    const routes = await read('src/lib/routes.js')
    assert.match(routes, /export const ROUTES/)
    assert.match(routes, /export const PERMISSIONS/)
    assert.equal(ROUTES.search, '/search')
    assert.equal(ROUTES.manage.media, '/manage/media')
    assert.equal(PERMISSIONS.mediaManage, 'media_manage')
  })

  it('keeps the build and test scripts defined', async () => {
    const pkg = JSON.parse(await read(PROJECT_PATHS.package))
    assert.equal(typeof pkg.scripts.build, 'string')
    assert.equal(pkg.scripts.test, 'node --test tests/*.test.js')
  })

  it('keeps production deployment on main and Pages fallback enabled', async () => {
    const workflow = await read(PROJECT_PATHS.workflows.deploy)
    assert.match(workflow, /branches: \[main\]/)
    assert.match(workflow, /npm test/)
    assert.match(workflow, /cp dist\/index\.html dist\/404\.html/)
    assert.match(workflow, /VITE_BASE_PATH: \/dalimgari\//)
    assert.match(workflow, /SITE_URL: https:\/\/dalimgari\.github\.io\/dalimgari/)
  })

  it('keeps the dedicated automated-test workflow on Node 22', async () => {
    const workflow = await read(PROJECT_PATHS.workflows.tests)
    assert.match(workflow, /node-version: 22/)
    assert.match(workflow, /run: npm test/)
  })

  it('keeps the application route helper present', async () => {
    const routes = await read(PROJECT_PATHS.app.routes)
    assert.match(routes, /export function appPath/)
  })

  it('protects every management route with an explicit AdminRoute permission guard', async () => {
    const app = await read(PROJECT_PATHS.app.entry)
    assert.match(app, /import AdminRoute from ['"]\.\/components\/auth\/AdminRoute['"]/) 
    assert.match(app, /if\s*\(path\s*===\s*ROUTES\.dashboard\)\s*page\s*=\s*<RoleRoute\s*\/>/)
    assert.match(app, /else if \(management\) \{[\s\S]*AdminRoute/)
    for (const permission of ['contentManage', 'mediaManage', 'userManage', 'auditView', 'settingsManage']) {
      assert.match(app, new RegExp(`PERMISSIONS\\.${permission}`))
    }
  })

  it('keeps the admin guard backed by Supabase permission RPCs', async () => {
    const guard = await read(PROJECT_PATHS.components.auth.adminRoute)
    const permissionService = await read(PROJECT_PATHS.services.permission)
    assert.match(guard, /hasPermission, canAccessRoute/)
    assert.match(guard, /canAccessRoute\(routePath\)/)
    assert.match(guard, /hasPermission\(permission\)/)
    assert.match(permissionService, /current_user_has_permission/)
    assert.match(permissionService, /current_user_has_admin_access/)
    assert.match(guard, /window\.location\.replace\(appPath\(ROUTES\.accessDenied\)\)/)
  })

  it('keeps storage hardening reproducible in migrations', async () => {
    const migration = await read(PROJECT_PATHS.migrations.mediaHardening)
    assert.match(migration, /file_size_limit = 52428800/)
    assert.match(migration, /allowed_mime_types/)
    assert.match(migration, /to authenticated/)
    assert.match(migration, /current_user_has_permission\('media_manage'\)/)
  })

  it('keeps the admin-access RPC reproducible in migrations', async () => {
    const migration = await read(PROJECT_PATHS.migrations.adminAccessGuard)
    assert.match(migration, /current_user_has_admin_access/)
    assert.match(migration, /grant execute on function public\.current_user_has_admin_access\(\) to authenticated/)
  })

  it('keeps the admin security monitor wired end-to-end', async () => {
    const dashboard = await read(PROJECT_PATHS.pages.dashboard)
    const card = await read(PROJECT_PATHS.components.admin.securityStatusCard)
    const service = await read(PROJECT_PATHS.services.securityTest)
    const websiteScanner = await read(PROJECT_PATHS.services.websiteScan)
    const fn = await read(PROJECT_PATHS.functions.adminSecurityTest)
    const migration = await read(PROJECT_PATHS.migrations.adminSecurityTestStatus)
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