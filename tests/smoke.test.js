import { describe, expect, it } from 'vitest'
import { appPath } from '../src/lib/routes.js'

describe('application smoke tests', () => {
  it('builds a route under the configured app base path', () => {
    expect(appPath('/posts')).toMatch(/\/posts$/)
  })

  it('keeps the application root path valid', () => {
    expect(appPath('/')).toMatch(/\/$/)
  })
})
