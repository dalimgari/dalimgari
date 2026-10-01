import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('Master Specification hardening', () => {
  it('has no Firebase dependency or source reference', () => {
    const packageJson = read('package.json')
    expect(packageJson).not.toMatch(/firebase/i)
  })

  it('keeps media storage restrictions reproducible in migrations', () => {
    const migrations = fs.readdirSync(path.join(root, 'supabase/migrations'))
    const hardening = migrations.find((name) => name.includes('spec_hardening_media_and_audit'))
    expect(hardening).toBeTruthy()
    const sql = read(`supabase/migrations/${hardening}`)
    expect(sql).toContain("file_size_limit = 52428800")
    expect(sql).toContain("'image/*'")
    expect(sql).toContain("'application/pdf'")
    expect(sql).toContain("current_user_has_permission('media_manage')")
  })

  it('keeps the production workflow on Node 22', () => {
    const workflow = read('.github/workflows/deploy.yml')
    expect(workflow).toMatch(/node-version:\s*['\"]?22/i)
  })

  it('has a Pages SPA fallback', () => {
    const fallback = path.join(root, 'public/404.html')
    expect(fs.existsSync(fallback)).toBe(true)
    expect(read('public/404.html')).toContain('<script')
  })
})
