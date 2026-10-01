import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { createPost, deletePost, listManagedPosts, updatePost } from '../../services/postService'
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
  const [allowed, setAllowed] = useState(false), [ready, setReady] = useState(false)
  const [posts, setPosts] = useState([]), [albums, setAlbums] = useState([])
  const [form, setForm] = useState(EMPTY), [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)

  async function load() {
    const [permission, data] = await Promise.all([hasPermission('content_manage'), listManagedPosts()])
    setAllowed(permission); setPosts(data); setReady(true)
  }
  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = '/login'; return }
    load().catch((e) => { setError(e); setReady(true) })
  }, [status, user])

  function change(name, value) { setForm((v) => ({ ...v, [name]: value })); setError(null) }
  function edit(post) { setEditingId(post.post_id); setForm({...EMPTY, ...post, album_id: post.album_id || ''}); setError(null) }
  function reset() { setEditingId(null); setForm(EMPTY); setError(null) }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(null)
    const errors = FIELDS.flatMap((f) => validateField(f, form[f.key]))
    if (errors.length) { setError(new Error(errors.join(' | '))); setBusy(false); return }
    try {
      const saved = editingId ? await updatePost(editingId, form) : await createPost(form)
      await createAuditLog({ actionKey: editingId ? 'update' : 'create', module: 'posts', recordId: saved.post_id, details: { status: saved.status } })
      await load(); reset()
    } catch (e2) { setError(e2) } finally { setBusy(false) }
  }
  async function remove(post) {
    if (!window.confirm('এই পোস্টটি মুছে ফেলতে চান?')) return
    setBusy(true); setError(null)
    try { await deletePost(post.post_id); await createAuditLog({ actionKey: 'delete', module: 'posts', recordId: post.post_id, details: { post_key: post.post_key } }); await load(); if (editingId === post.post_id) reset() }
    catch (e) { setError(e) } finally { setBusy(false) }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'পোস্ট ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার পোস্ট পরিচালনার অনুমতি নেই।" />
  return <AdminLayout user={user} title="Posts Management">
    <div className="admin-toolbar"><p className="admin-intro">পোস্ট তৈরি, সম্পাদনা ও প্রকাশ করুন।</p><Button type="button" onClick={reset}>নতুন পোস্ট</Button></div>
    <div className="admin-page-grid">
      <section className="admin-form"><h3>{editingId ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h3>
        <form onSubmit={submit}>
          <Input id="post-key" label="Post Key" value={form.post_key} onChange={(e)=>change('post_key',e.target.value)} disabled={busy} required />
          <Input id="post-title" label="শিরোনাম" value={form.title} onChange={(e)=>change('title',e.target.value)} disabled={busy} required />
          <Textarea id="post-description" label="বিবরণ" value={form.description} onChange={(e)=>change('description',e.target.value)} disabled={busy} />
          <Select id="post-status" label="স্ট্যাটাস" value={form.status} onChange={(e)=>change('status',e.target.value)} options={[{value:'draft',label:'Draft'},{value:'published',label:'Published'},{value:'archived',label:'Archived'}]} disabled={busy} />
          <Checkbox id="post-visible" label="সাইটে দৃশ্যমান" checked={form.is_visible} onChange={(e)=>change('is_visible',e.target.checked)} disabled={busy} />
          <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</Button>{editingId ? <Button type="button" variant="secondary" onClick={reset}>বাতিল</Button> : null}</div>
        </form>
        {error ? <ErrorState description={error.message || 'পোস্ট সংরক্ষণ করা যায়নি।'} /> : null}
      </section>
      <section><h3>পোস্ট তালিকা</h3>{!posts.length ? <EmptyState description="এখনও কোনো পোস্ট তৈরি হয়নি।" /> : <div className="admin-list">{posts.map((post)=><article className="admin-list__item" key={post.post_id}><div><h4>{post.title}</h4><p>{post.status} · {post.is_visible ? 'দৃশ্যমান':'গোপন'}</p></div><div className="admin-list__actions"><Button type="button" variant="secondary" onClick={()=>edit(post)} disabled={busy}>সম্পাদনা</Button><Button type="button" variant="secondary" onClick={()=>remove(post)} disabled={busy}>মুছুন</Button></div></article>)}</div>}</section>
    </div>
  </AdminLayout>
}
