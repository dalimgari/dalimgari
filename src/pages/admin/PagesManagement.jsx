import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { createPage, deletePage, listManagedPages, updatePage } from '../../services/pageService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Select, Textarea, Checkbox, Loading, ErrorState, EmptyState } from '../../components/ui'
import { validateField } from '../../forms/validation'

const EMPTY_FORM = {
  page_key: '',
  page_title: '',
  page_slug: '',
  content: '',
  status: 'draft',
  is_visible: true,
}

const FIELDS = [
  { key: 'page_key', label: 'Page Key', type: 'text', required: true },
  { key: 'page_title', label: 'পেজের শিরোনাম', type: 'text', required: true },
  { key: 'page_slug', label: 'Slug', type: 'text', required: true },
  { key: 'content', label: 'কনটেন্ট', type: 'textarea' },
]

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formFromPage(page) {
  return {
    page_key: page.page_key ?? '',
    page_title: page.page_title ?? '',
    page_slug: page.page_slug ?? '',
    content: page.content ?? '',
    status: page.status ?? 'draft',
    is_visible: page.is_visible !== false,
  }
}

export default function PagesManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [pages, setPages] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    const [permission, data] = await Promise.all([hasPermission('content_manage'), listManagedPages()])
    setAllowed(permission)
    setPages(data)
    setReady(true)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = '/login'
      return
    }
    let active = true
    load().catch((requestError) => {
      if (active) {
        setError(requestError)
        setReady(true)
      }
    })
    return () => { active = false }
  }, [status, user])

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setError(null)
  }

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function startEdit(page) {
    setEditingId(page.page_id)
    setForm(formFromPage(page))
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const validationErrors = FIELDS.flatMap((field) => validateField(field, form[field.key]))
    if (validationErrors.length) {
      setError(new Error(validationErrors.join(' | ')))
      setBusy(false)
      return
    }

    try {
      const saved = editingId ? await updatePage(editingId, form) : await createPage(form)
      await createAuditLog({
        actionKey: editingId ? 'update' : 'create',
        module: 'pages',
        recordId: saved.page_id,
        details: { page_key: saved.page_key, status: saved.status },
      })
      await load()
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(page) {
    if (!window.confirm('এই পেজটি মুছে ফেলতে চান?')) return
    setBusy(true)
    setError(null)
    try {
      await deletePage(page.page_id)
      await createAuditLog({
        actionKey: 'delete',
        module: 'pages',
        recordId: page.page_id,
        details: { page_key: page.page_key },
      })
      await load()
      if (editingId === page.page_id) {
        setEditingId(null)
        setForm(EMPTY_FORM)
      }
    } catch (requestError) {
      setError(requestError)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'পেজ ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার পেজ পরিচালনার অনুমতি নেই।" />

  return (
    <AdminLayout user={user} title="Pages Management">
      <div className="admin-toolbar">
        <p className="admin-intro">পেজ তৈরি, সম্পাদনা, প্রকাশ এবং আর্কাইভ করুন।</p>
        <Button type="button" onClick={startCreate}>নতুন পেজ</Button>
      </div>

      <div className="admin-page-grid">
        <section className="admin-form">
          <h3>{editingId ? 'পেজ সম্পাদনা' : 'নতুন পেজ'}</h3>
          <form onSubmit={handleSubmit}>
            <Input id="page-key" name="page_key" label="Page Key" value={form.page_key} onChange={(e) => change('page_key', e.target.value)} disabled={busy} required />
            <Input id="page-title" name="page_title" label="পেজের শিরোনাম" value={form.page_title} onChange={(e) => change('page_title', e.target.value)} disabled={busy} required />
            <Input id="page-slug" name="page_slug" label="Slug" value={form.page_slug} onChange={(e) => change('page_slug', e.target.value)} disabled={busy} required />
            <Button type="button" variant="secondary" onClick={() => change('page_slug', slugify(form.page_title))} disabled={busy}>শিরোনাম থেকে Slug</Button>
            <Textarea id="page-content" name="content" label="কনটেন্ট" value={form.content} onChange={(e) => change('content', e.target.value)} disabled={busy} />
            <Select id="page-status" name="status" label="স্ট্যাটাস" value={form.status} onChange={(e) => change('status', e.target.value)} options={[
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]} disabled={busy} />
            <Checkbox id="page-visible" name="is_visible" label="সাইটে দৃশ্যমান" checked={form.is_visible} onChange={(e) => change('is_visible', e.target.checked)} disabled={busy} />
            <div className="admin-form__actions">
              <Button type="submit" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</Button>
              {editingId ? <Button type="button" variant="secondary" onClick={startCreate} disabled={busy}>বাতিল</Button> : null}
            </div>
          </form>
          {error ? <ErrorState description={error.message || 'পেজ সংরক্ষণ করা যায়নি।'} /> : null}
        </section>

        <section>
          <h3>পেজ তালিকা</h3>
          {!pages.length ? <EmptyState description="এখনও কোনো পেজ তৈরি হয়নি।" /> : null}
          {pages.length ? (
            <div className="admin-list">
              {pages.map((page) => (
                <article className="admin-list__item" key={page.page_id}>
                  <div>
                    <h4>{page.page_title}</h4>
                    <p>/{page.page_slug} · {page.status} · {page.is_visible ? 'দৃশ্যমান' : 'গোপন'}</p>
                  </div>
                  <div className="admin-list__actions">
                    <Button type="button" variant="secondary" onClick={() => startEdit(page)} disabled={busy}>সম্পাদনা</Button>
                    <Button type="button" variant="secondary" onClick={() => handleDelete(page)} disabled={busy}>মুছুন</Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </AdminLayout>
  )
}
