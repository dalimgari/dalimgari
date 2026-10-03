import { useEffect, useState } from 'react'
import { getIconByKey } from '../../../services/iconManagementService'

export default function KeyIcon({ iconKey, className = 'rural-icon', alt = '', ...props }) {
  const [icon, setIcon] = useState(null)

  useEffect(() => {
    let active = true
    if (!iconKey) return undefined
    getIconByKey(iconKey).then((value) => {
      if (active) setIcon(value)
    }).catch(() => {
      if (active) setIcon(null)
    })
    return () => { active = false }
  }, [iconKey])

  if (!icon?.icon_url) return null

  return <img className={className} src={icon.icon_url} alt={alt} aria-hidden={alt ? undefined : true} {...props} />
}
