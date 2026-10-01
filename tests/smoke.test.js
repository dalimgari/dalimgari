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
    assert.equal(pkg.scripts.test, 'node --test tests/smoke.test.js')
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
})
