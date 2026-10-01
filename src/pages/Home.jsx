import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import Banner from '../components/website/Banner'
import Information from '../components/website/Information'
import PostsSection from '../components/website/PostsSection'
import AlbumsSection from '../components/website/AlbumsSection'
import { getWebsiteInformation } from '../services/websiteService'
import { listPublishedPosts } from '../services/postService'
import { listVisibleAlbums } from '../services/albumService'
import { Loading } from '../components/ui'

const NAVIGATION_ITEMS = [
  { label: 'হোম', href: '/' },
  { label: 'তথ্য', href: '/information' },
  { label: 'পোস্ট', href: '/posts' },
  { label: 'অ্যালবাম', href: '/albums' },
]

export default function Home() {
  const [data, setData] = useState({ information: null, posts: [], albums: [] })
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    Promise.allSettled([
      getWebsiteInformation(),
      listPublishedPosts({ limit: 30 }),
      listVisibleAlbums(),
    ]).then((results) => {
      if (!active) return

      const [informationResult, postsResult, albumsResult] = results

      setData({
        information: informationResult.status === 'fulfilled' ? informationResult.value : null,
        posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
        albums: albumsResult.status === 'fulfilled' ? albumsResult.value : [],
      })
      setStatus('ready')
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

      <Banner siteName={siteName} slogan={slogan} />
      <Information information={data.information} />
      <PostsSection posts={data.posts} />
      <AlbumsSection albums={data.albums} />
    </Layout>
  )
}
