import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { assignUserRole, listManagedUsers, listRoles } from '../../services/userService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Select, Loading, ErrorState, EmptyState } from '../../components/ui'

export default function UsersManagement() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    const permission = await hasPermission('user_manage')
    setAllowed(permission)
    if (!permission) {
      setReady(true)
      return
    }

    const [userData, roleData] = await Promise.all([listManagedUsers(), listRoles()])
    setUsers(userData)
    setRoles(roleData)
    setReady(true)
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login'
      return
    }
    load().catch((e) => {
      setError(e)
      setReady(true)
    })
  }, [status, user])

  async function changeRole(profileId, roleId) {
    setBusy(true)
    setError(null)
    try {
      await assignUserRole(profileId, roleId)
      await createAuditLog({ actionKey: 'role_change', module: 'user_roles', recordId: profileId, details: { role_id: roleId } })
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'ইউজার ম্যানেজমেন্ট লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার ইউজার পরিচালনার অনুমতি নেই।" />

  return (
    <AdminLayout user={user} title="Users & Roles">
      <p className="admin-intro">নিবন্ধিত ব্যবহারকারীদের ভূমিকা পরিচালনা করুন। নতুন Auth account এই প্যানেল থেকে তৈরি করা হচ্ছে না।</p>
      {!users.length ? <EmptyState description="এখনও কোনো নিবন্ধিত ব্যবহারকারী নেই।" /> : (
        <div className="admin-list">
          {users.map((item) => {
            const current = item.user_roles?.[0]?.role_id || ''
            const isProtectedAdmin = item.is_protected === true || item.email === 'dalimgariofficial@gmail.com'
            return (
              <article className="admin-list__item" key={item.profile_id}>
                <div>
                  <h4>{item.display_name || item.email || 'ব্যবহারকারী'}</h4>
                  <p>{item.email || ''}</p>
                  {isProtectedAdmin ? <p className="admin-list__status">🔒 Protected Admin</p> : null}
                </div>
                <div className="admin-list__actions">
                  <Select
                    id={'role-' + item.profile_id}
                    aria-label="ভূমিকা"
                    value={current}
                    onChange={(e) => changeRole(item.profile_id, e.target.value)}
                    options={roles.map((r) => ({ value: r.role_id, label: r.role_name }))}
                    disabled={busy || isProtectedAdmin}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}
      {error ? <ErrorState description={error.message || 'ভূমিকা পরিবর্তন করা যায়নি।'} /> : null}
    </AdminLayout>
  )
}
