import PROJECT_PATHS from '../src/config/projectPaths.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

test('global profile avatar fallback is centralized', async () => {
  const component = await read(PROJECT_PATHS.components.ui.profileAvatar)
  const service = await read(PROJECT_PATHS.services.profileAvatar)
  const migration = await read(PROJECT_PATHS.migrations.profileAvatarFallback)

  assert.match(component, /getDefaultProfileAvatarUrl/)
  assert.match(component, /getProfileAvatarUrl/)
  assert.match(component, /onError/)
  assert.match(component, /profile \|\| \(user \? await getCurrentProfile\(\) : null\)/)
  assert.match(service, /profile_avatar_settings/)
  assert.match(service, /profile_image_url/)
  assert.match(migration, /create table if not exists public\.profile_avatar_settings/)
  assert.match(migration, /id = 'default'/)
  assert.match(migration, /to anon, authenticated/)
})
