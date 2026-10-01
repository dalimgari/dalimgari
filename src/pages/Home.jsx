import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import Banner from '../components/website/Banner'
import Information from '../components/website/Information'
import PostsSection from '../components/website/PostsSection'
import AlbumsSection from '../components/website/AlbumsSection'
import { getWebsiteInformation } from '../services/websiteService'
import { listPublishedPosts } from '../services/postService'
import { listVisibleAlbums } from '../services/albumService'
import { Loading, ErrorState } from '../components/ui'

const NAVIGATION_ITEMS = [
  { label: 'হোম', href: '/' },
  { label: 'তথ্য', href: '/information' },
  { label: 'পোস্ট', href: '/posts' },
  { label: 'অ্যালবাম', href: '/albums' },
]

export default function Home() {
  const [data, setData] = useState({ information: null, posts: [], albums: [] })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    Promise.all([
      getWebsiteInformation(),
      listPublishedPosts({ limit: 30 }),
      listVisibleAlbums(),
    ])
      .then(([information, posts, albums]) => {
        if (!active) return
        setData({ information, posts, albums })
        setStatus('ready')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError)
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  const siteName = data.information?.village_name || 'দালিমগাড়ী'
  const slogan = data.information?.slogan || ''
  const copyrightText = data.information?.copyright_text || '© 2026. All rights reserved.'

  return (
    <Layout
      siteName={siteName}
      slogan={slogan}
      navigationItems={NAVIGATION_ITEMS}
      copyrightText={copyrightText}
    >
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? (
        <ErrorState description={error?.message || 'তথ্য লোড করা যায়নি।'} />
      ) : null}
      {status === 'ready' ? (
        <>
          <Banner siteName={siteName} slogan={slogan} />
          <Information information={data.information} />
          <PostsSection posts={data.posts} />
          <AlbumsSection albums={data.albums} />
        </>
      ) : null}
    </Layout>
  )
}
