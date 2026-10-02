import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import Banner from '../components/website/Banner'
import Information from '../components/website/Information'
import PostsSection from '../components/website/PostsSection'
import AlbumsSection from '../components/website/AlbumsSection'
import HomeMediaGallery from '../components/website/HomeMediaGallery'
import VillageLocalCards from '../components/website/VillageLocalCards'
import { getWebsiteInformation } from '../services/websiteService'
import { listPublishedPosts } from '../services/postService'
import { listVisibleAlbums } from '../services/albumService'
import { listVisibleMedia } from '../services/mediaService'
import { listPublishedPages } from '../services/pageService'
import Skeleton from '../components/ui/Skeleton'
import { getHomepageSettings } from '../services/homepageService'
import { appPath } from '../lib/routes'

const NAVIGATION_ITEMS = [
  { label: 'হোম', href: '/' },
  { label: 'তথ্য', href: '/information' },
  { label: 'পোস্ট', href: '/posts' },
  { label: 'অ্যালবাম', href: '/albums' },
]

const TOPIC_ALIASES = [
  { label: 'প্রকৃতি', words: ['প্রকৃতি', 'প্রাকৃতিক', 'nature'] },
  { label: 'গ্রামবাসী', words: ['গ্রামবাসী', 'মানুষ', 'সমাজ', 'people', 'villagers'] },
  { label: 'ইতিহাস', words: ['ইতিহাস', 'history'] },
  { label: 'ঐতিহ্য', words: ['ঐতিহ্য', 'সংস্কৃতি', 'heritage', 'culture'] },
]

function pageExcerpt(content) {
  return String(content || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 115)
}

function HomePageCards({ pages = [], config = {} }) {
  if (config.enabled === false) return null
  const selected = (config.items || []).map((item) => pages.find((page) => page.page_id === item.page_id)).filter((page) => page && page.status === 'published' && page.is_visible !== false).slice(0, config.limit || 8)
  if (!selected.length) return null
  return <section className="home-section home-page-cards"><div className="site-container"><div className="section-heading"><div><p className="section-kicker">পরিচিতি</p><h2>{config.title || 'আরও জানা যাক'}</h2></div></div><div className="home-page-cards__grid" role="list" aria-label={config.title || 'হোমপেজ পেজ কার্ড'}>{selected.map((page) => <a className="home-page-card" role="listitem" href={appPath(`/pages/${encodeURIComponent(page.page_slug)}`)} key={page.page_id}><span className="home-page-card__icon" aria-hidden="true">❧</span><strong>{page.page_title}</strong><span className="home-page-card__excerpt">{pageExcerpt(page.content)}{String(page.content || '').trim().length > 115 ? '…' : ''}</span><span>বিস্তারিত পড়ুন →</span></a>)}</div></div></section>
}

function findTopicPage(pages, words) {
  return pages.find((page) => {
    const text = [page.page_title, page.page_slug].filter(Boolean).join(' ').toLowerCase()
    return words.some((word) => text.includes(word.toLowerCase()))
  })
}

function resolvePageLink(item, pages) {
  if (item?.page_id) {
    const page = pages.find((entry) => entry.page_id === item.page_id)
    if (!page) return null
    return { label: item.label || page.page_title, href: appPath(`/pages/${encodeURIComponent(page.page_slug)}`) }
  }
  if (item?.href) return { label: item.label || item.href, href: item.href }
  return null
}

function HomeTopicTabs({ pages = [], albums = [], items = null }) {
  const configured = Array.isArray(items) && items.length ? items.filter(item => item.enabled !== false) : null
  const defaultItems = [{ label: 'তথ্য', href: '/information' }]

  if (configured) {
    const links = configured.map((item) => resolvePageLink(item, pages)).filter(Boolean)
    return <nav className="home-topic-tabs site-container" aria-label="বিষয়সমূহ">
      {links.map((item) => <a className="home-topic-tab" href={item.href} key={item.href}>{item.label}</a>)}
    </nav>
  }

  TOPIC_ALIASES.forEach(({ label, words }) => {
    const page = findTopicPage(pages, words)
    if (page) {
      defaultItems.push({ label, href: `/pages/${encodeURIComponent(page.page_slug)}` })
      return
    }
    const album = albums.find((item) => {
      const text = [item.title, item.description].filter(Boolean).join(' ').toLowerCase()
      return words.some((word) => text.includes(word.toLowerCase()))
    })
    if (album) defaultItems.push({ label, href: `/albums#album-${album.album_id}` })
  })

  defaultItems.push({ label: 'ছবি ও ভিডিও', href: '#media-gallery' })

  return (
    <nav className="home-topic-tabs site-container" aria-label="বিষয়সমূহ">
      {defaultItems.map((item) => <a className="home-topic-tab" href={item.href} key={item.href}>{item.label}</a>)}
    </nav>
  )
}

export default function Home() {
  const [data, setData] = useState({ information: null, posts: [], albums: [], media: [], pages: [], homepage: null })
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    Promise.allSettled([
      getWebsiteInformation(),
      listPublishedPosts({ limit: 30 }),
      listVisibleAlbums(),
      listVisibleMedia(),
      listPublishedPages(),
      getHomepageSettings(),
    ]).then((results) => {
      if (!active) return

      const [informationResult, postsResult, albumsResult, mediaResult, pagesResult, homepageResult] = results

      setData({
        information: informationResult.status === 'fulfilled' ? informationResult.value : null,
        posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
        albums: albumsResult.status === 'fulfilled' ? albumsResult.value : [],
        media: mediaResult.status === 'fulfilled' ? mediaResult.value : [],
        pages: pagesResult.status === 'fulfilled' ? pagesResult.value : [],
        homepage: homepageResult.status === 'fulfilled' ? homepageResult.value : null,
      })
      setStatus('ready')
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <Layout navigationItems={NAVIGATION_ITEMS}>
      {status === 'loading' ? <Skeleton variant="home" /> : null}

      {data.homepage?.hero?.enabled !== false ? <Banner
        siteName={data.information?.village_name}
        slogan={data.information?.slogan}
        title={data.homepage?.hero?.title}
        subtitle={data.homepage?.hero?.subtitle}
        showSlogan={data.homepage?.hero?.showSlogan !== false}
      /> : null}
      {data.homepage?.topicTabs?.enabled !== false ? <HomeTopicTabs pages={data.pages} albums={data.albums} items={data.homepage?.topicTabs?.items} /> : null}
      {data.homepage?.pageCards ? <HomePageCards pages={data.pages} config={data.homepage.pageCards} /> : null}
      {data.homepage?.information?.enabled !== false ? <Information information={data.information} /> : null}
      <VillageLocalCards information={data.information} />
      {data.homepage?.posts?.enabled !== false ? <PostsSection posts={data.posts.slice(0, data.homepage?.posts?.limit || 6)} title={data.homepage?.posts?.title} /> : null}
      {data.homepage?.mediaGallery?.enabled !== false ? <HomeMediaGallery albums={data.albums} media={data.media} title={data.homepage?.mediaGallery?.title} subtitle={data.homepage?.mediaGallery?.subtitle} showAll={data.homepage?.mediaGallery?.showAll} albumIds={data.homepage?.mediaGallery?.albumIds} /> : null}
      {data.homepage?.albums?.enabled !== false ? <AlbumsSection albums={data.albums.slice(0, data.homepage?.albums?.limit || 4)} /> : null}
    </Layout>
  )
}
