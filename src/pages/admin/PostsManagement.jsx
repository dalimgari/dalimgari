import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { createPost, deletePost, listManagedPosts, listPostMedia, replacePostMedia, updatePost } from '../../services/postService'
import { listManagedAlbums } from '../../services/albumService'
import { listManagedMedia, getMediaPublicUrl } from '../../services/mediaService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Select, Textarea, Checkbox, Loading, ErrorState, EmptyState } from '../../components/ui'
import { validateField } from '../../forms/validation'

const EMPTY = { post_key: '', title: '', description: '', album_id: '', status: 'draft', is_visible: true }
const FIELDS = [
  { key: 'post_key', label: 'Post Key', type: 'text', required: true },
  { key: 'title', label: 'শিরোনাম', type: 'text', required: true },
  { key: 'description', label: 'বিবরণ', type: 'textarea' },
]

export default function PostsManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false), [mediaAllowed, setMediaAllowed] = useState(false), [ready, setReady] = useState(false)
  const [posts, setPosts] = useState([]), [albums, setAlbums] = useState([]), [media, setMedia] = useState([])
  const [selectedMediaIds, setSelectedMediaIds] = useState([])
  const [form, setForm] = useState(EMPTY), [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)

  async function load() {
    const permission = await hasPermission('content_manage')
    setAllowed(permission)
    if (permission) {
      const data = await listManagedPosts()
      setPosts(data)
    }
    const canManageMedia = await hasPermission('media_manage')
    setMediaAllowed(canManageMedia)
    if (canManageMedia) {
      const [albumData, mediaData] = await Promise.all([listManagedAlbums(), listManagedMedia()])
      setAlbums(albumData)
      setMedia(mediaData)
    }
    setReady(true)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = (import.meta.env.BASE_URL || '/') + 'login'; return }
    load().catch((e) => { setError(e); setReady(true) })
  }, [status, user])

  function change(name, value) { setForm((v) => ({ ...v, [name]: value })); setError(null) }
  async function edit(post) {
    setEditingId(post.post_id)
    setForm({ ...EMPTY, ...post, album_id: post.album_id || '' })
    setError(null)
    if (mediaAllowed) {
      try {
        const links = await listPostMedia(post.post_id)
        setSelectedMediaIds(links.map((item) => item.media_id))
      } catch (e) { setError(e) }
    } else setSelectedMediaIds([])
  }
  function reset() { setEditingId(null); setForm(EMPTY); setSelectedMediaIds([]); setError(null) }

  function toggleMedia(mediaId) {
    setSelectedMediaIds((ids) => ids.includes(mediaId) ? ids.filter((id) => id !== mediaId) : [...ids, mediaId])
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(null)
    const errors = FIELDS.flatMap((f) => validateField(f, form[f.key]))
    if (errors.length) { setError(new Error(errors.join(' | '))); setBusy(false); return }
    try {
      const saved = editingId ? await updatePost(editingId, form) : await createPost(form)
      if (mediaAllowed) await replacePostMedia(saved.post_id, selectedMediaIds)
      await createAuditLog({
        actionKey: editingId ? 'update' : 'create',
        module: 'posts',
        recordId: saved.post_id,
        details: { status: saved.status, media_count: selectedMediaIds.length },
      })
      await load()
      reset()
    } catch (e2) { setError(e2) } finally { setBusy(false) }
  }

  async function remove(post) {
    if (!window.confirm('এই পোস্টটি মুছে ফেলতে চান?')) return
    setBusy(true); setError(null)
    try {
      await deletePost(post.post_id)
      await createAuditLog({ actionKey: 'delete', module: 'posts', recordId: post.post_id, details: { post_key: post.post_key } })
      await load()
      if (editingId === post.post_id) reset()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'পোস্ট ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার পোস্ট পরিচালনার অনুমতি নেই।" />

  return <AdminLayout user={user} title="Posts Management">
    <div className="admin-toolbar"><p className="admin-intro">পোস্ট তৈরি, সম্পাদনা, প্রকাশ এবং অনুমতি থাকলে মিডিয়া সংযুক্ত করুন।</p><Button type="button" onClick={reset}>নতুন পোস্ট</Button></div>
    <div className="admin-page-grid">
      <section className="admin-form"><h3>{editingId ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h3>
        <form onSubmit={submit}>
          <Input id="post-key" label="Post Key" value={form.post_key} onChange={(e)=>change('post_key',e.target.value)} disabled={busy} required />
          <Input id="post-title" label="শিরোনাম" value={form.title} onChange={(e)=>change('title',e.target.value)} disabled={busy} required />
          <Textarea id="post-description" label="বিবরণ" value={form.description} onChange={(e)=>change('description',e.target.value)} disabled={busy} />
          <Select id="post-album" label="অ্যালবাম" value={form.album_id} onChange={(e)=>change('album_id',e.target.value)} options={[{value:'',label:'অ্যালবাম নির্বাচন নয়'}, ...albums.map((album)=>({value:album.album_id,label:album.title}))]} disabled={busy || !mediaAllowed} />
          <Select id="post-status" label="স্ট্যাটাস" value={form.status} onChange={(e)=>change('status',e.target.value)} options={[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'archived',label:'Archived'}]} disabled={busy} />
          <Checkbox id="post-visible" label="সাইটে দৃশ্যমান" checked={form.is_visible} onChange={(e)=>change('is_visible',e.target.checked)} disabled={busy} />

          {mediaAllowed ? <fieldset className="admin-media-picker">
            <legend>পোস্টের মিডিয়া</legend>
            {!media.length ? <EmptyState description="এখনও কোনো মিডিয়া নেই।" /> : <div className="admin-media-picker__grid">
              {media.map((item) => <label className="admin-media-picker__item" key={item.media_id}>
                <input type="checkbox" checked={selectedMediaIds.includes(item.media_id)} onChange={()=>toggleMedia(item.media_id)} disabled={busy} />
                {item.mime_type?.startsWith('image/') ? <img src={getMediaPublicUrl(item.storage_path)} alt={item.file_name || ''} /> : null}
                <span>{item.file_name || item.media_key}</span>
              </label>)}
            </div>}
          </fieldset> : null}

          <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</Button>{editingId ? <Button type="button" variant="secondary" onClick={reset}>বাতিল</Button> : null}</div>
        </form>
        {error ? <ErrorState description={error.message || 'পোস্ট সংরক্ষণ করা যায়নি।'} /> : null}
      </section>
      <section><h3>পোস্ট তালিকা</h3>{!posts.length ? <EmptyState description="এখনও কোনো পোস্ট তৈরি হয়নি।" /> : <div className="admin-list">{posts.map((post)=><article className="admin-list__item" key={post.post_id}><div><h4>{post.title}</h4><p>{post.status} · {post.is_visible ? 'দৃশ্যমান':'গোপন'}</p></div><div className="admin-list__actions"><Button type="button" variant="secondary" onClick={()=>edit(post)} disabled={busy}>সম্পাদনা</Button><Button type="button" variant="secondary" onClick={()=>remove(post)} disabled={busy}>মুছুন</Button></div></article>)}</div>}</section>
    </div>
  </AdminLayout>
}
