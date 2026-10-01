import { useEffect, useState } from 'react'
import { useAuth } from '../context'
import { hasPermission } from '../services/permissionService'
import { getCurrentProfile } from '../services/profileService'
import { Loading, ErrorState } from '../components/ui'

export default function ControlPanel() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = '/login'
      return
    }
    let active = true
    Promise.all([hasPermission('permission_manage'), getCurrentProfile()])
      .then(([permission, currentProfile]) => {
        if (!active) return
        setAllowed(permission)
        setProfile(currentProfile)
        setReady(true)
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError)
        setReady(true)
      })
    return () => { active = false }
  }, [status, user])

  if (status === 'loading' || !ready) return <Loading />
  if (error) return <ErrorState description={error.message || 'ড্যাশবোর্ড লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার এই ড্যাশবোর্ড ব্যবহারের অনুমতি নেই।" />

  return <main className="home-section"><div className="site-container">
    <h1>অ্যাডমিন ড্যাশবোর্ড</h1>
    <p>{profile?.display_name || user.email}</p>
  </div></main>
}
