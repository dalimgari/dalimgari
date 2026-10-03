import { useEffect, useRef, useState } from 'react'
import { useGlobalLabels } from '../../context'
import { appPath } from '../../lib/routes'
import { searchPublicContent } from '../../services/searchService'

const ICONS = {
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></>,
  close: <><path d="M5 5l14 14M19 5 5 19" /></>,
}

function RuralIcon({ name }) {
  return <svg className="rural-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--theme-icon-stroke-width,1.7)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.search}</svg>
}

export default function Search({ headerRef }) {
  const { t } = useGlobalLabels()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus, setSearchStatus] = useState('idle')
  const searchInputRef = useRef(null)
  const [searchSuggestionStyle, setSearchSuggestionStyle] = useState({})

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

  useEffect(() => {
    if (!searchOpen || !searchInputRef.current) {
      setSearchSuggestionStyle({})
      return undefined
    }
    const updateSearchSuggestionPosition = () => {
      const inputRect = searchInputRef.current?.getBoundingClientRect()
      const headerRect = headerRef?.current?.getBoundingClientRect()
      if (!inputRect || !headerRect) return
      setSearchSuggestionStyle({
        '--search-suggestion-left': `${inputRect.left}px`,
        '--search-suggestion-top': `${headerRect.bottom}px`,
        '--search-suggestion-width': `${inputRect.width}px`,
      })
    }
    updateSearchSuggestionPosition()
    window.addEventListener('resize', updateSearchSuggestionPosition)
    window.addEventListener('scroll', updateSearchSuggestionPosition, { passive: true })
    return () => {
      window.removeEventListener('resize', updateSearchSuggestionPosition)
      window.removeEventListener('scroll', updateSearchSuggestionPosition)
    }
  }, [searchOpen, searchTerm, headerRef])

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
    <>
      <div className={'header-search' + (searchOpen ? ' is-open' : '')}>
        {searchOpen ? (
          <div className="header-search__input-wrap">
            <input
              ref={searchInputRef}
              className="header-search__input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}
        <button className="site-header__action header-search__button" type="button" onClick={toggleSearch} aria-label={searchOpen ? t('close', 'বন্ধ') : searchLabel} aria-expanded={searchOpen}>
          <RuralIcon name={searchOpen ? 'close' : 'search'} />
          <span>{searchOpen ? t('close', 'বন্ধ') : searchLabel}</span>
        </button>
      </div>

      {searchOpen && searchResults.length > 0 ? (
        <div className="header-search-suggestions" style={searchSuggestionStyle} role="listbox" aria-label={searchLabel + ' ' + t('results', 'ফলাফল')}>
          <div className="site-container header-search-suggestions__inner">
            {searchResults.map((result) => (
              <a className="header-search__result" role="option" href={appPath(result.href)} key={result.type + '-' + result.id}>
                <span className="header-search__result-type">{result.type === 'page' ? t('page', 'পেজ') : t('post', 'পোস্ট')}</span>
                <strong>{result.title}</strong>
                {result.description ? <span>{String(result.description).replace(/\s+/g, ' ').trim().slice(0, 90)}{String(result.description).trim().length > 90 ? '…' : ''}</span> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
