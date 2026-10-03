import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Loading, EmptyState, ErrorState, MediaContent } from '../components/ui'
import { getPublishedPostById } from '../services/postService'
import { appPath } from '../lib/routes'
import MediaViewer from '../components/global components/media-viewer/MediaViewer'

export default function PostDetail({ postId }) {
  const [post, setPost] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let active = true
    getPublishedPostById(postId).then((data) => {
      if (!active) return
      setPost(data); setStatus('ready')
    }).catch((requestError) => {
      if (!active) return
      setError(requestError); setStatus('error')
    })
    return () => { active = false }
  }, [postId])

  const seoDescription = post?.description ? post.description.slice(0, 160) : null

  return <Layout seoTitle={post?.title || null} seoDescription={seoDescription} seoCanonicalPath={`/posts/${postId}`} navigationItems={[{ label: 'হোম', href: '/' }, { label: 'তথ্য', href: '/information' }, { label: 'পোস্ট', href: '/posts' }, { label: 'অ্যালবাম', href: '/albums' }, { label: 'সার্চ', href: '/search' }]}>
    <section className="home-section"><div className="site-container">
      <a className="back-link" href={appPath('/posts')}>← পোস্ট তালিকায় ফিরে যান</a>
      {status === 'loading' ? <Loading /> : null}
      {status === 'error' ? <ErrorState description={error?.message || 'পোস্ট লোড করা যায়নি।'} /> : null}
      {status === 'ready' && !post ? <EmptyState description="পোস্টটি পাওয়া যায়নি।" /> : null}
      {post ? <article className="content-card content-card--detail">
        <h1>{post.title}</h1>
        {post.published_at ? <p className="content-meta">{new Date(post.published_at).toLocaleDateString('bn-BD')}</p> : null}
        {post.description ? <p>{post.description}</p> : null}
        {post.media?.length ? <div className="media-grid">
          {post.media.map((media) => <figure className="media-card" key={media.media_id}><MediaContent media={media} title={media.file_name || post.title} onImageOpen={setViewer} /></figure>)}
        </div> : null}
      </article> : null}
      {viewer ? <MediaViewer {...viewer} onClose={() => setViewer(null)} /> : null}
    </div></section>
  </Layout>
}
