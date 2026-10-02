import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { getAdminInformation, updateAdminInformation } from '../../services/adminInformationService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Textarea, Loading, ErrorState } from '../../components/ui'

const EMPTY={name:'',email:'',phone:'',bio:'',link:'',profile_image_url:''}
export default function AdminInformationManagement(){
 const {user,status}=useAuth(); const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[values,setValues]=useState(EMPTY),[busy,setBusy]=useState(false),[error,setError]=useState(null)
 useEffect(()=>{if(status==='loading')return;if(!user){window.location.href=(import.meta.env.BASE_URL||'/')+'login';return} Promise.all([hasPermission('settings_manage'),getAdminInformation(user.id)]).then(([p,d])=>{setAllowed(p);if(d)setValues({...EMPTY,...d});setReady(true)}).catch(e=>{setError(e);setReady(true)})},[status,user])
 function change(k,v){setValues(x=>({...x,[k]:v}));setError(null)}
 async function save(e){e.preventDefault();setBusy(true);setError(null);try{const saved=await updateAdminInformation(user.id,values);setValues({...EMPTY,...saved});await createAuditLog({actionKey:'update',module:'admin_information',recordId:saved.admin_information_id,details:{fields:Object.keys(EMPTY)}})}catch(e2){setError(e2)}finally{setBusy(false)}}
 if(status==='loading'||!ready)return <Loading/>;if(!allowed)return <ErrorState description="আপনার admin information পরিবর্তনের অনুমতি নেই।"/>
 return <AdminLayout user={user} title="Admin Information"><form className="admin-form" onSubmit={save}>
  <p className="admin-intro">admin_information টেবিলের প্রতিটি editable field।</p>
  <Input id="admin-name" label="name" value={values.name} onChange={e=>change('name',e.target.value)} disabled={busy}/><Input id="admin-email" label="email" type="email" value={values.email} onChange={e=>change('email',e.target.value)} disabled={busy}/><Input id="admin-phone" label="phone" value={values.phone} onChange={e=>change('phone',e.target.value)} disabled={busy}/><Textarea id="admin-bio" label="bio" value={values.bio} onChange={e=>change('bio',e.target.value)} disabled={busy}/><Input id="admin-link" label="link" type="url" value={values.link} onChange={e=>change('link',e.target.value)} disabled={busy}/><Input id="admin-image" label="profile_image_url" type="url" value={values.profile_image_url} onChange={e=>change('profile_image_url',e.target.value)} disabled={busy}/>
  <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy?'সংরক্ষণ হচ্ছে…':'সংরক্ষণ করুন'}</Button></div>{error?<ErrorState description={error.message}/>:null}
 </form></AdminLayout>
}
