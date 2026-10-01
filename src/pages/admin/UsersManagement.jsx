import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { assignUserRole, inviteUser, listManagedUsers, listRoles } from '../../services/userService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Select, Loading, ErrorState, EmptyState } from '../../components/ui'

export default function UsersManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  async function load() {
    const permission = await hasPermission('user_manage')
    setAllowed(permission)
    if (!permission) { setReady(true); return }
    const [userData, roleData] = await Promise.all([listManagedUsers(), listRoles()])
    setUsers(userData); setRoles(roleData); setReady(true)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!user) { window.location.href = (import.meta.env.BASE_URL || '/') + 'login'; return }
    load().catch((e) => { setError(e); setReady(true) })
  }, [status, user])

  async function changeRole(profileId, roleId) {
    setBusy(true); setError(null)
    try { await assignUserRole(profileId, roleId); await createAuditLog({ actionKey: 'role_change', module: 'user_roles', recordId: profileId, details: { role_id: roleId } }); await load() }
    catch (e) { setError(e) } finally { setBusy(false) }
  }

  async function handleInvite(event) {
    event.preventDefault(); setBusy(true); setError(null); setInviteMessage('')
    try {
      const invited = await inviteUser(inviteEmail.trim(), inviteName.trim())
      await createAuditLog({ actionKey: 'invite', module: 'users', recordId: invited?.id || null, details: { email: inviteEmail.trim() } })
      setInviteEmail(''); setInviteName(''); setInviteMessage('আমন্ত্রণ ইমেইল পাঠানো হয়েছে।')
      await load()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'ইউজার ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার ইউজার পরিচালনার অনুমতি নেই।" />

  return <AdminLayout user={user} title="Users & Roles">
    <p className="admin-intro">নিবন্ধিত ব্যবহারকারীদের ভূমিকা পরিচালনা করুন এবং নতুন ব্যবহারকারীকে নিরাপদ আমন্ত্রণ পাঠান।</p>
    <section className="admin-form user-invite-form">
      <h3>নতুন ব্যবহারকারী আমন্ত্রণ</h3>
      <form onSubmit={handleInvite}>
        <Input id="invite-email" name="invite_email" type="email" label="ইমেইল" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={busy} required />
        <Input id="invite-name" name="invite_name" label="নাম (ঐচ্ছিক)" value={inviteName} onChange={(e) => setInviteName(e.target.value)} disabled={busy} />
        <Button type="submit" disabled={busy}>{busy ? 'পাঠানো হচ্ছে…' : 'আমন্ত্রণ পাঠান'}</Button>
      </form>
      {inviteMessage ? <p className="admin-success">{inviteMessage}</p> : null}
    </section>
    {!users.length ? <EmptyState description="এখনও কোনো নিবন্ধিত ব্যবহারকারী নেই।" /> : <div className="admin-list">
      {users.map((item) => {
        const current = item.user_roles?.[0]?.role_id || ''
        const isProtectedAdmin = item.is_protected === true
        return <article className="admin-list__item" key={item.profile_id}>
          <div><h4>{item.display_name || item.email || 'ব্যবহারকারী'}</h4><p>{item.email || ''}</p>{isProtectedAdmin ? <p className="admin-list__status">🔒 Protected Admin</p> : null}</div>
          <div className="admin-list__actions"><Select id={'role-' + item.profile_id} aria-label="ভূমিকা" value={current} onChange={(e) => changeRole(item.profile_id, e.target.value)} options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))} disabled={busy || isProtectedAdmin} /></div>
        </article>
      })}
    </div>}
    {error ? <ErrorState description={error.message || 'ব্যবহারকারী পরিবর্তন করা যায়নি।'} /> : null}
  </AdminLayout>
}
