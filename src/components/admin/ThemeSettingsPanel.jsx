import { useEffect, useState } from 'react'
import { Button, Input, ErrorState } from '../ui'
import { getThemeSettings, updateThemeSettings } from '../../services/themeService'
import { createAuditLog } from '../../services/auditService'

const FIELDS = [
  ['colors','earth','মাটি'],['colors','earthDark','গাঢ় মাটি'],['colors','leaf','পাতা'],['colors','leafDark','গাঢ় পাতা'],
  ['colors','paddy','ধান'],['colors','field','মাঠ'],['colors','water','পানি'],['colors','clay','কাদা'],['colors','sun','রোদ'],
  ['colors','surface','কার্ড/পৃষ্ঠ'],['colors','surfaceSoft','হালকা পৃষ্ঠ'],['colors','text','লেখা'],['colors','muted','ম্লান লেখা'],
  ['colors','border','সীমানা'],['colors','focus','ফোকাস'],['colors','shadow','সাধারণ ছায়া'],['colors','header','হেডার'],
  ['colors','footer','ফুটার'],['colors','input','ইনপুট'],['colors','hover','হোভার'],
  ['states','success','সফল'],['states','warning','সতর্কতা'],['states','error','ত্রুটি'],['states','info','তথ্য'],
  ['interaction','hoverOpacity','হোভার স্বচ্ছতা'],['interaction','activeOpacity','অ্যাক্টিভ স্বচ্ছতা'],['interaction','disabledOpacity','নিষ্ক্রিয় স্বচ্ছতা'],
  ['shape','radius','সাধারণ কোণা'],['shape','buttonRadius','বাটন কোণা'],['shape','borderWidth','সীমানার পুরুত্ব'],
  ['shadow','card','কার্ড ছায়া'],['shadow','dropdown','ড্রপডাউন ছায়া'],['shadow','modal','মডাল ছায়া'],
  ['typography','headingWeight','শিরোনাম ওজন'],['typography','bodyWeight','মূল লেখা ওজন'],['typography','lineHeight','লাইন উচ্চতা'],
  ['scrollbar','thumb','স্ক্রলবার অংশ'],['scrollbar','track','স্ক্রলবার পটভূমি']
]

const emptyTheme = () => FIELDS.reduce((theme,[group,key]) => {
  theme[group] ||= {}
  theme[group][key] = ''
  return theme
}, {})

function normalize(theme) {
  const result = emptyTheme()
  for (const [group,key] of FIELDS) result[group][key] = theme?.[group]?.[key] ?? ''
  result.wallpaper = theme?.wallpaper ?? ''
  return result
}

function ThemeMode({ title, values, onChange, disabled }) {
  return <section className="admin-form">
    <h3>{title}</h3>
    <div className="content-grid">
      <Input id={title+'-wallpaper'} label="ওয়ালপেপার" name="wallpaper" type="url" value={values.wallpaper ?? ''} onChange={(event) => onChange('wallpaper',event.target.value)} disabled={disabled} placeholder="/assets/rural-bengal-wallpaper.svg" />
      {FIELDS.map(([group,key,label]) => (
        <Input key={group+'-'+key} id={title+'-'+group+'-'+key} label={label} name={key} value={values[group]?.[key] ?? ''} onChange={(event) => onChange(group,key,event.target.value)} disabled={disabled} />
      ))}
    </div>
  </section>
}

export default function ThemeSettingsPanel() {
  const [values,setValues] = useState({day:emptyTheme(),night:emptyTheme()})
  const [ready,setReady] = useState(false)
  const [status,setStatus] = useState('idle')
  const [error,setError] = useState(null)

  useEffect(() => {
    let active = true
    getThemeSettings().then((data) => {
      if (!active) return
      setValues({day:normalize(data?.day),night:normalize(data?.night)})
      setReady(true)
    }).catch((requestError) => { if (active) { setError(requestError); setReady(true) } })
    return () => { active = false }
  }, [])

  function change(mode,group,key,value) {
    setValues((current) => ({...current,[mode]:{...current[mode],[group]:{...current[mode][group],[key]:value}}}))
    setStatus('idle')
    setError(null)
  }

  function changeWallpaper(mode,value) {
    setValues((current) => ({...current,[mode]:{...current[mode],wallpaper:value}}))
    setStatus('idle')
    setError(null)
  }

  async function save(event) {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      const saved = await updateThemeSettings(values)
      setValues({day:normalize(saved.day),night:normalize(saved.night)})
      await createAuditLog({actionKey:'update',module:'theme_settings',recordId:saved.theme_settings_id,details:{modes:['day','night'],fields:FIELDS.length+1}})
      setStatus('success')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  if (!ready) return null
  return <form onSubmit={save}>
    <div className="admin-form__section">
      <h2>থিমের সাজ</h2>
      <p className="admin-intro">ডে ও নাইটের প্রতিটি রঙ, ওয়ালপেপার, অবস্থা, ইন্টার‌্যাকশন, আকার, ছায়া, লেখা ও স্ক্রলবার আলাদাভাবে নিয়ন্ত্রণ করুন।</p>
      <ThemeMode title="ডে থিম" values={values.day} onChange={(group,key,value)=>group==='wallpaper'?changeWallpaper('day',key):change('day',group,key,value)} disabled={status==='loading'} />
      <ThemeMode title="নাইট থিম" values={values.night} onChange={(group,key,value)=>group==='wallpaper'?changeWallpaper('night',key):change('night',group,key,value)} disabled={status==='loading'} />
      <div className="admin-form__actions"><Button type="submit" disabled={status==='loading'}>{status==='loading'?'সংরক্ষণ হচ্ছে…':'থিম সংরক্ষণ করুন'}</Button>{status==='success'?<span className="admin-success">ডে ও নাইট থিম সংরক্ষণ হয়েছে।</span>:null}</div>
      {status==='error'&&error?<ErrorState description={error.message||'থিম সংরক্ষণ করা যায়নি।'} />:null}
    </div>
  </form>
}
