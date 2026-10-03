import { useState } from 'react'
import { Layout } from '../components/layout'
import { EmptyState, ErrorState, Loading } from '../components/ui'
import { useGlobalLabels } from '../context'
import { ROUTES, appPath } from '../lib/routes'
import { searchPublicContent } from './searchService'

export default function SearchPage() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const { t } = useGlobalLabels()

  const navigationItems = [
    { label: t('home', 'হোম'), href: ROUTES.home },
    { label: t('information', 'তথ্য'), href: ROUTES.information },
    { label: t('posts', 'পোস্ট'), href: ROUTES.posts },
    { label: t('albums', 'অ্যালবাম'), href: ROUTES.albums },
    { label: t('search', 'খুঁজুন'), href: ROUTES.search },
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    const query = term.trim()
    if (!query) { setResults([]); setStatus('idle'); return }
    setStatus('loading'); setError(null)
    try { setResults(await searchPublicContent(query, { limit: 30 })); setStatus('ready') }
    catch (requestError) { setError(requestError); setStatus('error') }
  }

  return <Layout navigationItems={navigationItems}>
    <section className="home-section"><div className="site-container">
      <h1>{t('search', 'খুঁজুন')}</h1>
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="public-search">{t('search_query_label', 'যা খুঁজছেন')}</label>
        <div className="search-form__row"><input id="public-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('search_placeholder', 'পোস্ট বা পেজের নাম লিখুন')} autoComplete="off" /><button type="submit">{t('search', 'খুঁজুন')}</button></div>
      </form>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || t('search_error', 'খোঁজার সময় সমস্যা হয়েছে।')} /> : null}
      {status === 'ready' && !results.length ? <EmptyState description={t('search_no_results', 'কোনো ফলাফল পাওয়া যায়নি।')} /> : null}
      {status === 'ready' && results.length ? <div className="content-grid">{results.map((result) => <article className="content-card" key={result.type + '-' + result.id}><p className="eyebrow">{result.type === 'page' ? t('page', 'পেজ') : t('post', 'পোস্ট')}</p><h2>{result.title}</h2>{result.description ? <p>{result.description}</p> : null}<a href={appPath(result.href)}>{t('details', 'বিস্তারিত দেখুন')}</a></article>)}</div> : null}
    </div></section>
  </Layout>
}
