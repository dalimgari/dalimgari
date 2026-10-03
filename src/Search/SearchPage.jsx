import { useState } from 'react'
import { Layout } from '../components/layout'
import { EmptyState, ErrorState, Loading } from '../components/ui'
import { searchPublicContent } from '../services/searchService'
import { appPath } from '../lib/routes'

const NAVIGATION_ITEMS = [
  { label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' },
  { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' },
]

export default function Search() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const query = term.trim()
    if (!query) { setResults([]); setStatus('idle'); return }
    setStatus('loading'); setError(null)
    try { setResults(await searchPublicContent(query, { limit: 30 })); setStatus('ready') }
    catch (requestError) { setError(requestError); setStatus('error') }
  }

  return <Layout navigationItems={NAVIGATION_ITEMS}>
    <section className="home-section"><div className="site-container">
      <h1>খুঁজুন</h1>
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="public-search">যা খুঁজছেন</label>
        <div className="search-form__row"><input id="public-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="পোস্ট বা পেজের নাম লিখুন" autoComplete="off" /><button type="submit">খুঁজুন</button></div>
      </form>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'খোঁজার সময় সমস্যা হয়েছে।'} /> : null}
      {status === 'ready' && !results.length ? <EmptyState description="কোনো ফলাফল পাওয়া যায়নি।" /> : null}
      {status === 'ready' && results.length ? <div className="content-grid">{results.map((result) => <article className="content-card" key={result.type + '-' + result.id}><p className="eyebrow">{result.type === 'page' ? 'পেজ' : 'পোস্ট'}</p><h2>{result.title}</h2>{result.description ? <p>{result.description}</p> : null}<a href={appPath(result.href)}>বিস্তারিত দেখুন</a></article>)}</div> : null}
    </div></section>
  </Layout>
}
