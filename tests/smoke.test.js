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
    expect(pkg.scripts.test).toBe('node --test tests/smoke.test.js')
  })

  it('keeps production deployment on main and Pages fallback enabled', async () => {
    const workflow = await read('.github/workflows/deploy.yml')
    expect(workflow).toContain('branches: [main]')
    expect(workflow).toContain('npm test')
    expect(workflow).toContain('cp dist/index.html dist/404.html')
    expect(workflow).toContain('VITE_BASE_PATH: /dalimgari/')
    expect(workflow).toContain('SITE_URL: https://dalimgari.github.io/dalimgari')
  })

  it('keeps the dedicated automated-test workflow on Node 22', async () => {
    const workflow = await read('.github/workflows/tests.yml')
    expect(workflow).toContain('node-version: 22')
    expect(workflow).toContain('run: npm test')
  })

  it('keeps the application route helper present', async () => {
    const routes = await read('src/lib/routes.js')
    expect(routes).toContain('export function appPath')
  })
})
