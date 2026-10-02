import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getRuralVisualSettings, updateRuralVisualSettings } from '../../services/websiteService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Textarea, Checkbox, Loading, ErrorState } from '../../components/ui'

const EMPTY = { wallpaper_url:'', wallpaper_mobile_url:'', wallpaper_day_url:'', wallpaper_day_mobile_url:'', wallpaper_night_url:'', wallpaper_night_mobile_url:'', wallpaper_overlay:'natural', wallpaper_position:'center center', wallpaper_size:'cover', icon_set:{}, text_styles:{}, component_styles:{}, custom_css:{}, is_active:true }
const JSON_FIELDS = ['icon_set','text_styles','component_styles','custom_css']
function normalize(data){ const out={...EMPTY,...data}; JSON_FIELDS.forEach(k=>{out[k]=JSON.stringify(data?.[k] ?? {},null,2)}); return out }
function payload(values){ const out={...values}; JSON_FIELDS.forEach(k=>{try{out[k]=JSON.parse(values[k]||'{}')}catch{throw new Error(`${k} এর JSON সঠিক নয়।`)}}); return out }

export default function RuralVisualManagement(){
 const {user,status}=useAuth(); const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[values,setValues]=useState(EMPTY),[busy,setBusy]=useState(false),[error,setError]=useState(null)
 useEffect(()=>{if(status==='loading')return;if(!user){window.location.href=(import.meta.env.BASE_URL||'/')+'login';return} Promise.all([hasPermission('settings_manage'),getRuralVisualSettings()]).then(([p,d])=>{setAllowed(p);if(d)setValues(normalize(d));setReady(true)}).catch(e=>{setError(e);setReady(true)})},[status,user])
 function change(name,value){setValues(v=>({...v,[name]:value}));setError(null)}
 async function save(e){e.preventDefault();setBusy(true);setError(null);try{const saved=await updateRuralVisualSettings(payload(values));setValues(normalize(saved));await createAuditLog({actionKey:'update',module:'rural_visual_settings',recordId:saved.visual_settings_id,details:{fields:Object.keys(EMPTY)}})}catch(e2){setError(e2)}finally{setBusy(false)}}
 if(status==='loading'||!ready)return <Loading/>;if(!allowed)return <ErrorState description="আপনার ভিজ্যুয়াল সেটিংস পরিবর্তনের অনুমতি নেই।"/>
 return <AdminLayout user={user} title="গ্রামীণ ভিজ্যুয়াল সেটিংস"><form className="admin-form" onSubmit={save}>
  <p className="admin-intro">DB-এর rural_visual_settings-এর প্রতিটি editable field এখানে রাখা হয়েছে। JSON field-গুলোও সম্পূর্ণ editable।</p>
  {['wallpaper_url','wallpaper_mobile_url','wallpaper_day_url','wallpaper_day_mobile_url','wallpaper_night_url','wallpaper_night_mobile_url','wallpaper_overlay','wallpaper_position','wallpaper_size'].map(k=><Input key={k} id={k} name={k} label={k} value={values[k]??''} onChange={e=>change(k,e.target.value)} disabled={busy}/>) }
  {JSON_FIELDS.map(k=><Textarea key={k} id={k} name={k} label={k} value={values[k]??'{}'} onChange={e=>change(k,e.target.value)} disabled={busy}/>) }
  <Checkbox id="visual-active" label="is_active" checked={values.is_active!==false} onChange={e=>change('is_active',e.target.checked)} disabled={busy}/>
  <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy?'সংরক্ষণ হচ্ছে…':'সংরক্ষণ করুন'}</Button></div>{error?<ErrorState description={error.message}/>:null}
 </form></AdminLayout>
}
