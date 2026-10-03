import { useEffect, useState } from 'react'
import { Button, Input, ErrorState } from '../ui'
import { getThemeSettings, updateThemeSettings } from '../../services/themeService'
import { createAuditLog } from '../../services/auditService'
import { usePreferences } from '../../context/PreferencesContext'

const FIELDS = [
  ['typography','headingFont','শিরোনাম Font Style'],['typography','bodyFont','মূল লেখার Font Style'],['typography','headingSize','শিরোনামের আকার'],['typography','bodySize','মূল লেখার আকার'],['typography','headingWeight','শিরোনাম ওজন'],['typography','bodyWeight','মূল লেখা ওজন'],['typography','lineHeight','লাইন উচ্চতা'],['typography','letterSpacing','Letter Spacing'],
  ['colors','primary','Primary Color'],['colors','secondary','Secondary Color'],['colors','accent','Accent Color'],['colors','text','Font Color'],['colors','heading','Heading Font Color'],['colors','muted','Muted Font Color'],['colors','background','Background Color'],['colors','surface','Surface Color'],['colors','surfaceSoft','Soft Surface Color'],['colors','border','Border Color'],['colors','focus','Focus Color'],['colors','hover','Hover Color'],
  ['states','success','সফল'],['states','warning','সতর্কতা'],['states','error','ত্রুটি'],['states','info','তথ্য'],
  ['shape','radius','Border Radius'],['shape','buttonRadius','Button Radius'],['shape','borderWidth','Border Width'],
  ['shadow','card','Card Shadow'],['shadow','dropdown','Dropdown Shadow'],['shadow','modal','Modal Shadow'],['shadow','strength','Shadow Strength'],
  ['effects','transparency','Transparency'],['effects','blur','Blur'],['effects','waterDrop','Water-Drop Effect'],['effects','waterDropOpacity','Water-Drop Opacity'],['effects','hover','Hover Effect'],['effects','transition','Transition/Animation'],
  ['components','button','Button Style'],['components','input','Input Style'],['components','card','Card Style'],['components','navigation','Navigation Style'],
  ['background','wallpaper','Wallpaper / Background'],['background','position','Background Position'],['background','size','Background Size'],['background','overlay','Background Overlay'],
  ['icons','set','Icon Style / Set'],['icons','color','Icon Color'],['icons','size','Icon Size'],['icons','strokeWidth','Icon Stroke Width'],['icons','opacity','Icon Opacity'],
  ['spacing','density','Spacing Density'],
  ['scrollbar','thumb','Scrollbar Thumb'],['scrollbar','track','Scrollbar Track'],
]

const emptyTheme = () => FIELDS.reduce((theme,[group,key]) => {
  theme[group] ||= {}
  theme[group][key] = ''
  return theme
}, {})

function normalize(theme) {
  const result = structuredClone(theme || {})
  for (const [group,key] of FIELDS) { result[group] ||= {}; result[group][key] = theme?.[group]?.[key] ?? '' }
  return result
}

function ThemeMode({ title, values, onChange, disabled }) {
  return <section className="admin-form">
    <h3>{title}</h3>
    <div className="content-grid">
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
  const [activeVisualTheme,setActiveVisualTheme] = useState('classic')
  const [error,setError] = useState(null)
  const { setVisualTheme } = usePreferences()

  useEffect(() => {
    let active = true
    getThemeSettings().then((data) => {
      if (!active) return
      setValues({day:normalize(data?.day),night:normalize(data?.night)})
      setActiveVisualTheme(data?.active_visual_theme === 'glass' ? 'glass' : 'classic')
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
      const saved = await updateThemeSettings({...values,active_visual_theme:activeVisualTheme})
      setValues({day:normalize(saved.day),night:normalize(saved.night)})
      setActiveVisualTheme(saved.active_visual_theme === 'glass' ? 'glass' : 'classic')
      await createAuditLog({actionKey:'update',module:'theme_settings',recordId:saved.theme_settings_id,details:{modes:['day','night'],fields:FIELDS.length+1}})
      window.dispatchEvent(new CustomEvent('dalimgari:theme-settings-updated'))
      setStatus('success')
    } catch (requestError) {
      setError(requestError)
      setStatus('error')
    }
  }

  if (!ready) return null
  return <form onSubmit={save}>
    <div className="admin-form__section">
      <h2>Theme Management</h2>
      <p className="admin-intro">সক্রিয় visual theme নির্বাচন করুন এবং প্রতিটি theme-এর typography, color, component, effect, background, icon ও spacing token কেন্দ্রীয়ভাবে নিয়ন্ত্রণ করুন।</p>
      <div className="admin-form">
        <h3>Theme Preset</h3>
        <div className="content-grid">
          <Button type="button" variant={activeVisualTheme==='classic'?'primary':'secondary'} disabled={status==='loading'} onClick={async()=>{try{const next=await setVisualTheme('classic');setActiveVisualTheme(next)}catch(error){setError(error)}}}>Classic Theme</Button>
          <Button type="button" variant={activeVisualTheme==='glass'?'primary':'secondary'} disabled={status==='loading'} onClick={async()=>{try{const next=await setVisualTheme('glass');setActiveVisualTheme(next)}catch(error){setError(error)}}}>Glass + Water-Drop Theme</Button>
        </div>
      </div>
      <p className="admin-intro">ডে ও নাইটের প্রতিটি রঙ, ওয়ালপেপার, অবস্থা, ইন্টার‌্যাকশন, আকার, ছায়া, লেখা ও স্ক্রলবার আলাদাভাবে নিয়ন্ত্রণ করুন।</p>
      <ThemeMode title="ডে থিম" values={values.day} onChange={(group,key,value)=>group==='wallpaper'?changeWallpaper('day',key):change('day',group,key,value)} disabled={status==='loading'} />
      <ThemeMode title="নাইট থিম" values={values.night} onChange={(group,key,value)=>group==='wallpaper'?changeWallpaper('night',key):change('night',group,key,value)} disabled={status==='loading'} />
      <div className="admin-form__actions"><Button type="submit" disabled={status==='loading'}>{status==='loading'?'সংরক্ষণ হচ্ছে…':'থিম সংরক্ষণ করুন'}</Button>{status==='success'?<span className="admin-success">ডে ও নাইট থিম সংরক্ষণ হয়েছে।</span>:null}</div>
      {status==='error'&&error?<ErrorState description={error.message||'থিম সংরক্ষণ করা যায়নি।'} />:null}
    </div>
  </form>
}
