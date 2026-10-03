import { useEffect, useState } from 'react'
import { Button, Input, ErrorState } from '../ui'
import { getThemePresets, getActiveVisualTheme, updateThemeSettings, applyThemeSettings } from '../../services/themeService'
import { createAuditLog } from '../../services/auditService'

const THEMES = [
  ['classic', 'ক্লাসিক'],
  ['glass', 'Glass'],
  ['village', 'Village'],
]

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
  for (const [group,key] of FIELDS) {
    result[group] ||= {}
    result[group][key] = theme?.[group]?.[key] ?? ''
  }
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
  const [presets,setPresets] = useState([])
  const [selectedTheme,setSelectedTheme] = useState('classic')
  const [values,setValues] = useState({day:emptyTheme(),night:emptyTheme()})
  const [ready,setReady] = useState(false)
  const [status,setStatus] = useState('idle')
  const [error,setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getThemePresets(), getActiveVisualTheme()])
      .then(([themeRows, activeTheme]) => {
        if (!active) return
        setPresets(themeRows)
        const current = themeRows.find((row) => row.theme_key === activeTheme) || themeRows[0]
        if (current) {
          setSelectedTheme(current.theme_key)
          setValues({day:normalize(current.day),night:normalize(current.night)})
        }
        setReady(true)
      })
      .catch((requestError) => { if (active) { setError(requestError); setReady(true) } })
    return () => { active = false }
  }, [])

  function getPreviewMode() {
    return document.documentElement.dataset.themeMode === 'night' ? 'night' : 'day'
  }

  function previewTheme(themeValues) {
    applyThemeSettings(themeValues, getPreviewMode())
  }

  function selectTheme(themeKey) {
    const preset = presets.find((row) => row.theme_key === themeKey)
    if (!preset) return
    const nextValues = {day:normalize(preset.day),night:normalize(preset.night)}
    setSelectedTheme(themeKey)
    setValues(nextValues)
    previewTheme(nextValues)
    setStatus('idle')
    setError(null)
  }

  function change(mode,group,key,value) {
    setValues((current) => {
      const next = {...current,[mode]:{...current[mode],[group]:{...current[mode][group],[key]:value}}}
      if (mode === getPreviewMode()) previewTheme(next)
      return next
    })
    setStatus('idle')
    setError(null)
  }

  async function save(event) {
    event.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      const saved = await updateThemeSettings({themeKey:selectedTheme,day:values.day,night:values.night})
      const normalizedSaved = {day:normalize(saved.day),night:normalize(saved.night)}
      setValues(normalizedSaved)
      setPresets((current) => current.map((preset) => preset.theme_key === selectedTheme
        ? {...preset,...saved,day:normalizedSaved.day,night:normalizedSaved.night,is_active:true}
        : {...preset,is_active:false}))
      await createAuditLog({
        actionKey:'update',
        module:'theme_settings',
        recordId:saved.theme_settings_id,
        details:{theme:selectedTheme,modes:['day','night'],fields:FIELDS.length},
      })
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
      <p className="admin-intro">তিনটি স্থায়ী theme-এর যেকোনো একটি নির্বাচন করলে সেটি সঙ্গে সঙ্গে পুরো website-এ preview হবে। এই preview Save না করা পর্যন্ত Database-এর default বা active theme পরিবর্তন করবে না।</p>
      <div className="admin-form">
        <h3>Theme Preset</h3>
        <div className="content-grid">
          {THEMES.map(([themeKey,label]) => (
            <Button key={themeKey} type="button" variant={selectedTheme===themeKey ? 'primary' : 'secondary'} disabled={status==='loading'} onClick={() => selectTheme(themeKey)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
      <p className="admin-intro">নির্বাচিত theme-এর Day ও Night configuration এখানে edit করুন। পরিবর্তন বর্তমান preview-তে সঙ্গে সঙ্গে দেখা যাবে। Save করলে কেবল তখনই নির্বাচিত theme-এর configuration সংরক্ষণ ও system-wide default করা হবে। Refresh করার আগে Save না করলে preview স্থায়ী হবে না।</p>
      <ThemeMode title="ডে থিম" values={values.day} onChange={(group,key,value)=>change('day',group,key,value)} disabled={status==='loading'} />
      <ThemeMode title="নাইট থিম" values={values.night} onChange={(group,key,value)=>change('night',group,key,value)} disabled={status==='loading'} />
      <div className="admin-form__actions">
        <Button type="submit" disabled={status==='loading'}>{status==='loading'?'সংরক্ষণ হচ্ছে…':'থিম সংরক্ষণ করুন'}</Button>
        {status==='success'?<span className="admin-success">নির্বাচিত theme সংরক্ষণ ও পুরো website-এর default করা হয়েছে।</span>:null}
      </div>
      {status==='error'&&error?<ErrorState description={error.message||'থিম সংরক্ষণ করা যায়নি।'} />:null}
    </div>
  </form>
}
