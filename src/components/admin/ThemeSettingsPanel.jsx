import { useEffect, useState } from 'react'
import { Button, Input, ErrorState } from '../ui'
import { getThemePresets, getActiveVisualTheme, updateThemeSettings } from '../../services/themeService'
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

  function selectTheme(themeKey) {
    const preset = presets.find((row) => row.theme_key === themeKey)
    if (!preset) return
    setSelectedTheme(themeKey)
    setValues({day:normalize(preset.day),night:normalize(preset.night)})
    setStatus('idle')
    setError(null)
  }

  function change(mode,group,key,value) {
    setValues((current) => ({...current,[mode]:{...current[mode],[group]:{...current[mode][group],[key]:value}}}))
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
      <p className="admin-intro">তিনটি স্থায়ী theme-এর যেকোনো একটি নির্বাচন করলে Database থেকে তার saved configuration নিচের ঘরগুলোতে স্বয়ংক্রিয়ভাবে দেখাবে। পরিবর্তন করে Save করলে নির্বাচিত theme-ই পুরো website-এর default ও active theme হবে।</p>
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
      <p className="admin-intro">নির্বাচিত theme-এর Day ও Night configuration এখানে edit করুন। Save করলে নির্বাচিত theme-এর data সংরক্ষণ হবে এবং একই সঙ্গে সেটিই system-wide default হবে।</p>
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
