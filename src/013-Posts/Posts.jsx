import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout'
import { Loading, EmptyState, ErrorState } from '../../components/ui'
import { listPublishedPosts } from '../../services/postService'
import { appPath } from '../../lib/routes'

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    listPublishedPosts({ limit: 30 })
      .then((data) => { if (active) { setPosts(data); setStatus('ready') } })
      .catch((requestError) => { if (active) { setError(requestError); setStatus('error') } })
    return () => { active = false }
  }, [])

  return (
    <Layout navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' }] }>
      <section className="home-section"><div className="site-container">
        <h1>পোস্ট</h1>
        {status === 'loading' ? <Loading /> : null}
        {status === 'error' ? <ErrorState description={error?.message || 'পোস্ট লোড করা যায়নি।'} /> : null}
        {status === 'ready' && !posts.length ? <EmptyState description="এখনও কোনো প্রকাশিত পোস্ট নেই।" /> : null}
        {status === 'ready' && posts.length ? <div className="content-grid">
          {posts.map((post) => <article className="content-card" key={post.post_id}>
            <h2>{post.title}</h2>
            {post.description ? <p>{post.description}</p> : null}
            <a className="ui-button ui-button--primary content-card__link" href={appPath(`/posts/${encodeURIComponent(post.post_id)}`)}>বিস্তারিত দেখুন</a>
          </article>)}
        </div> : null}
      </div></section>
    </Layout>
  )
}
