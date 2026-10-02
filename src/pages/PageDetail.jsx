import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Loading, EmptyState, ErrorState } from '../components/ui'
import { getPublishedPageBySlug } from '../services/pageService'
import { appPath } from '../lib/routes'

function ContentBlocks({ content }) {
  const blocks = String(content || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="rich-content">
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 24)}`}>{block}</p>
      ))}
    </div>
  )
}

export default function PageDetail({ slug }) {
  const [page, setPage] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getPublishedPageBySlug(slug).then((data) => { if (active) { setPage(data); setStatus('ready') } }).catch((requestError) => { if (active) { setError(requestError); setStatus('error') } })
    return () => { active = false }
  }, [slug])

  const seoDescription = page?.content ? String(page.content).replace(/\s+/g, ' ').trim().slice(0, 160) : null
  return <Layout seoTitle={page?.page_title || null} seoDescription={seoDescription} seoCanonicalPath={`/pages/${slug}`} navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' }]}>
    <section className="home-section"><div className="site-container">
      <a className="back-link" href={appPath('/')}>← হোমে ফিরে যান</a>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'পেজ লোড করা যায়নি।'} /> : null}
      {status === 'ready' && !page ? <EmptyState description="পেজটি পাওয়া যায়নি।" /> : null}
      {page ? <article className="content-card content-card--detail"><h1>{page.page_title}</h1><ContentBlocks content={page.content} /></article> : null}
    </div></section>
  </Layout>
}
