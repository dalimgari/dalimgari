import { useEffect, useState } from 'react'
import { useAuth } from '../context'
import { hasPermission } from '../services/permissionService'
import { getCurrentProfile } from '../services/profileService'
import { getWebsiteInformation, updateWebsiteInformation } from '../services/websiteService'
import { createAuditLog } from '../services/auditService'
import { AdminLayout } from '../components/admin'
import { Button, Input, Loading, ErrorState } from '../components/ui'
import { getInputMethod } from '../forms/inputRegistry'
import { validateField } from '../forms/validation'

const FIELDS = [
  { key: 'village_name', label: 'গ্রামের নাম', type: 'text', inputMethod: 'text' },
  { key: 'slogan', label: 'স্লোগান', type: 'text', inputMethod: 'text' },
  { key: 'division', label: 'বিভাগ', type: 'text', inputMethod: 'text' },
  { key: 'district', label: 'জেলা', type: 'text', inputMethod: 'text' },
  { key: 'upazila_name', label: 'উপজেলা', type: 'text', inputMethod: 'text' },
  { key: 'union_name', label: 'ইউনিয়ন', type: 'text', inputMethod: 'text' },
  { key: 'postal_code', label: 'পোস্ট কোড', type: 'text', inputMethod: 'text' },
  { key: 'population', label: 'জনসংখ্যা', type: 'number', inputMethod: 'number', min: 0 },
  { key: 'established_date', label: 'প্রতিষ্ঠার তারিখ', type: 'date', inputMethod: 'date' },
  { key: 'map_location', label: 'মানচিত্রের অবস্থান', type: 'text', inputMethod: 'text' },
  { key: 'copyright_text', label: 'কপিরাইট', type: 'text', inputMethod: 'text' },
]

const DEFAULT_COPYRIGHT = '© 2026. All rights reserved.'

function toFormValues(data) {
  return FIELDS.reduce((values, field) => {
    values[field.key] = data?.[field.key] ?? (field.key === 'copyright_text' ? DEFAULT_COPYRIGHT : '')
    return values
  }, {})
}

export default function ControlPanel() {
  const { user, status } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [values, setValues] = useState({})
  const [formStatus, setFormStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!user) {
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login'
      return
    }

    let active = true
    Promise.all([
      hasPermission('settings_manage'),
      getCurrentProfile(),
      getWebsiteInformation(),
    ])
      .then(([permission, currentProfile, information]) => {
        if (!active) return
        setAllowed(permission)
        setProfile(currentProfile)
        setValues(toFormValues(information))
        setReady(true)
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError)
        setReady(true)
      })

    return () => {
      active = false
    }
  }, [status, user])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFormStatus('idle')
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormStatus('loading')
    setError(null)

    const validationErrors = FIELDS.flatMap((field) => validateField(field, values[field.key]))
    if (validationErrors.length) {
      setError(new Error(validationErrors.join(' | ')))
      setFormStatus('error')
      return
    }

    try {
      const updated = await updateWebsiteInformation(values)
      setValues(toFormValues(updated))
      await createAuditLog({
        actionKey: 'update',
        module: 'website_information',
        recordId: updated.website_information_id,
        details: { fields: FIELDS.map((field) => field.key) },
      })
      setFormStatus('success')
    } catch (requestError) {
      setError(requestError)
      setFormStatus('error')
    }
  }

  if (status === 'loading' || !ready) return <Loading />
  if (error && !allowed) return <ErrorState description={error.message || 'ড্যাশবোর্ড লোড করা যায়নি।'} />
  if (!allowed) return <ErrorState description="আপনার ওয়েবসাইটের তথ্য পরিবর্তনের অনুমতি নেই।" />

  return (
    <AdminLayout user={user} title="ওয়েবসাইটের তথ্য">
      <p className="admin-intro">ওয়েবসাইটে প্রদর্শিত গ্রামের তথ্য এখান থেকে পরিবর্তন করুন।</p>
      <form className="admin-form" onSubmit={handleSubmit}>
        {FIELDS.map((field) => {
          const inputMethod = getInputMethod(field)
          return (
            <Input
              key={field.key}
              id={field.key}
              name={field.key}
              label={field.label}
              type={inputMethod}
              value={values[field.key] ?? ''}
              onChange={handleChange}
              min={field.min}
              disabled={formStatus === 'loading'}
            />
          )
        })}
        <div className="admin-form__actions">
          <Button type="submit" disabled={formStatus === 'loading'}>
            {formStatus === 'loading' ? 'সংরক্ষণ হচ্ছে…' : 'তথ্য সংরক্ষণ করুন'}
          </Button>
          {formStatus === 'success' ? <span className="admin-success">তথ্য সফলভাবে সংরক্ষণ হয়েছে।</span> : null}
        </div>
      </form>
      {formStatus === 'error' && error ? <ErrorState description={error.message || 'তথ্য সংরক্ষণ করা যায়নি।'} /> : null}
      {profile?.display_name ? <p className="admin-meta">ব্যবহারকারী: {profile.display_name}</p> : null}
    </AdminLayout>
  )
}
