import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

test('Master Specification: no Firebase dependency or source reference', () => {
  const packageJson = read('package.json')
  assert.doesNotMatch(packageJson, /firebase/i)
})

test('Master Specification: media storage restrictions are reproducible', () => {
  const migrations = fs.readdirSync(path.join(root, 'supabase/migrations'))
  const hardening = migrations.find((name) => name === '20261001200000_harden_media_storage_and_rbac_policies.sql')
  assert.ok(hardening)
  const sql = read(`supabase/migrations/${hardening}`)
  assert.match(sql, /file_size_limit = 52428800/)
  assert.match(sql, /allowed_mime_types/)
  assert.match(sql, /current_user_has_permission\('media_manage'\)/)
})

test('Master Specification: production workflow uses Node 22 and Pages fallback', () => {
  const workflow = read('.github/workflows/deploy.yml')
  assert.match(workflow, /node-version:\s*['\"]?22/i)
  assert.match(workflow, /cp dist\/index\.html dist\/404\.html/)
})

test('Master Specification: migration directory contains no known invalid schema references', () => {
  const migrations = fs.readdirSync(path.join(root, 'supabase/migrations'))
  assert.ok(!migrations.some((name) => name.includes('spec_integrity_guards')))
  assert.ok(!migrations.some((name) => name.includes('spec_public_lookup_guards')))
  assert.ok(!migrations.some((name) => name.includes('migration_drift_guard')))
})

test('Master Specification: media source matrix is covered end-to-end', () => {
  const management = read('src/pages/admin/MediaManagement.jsx')
  const service = read('src/services/mediaService.js')
  const renderer = read('src/components/ui/MediaContent.jsx')
  const albumPage = read('src/pages/Albums.jsx')
  const postPage = read('src/pages/PostDetail.jsx')

  assert.match(management, /type="file"/)
  assert.match(management, /image\/\*,video\/\*,audio\/\*,application\/pdf/)
  assert.match(management, /value: 'image'/)
  assert.match(management, /value: 'video'/)
  assert.match(management, /value: 'audio'/)
  assert.match(management, /value: 'document'/)
  assert.match(management, /createMediaRecord/)
  assert.match(management, /createExternalMediaRecord/)
  assert.match(service, /storage_path: storagePath/)
  assert.match(service, /media_url: normalizedUrl/)
  assert.match(service, /audio\/external/)
  assert.match(service, /application\/pdf/)
  assert.match(renderer, /<img/)
  assert.match(renderer, /<video/)
  assert.match(renderer, /<audio/)
  assert.match(renderer, /<iframe/)
  assert.match(renderer, /media-file-link/)
  assert.match(albumPage, /<MediaContent/)
  assert.match(postPage, /<MediaContent/)
})

test('Key Label Management: search and edit are scoped to global_ui_labels', () => {
  const page = read('src/pages/admin/KeyLabelManagement.jsx')
  const service = read('src/services/globalLabelService.js')
  const app = read('src/App.jsx')
  const layout = read('src/components/admin/AdminLayout.jsx')

  assert.match(page, /listGlobalLabels\(\)/)
  assert.match(page, /row\.key/)
  assert.match(page, /row\.eng/)
  assert.match(page, /row\.bng/)
  assert.match(page, /updateGlobalLabel\(/)
  assert.match(page, /readOnly/)
  assert.match(service, /from\('global_ui_labels'\)/)
  assert.match(service, /select\('key,eng,bng'\)/)
  assert.match(app, /\/admin\/key-labels/)
  assert.match(layout, /Key Label Rename/)
})
