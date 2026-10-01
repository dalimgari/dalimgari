import { describe, expect, it } from 'vitest'
import { appPath } from '../routes'

describe('appPath', () => {
  it('builds the GitHub Pages base path correctly', () => {
    const previous = import.meta.env.BASE_URL
    import.meta.env.BASE_URL = '/dalimgari/'
    expect(appPath('/posts')).toBe('/dalimgari/posts')
    import.meta.env.BASE_URL = previous
  })

  it('does not duplicate slashes', () => {
    const previous = import.meta.env.BASE_URL
    import.meta.env.BASE_URL = '/dalimgari/'
    expect(appPath('/')).toBe('/dalimgari/')
    import.meta.env.BASE_URL = previous
  })
})
