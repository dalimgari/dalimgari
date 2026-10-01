import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Loading, EmptyState, ErrorState } from '../components/ui'
import { getPublishedPageBySlug } from '../services/pageService'

export default function PageDetail({ slug }) {
  const [page, setPage] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getPublishedPageBySlug(slug).then((data) => {
      if (!active) return
      setPage(data)
      setStatus('ready')
    }).catch((requestError) => {
      if (!active) return
      setError(requestError)
      setStatus('error')
    })
    return () => { active = false }
  }, [slug])

  const seoDescription = page?.content ? String(page.content).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) : 'দালিমগাড়ীর তথ্যভিত্তিক পেজ।'

  return <Layout
    seoTitle={page?.page_title || 'পেজ'}
    seoDescription={seoDescription}
    seoCanonicalPath={`/pages/${slug}`}
    navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }]}
  >
    <section className="home-section"><div className="site-container">
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'পেজ লোড করা যায়নি।'} /> : null}
      {status === 'ready' && !page ? <EmptyState description="পেজটি পাওয়া যায়নি।" /> : null}
      {page ? <article className="content-card content-card--detail">
        <h1>{page.page_title}</h1>
        <div className="rich-content">{page.content}</div>
      </article> : null}
    </div></section>
  </Layout>
}
