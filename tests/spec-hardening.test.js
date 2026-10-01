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
