import { describe, expect, it } from 'node:test'
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
    expect(typeof pkg.scripts.build).toBe('string')
    expect(pkg.scripts.test).toBe('node --test tests/**/*.test.js')
  })

  it('keeps the production workflow pointed at main', async () => {
    const workflow = await read('.github/workflows/deploy.yml')
    expect(workflow).toContain('branches: [main]')
  })

  it('keeps the application route helper present', async () => {
    const routes = await read('src/lib/routes.js')
    expect(routes).toContain('export function appPath')
  })
})
