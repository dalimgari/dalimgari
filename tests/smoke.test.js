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

  it('protects every admin route with an explicit permission guard', async () => {
    const app = await read('src/App.jsx')
    assert.match(app, /import AdminRoute from ['"]\.\/components\/auth\/AdminRoute['"]/) 
    assert.match(app, /AdminRoute><Dashboard/)
    assert.match(app, /permission="content_manage"><PagesManagement/)
    assert.match(app, /permission="content_manage"><PostsManagement/)
    assert.match(app, /permission="media_manage"><AlbumsManagement/)
    assert.match(app, /permission="media_manage"><MediaManagement/)
    assert.match(app, /permission="user_manage"><UsersManagement/)
    assert.match(app, /permission="audit_view"><AuditLogs/)
    assert.match(app, /permission="settings_manage"><ControlPanel/)
  })

  it('keeps the admin guard backed by Supabase permission RPCs', async () => {
    const guard = await read('src/components/auth/AdminRoute.jsx')
    const permissionService = await read('src/services/permissionService.js')
    assert.match(guard, /hasAdminAccess, hasPermission/)
    assert.match(guard, /window\.location\.replace\(appPath\('\/login'\)\)/)
    assert.match(permissionService, /current_user_has_permission/)
    assert.match(permissionService, /current_user_has_admin_access/)
  })

  it('keeps storage hardening reproducible in migrations', async () => {
    const migration = await read('supabase/migrations/20261001200000_harden_media_storage_and_rbac_policies.sql')
    assert.match(migration, /file_size_limit = 52428800/)
    assert.match(migration, /allowed_mime_types/)
    assert.match(migration, /to authenticated/)
    assert.match(migration, /current_user_has_permission\('media_manage'\)/)
  })

  it('keeps the admin-access RPC reproducible in migrations', async () => {
    const migration = await read('supabase/migrations/20261001200500_add_admin_access_guard_rpc.sql')
    assert.match(migration, /current_user_has_admin_access/)
    assert.match(migration, /grant execute on function public\.current_user_has_admin_access\(\) to authenticated/)
  })
})
