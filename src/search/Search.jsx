import { useEffect, useRef, useState } from 'react'
import { useGlobalLabels } from '../context'
import { appPath } from '../lib/routes'
import { searchPublicContent } from './searchService'

const ICONS = {
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
}

function RuralIcon({ name }) {
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.search}</svg>
}

export default function Search() {
  const { t } = useGlobalLabels()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const searchInputRef = useRef(null)

  const searchLabel = t('search', 'খোঁজ')
  const searchPlaceholder = t('search_placeholder', 'এখানে খুঁজুন')

  useEffect(() => {
    if (!searchOpen) return undefined
    const query = searchTerm.trim()
    if (!query) {
      setSearchResults([])
      setSearchStatus('idle')
      return undefined
    }
    let active = true
    const timer = window.setTimeout(async () => {
      setSearchStatus('loading')
      try {
        const results = await searchPublicContent(query, { limit: 12 })
        if (active) {
          setSearchResults(results)
          setSearchStatus('ready')
        }
      } catch {
        if (active) {
          setSearchResults([])
          setSearchStatus('error')
        }
      }
    }, 220)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchTerm, searchOpen])

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) {
        setSearchTerm('')
        setSearchResults([])
        setSearchStatus('idle')
      }
      return !open
    })
  }

  return (
    <div className={'search-feature' + (searchOpen ? ' is-open' : '')}>
      {searchOpen ? (
        <div className="search-feature__input-wrap">
          <input
            ref={searchInputRef}
            className="search-feature__input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            autoComplete="off"
            autoFocus
          />
          {searchResults.length > 0 ? (
            <div className="search-feature__suggestions" role="listbox" aria-label={searchLabel + ' ' + t('results', 'ফলাফল')}>
              <div className="search-feature__suggestions-inner">
                {searchResults.map((result) => (
                  <a className="search-feature__result" role="option" href={appPath(result.href)} key={result.type + '-' + result.id}>
                    <span className="search-feature__result-type">{result.type === 'page' ? t('page', 'পেজ') : t('post', 'পোস্ট')}</span>
                    <strong>{result.title}</strong>
                    {result.description ? <span>{String(result.description).replace(/\s+/g, ' ').trim().slice(0, 90)}{String(result.description).trim().length > 90 ? '…' : ''}</span> : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <button className="site-header__action search-feature__button" type="button" onClick={toggleSearch} aria-label={searchOpen ? t('close', 'বন্ধ') : searchLabel} aria-expanded={searchOpen}>
        <RuralIcon name={searchOpen ? 'close' : 'search'} />
        <span>{searchOpen ? t('close', 'বন্ধ') : searchLabel}</span>
      </button>
    </div>
  )
}
