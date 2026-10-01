import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = (process.env.SITE_URL || 'https://dalimgari.github.io/dalimgari').replace(/\/$/, '')
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

async function fetchPublicContent() {
  if (!supabaseUrl || !supabaseKey) return { posts: [], pages: [] }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/get_sitemap_content`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!response.ok) throw new Error(`Sitemap RPC failed: ${response.status} ${await response.text()}`)
  return response.json()
}

async function main() {
  const urls = new Set(staticRoutes.map((route) => `${baseUrl}${route === '/' ? '' : route}`))
  const content = await fetchPublicContent()

  for (const post of content.posts ?? []) {
    if (post.post_id) urls.add(`${baseUrl}/posts/${encodeURIComponent(post.post_id)}`)
  }

  for (const page of content.pages ?? []) {
    if (page.page_slug) urls.add(`${baseUrl}/pages/${encodeURIComponent(normalizePath(page.page_slug))}`)
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
