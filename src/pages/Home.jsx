import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import Banner from '../components/website/Banner'
import Information from '../components/website/Information'
import PostsSection from '../components/website/PostsSection'
import AlbumsSection from '../components/website/AlbumsSection'
import HomeMediaGallery from '../components/website/HomeMediaGallery'
import { getWebsiteInformation } from '../services/websiteService'
import { listPublishedPosts } from '../services/postService'
import { listVisibleAlbums } from '../services/albumService'
import { listVisibleMedia } from '../services/mediaService'
import { listPublishedPages } from '../services/pageService'
import Skeleton from '../components/ui/Skeleton'

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

function findTopicPage(pages, words) {
  return pages.find((page) => {
    const text = [page.page_title, page.page_slug].filter(Boolean).join(' ').toLowerCase()
    return words.some((word) => text.includes(word.toLowerCase()))
  })
}

function HomeTopicTabs({ pages = [], albums = [] }) {
  const items = [{ label: 'গ্রামের তথ্য', href: '/information' }]

  TOPIC_ALIASES.forEach(({ label, words }) => {
    const page = findTopicPage(pages, words)
    if (page) {
      items.push({ label, href: `/pages/${encodeURIComponent(page.page_slug)}` })
      return
    }
    const album = albums.find((item) => {
      const text = [item.title, item.description].filter(Boolean).join(' ').toLowerCase()
      return words.some((word) => text.includes(word.toLowerCase()))
    })
    if (album) items.push({ label, href: `/albums#album-${album.album_id}` })
  })

  items.push({ label: 'ছবি ও ভিডিও', href: '#media-gallery' })

  return (
    <nav className="home-topic-tabs site-container" aria-label="গ্রামের বিষয়সমূহ">
      {items.map((item) => <a className="home-topic-tab" href={item.href} key={item.href}>{item.label}</a>)}
    </nav>
  )
}

export default function Home() {
  const [data, setData] = useState({ information: null, posts: [], albums: [], media: [], pages: [] })
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    Promise.allSettled([
      getWebsiteInformation(),
      listPublishedPosts({ limit: 30 }),
      listVisibleAlbums(),
      listVisibleMedia(),
      listPublishedPages(),
    ]).then((results) => {
      if (!active) return

      const [informationResult, postsResult, albumsResult, mediaResult, pagesResult] = results

      setData({
        information: informationResult.status === 'fulfilled' ? informationResult.value : null,
        posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
        albums: albumsResult.status === 'fulfilled' ? albumsResult.value : [],
        media: mediaResult.status === 'fulfilled' ? mediaResult.value : [],
        pages: pagesResult.status === 'fulfilled' ? pagesResult.value : [],
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

      <Banner
        siteName={data.information?.village_name}
        slogan={data.information?.slogan}
      />
      <HomeTopicTabs pages={data.pages} albums={data.albums} />
      <Information information={data.information} />
      <PostsSection posts={data.posts} />
      <HomeMediaGallery albums={data.albums} media={data.media} />
      <AlbumsSection albums={data.albums} />
    </Layout>
  )
}
