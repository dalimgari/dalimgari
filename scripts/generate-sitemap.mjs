import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = 'https://dalimgari.github.io/dalimgari'
const outputPath = 'public/sitemap.xml'
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const staticRoutes = ['/', '/information', '/posts', '/albums', '/search']

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function normalizePath(value) {
  return String(value).replace(/^\/+/, '').replace(/\/+$/, '')
}

async function fetchPublicRows(table, select) {
  if (!supabaseUrl || !supabaseKey) return []

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`)
  url.searchParams.set('select', select)
  url.searchParams.set('status', 'eq.published')
  url.searchParams.set('is_visible', 'eq.true')

  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Sitemap query failed for ${table}: ${response.status} ${await response.text()}`)
  }

  return response.json()
}

async function main() {
  const urls = new Set(staticRoutes.map((route) => `${baseUrl}${route}`))

  if (supabaseUrl && supabaseKey) {
    const [posts, pages] = await Promise.all([
      fetchPublicRows('posts', 'post_id'),
      fetchPublicRows('pages', 'page_slug'),
    ])

    for (const post of posts) {
      if (post.post_id) urls.add(`${baseUrl}/posts/${encodeURIComponent(post.post_id)}`)
    }

    for (const page of pages) {
      if (page.page_slug) urls.add(`${baseUrl}/pages/${encodeURIComponent(normalizePath(page.page_slug))}`)
    }
  } else {
    console.warn('Supabase build variables are unavailable; generating the static sitemap only.')
  }

  const entries = [...urls].sort().map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`

  await mkdir('public', { recursive: true })
  await writeFile(outputPath, sitemap, 'utf8')
  console.log(`Generated ${outputPath} with ${urls.size} URLs.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
