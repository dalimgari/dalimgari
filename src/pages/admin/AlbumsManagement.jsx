import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { createAlbum, deleteAlbum, listManagedAlbums, updateAlbum } from '../../services/albumService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Input, Textarea, Checkbox, Loading, ErrorState, EmptyState } from '../../components/ui'
import { validateField } from '../../forms/validation'

const EMPTY = { album_key:'', title:'', description:'', is_visible:true }

export default function AlbumsManagement() {
  const { user, status } = useAuth()
  const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[albums,setAlbums]=useState([])
  const [form,setForm]=useState(EMPTY),[editingId,setEditingId]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(null)
  async function load(){const [permission,data]=await Promise.all([hasPermission('media_manage'),listManagedAlbums()]);setAllowed(permission);setAlbums(data);setReady(true)}
  useEffect(()=>{if(status==='loading')return;if(!user){window.location.href='/login';return}load().catch(e=>{setError(e);setReady(true)})},[status,user])
  function change(k,v){setForm(x=>({...x,[k]:v}));setError(null)}
  function edit(a){setEditingId(a.album_id);setForm({album_key:a.album_key,title:a.title,description:a.description||'',is_visible:a.is_visible});}
  function reset(){setEditingId(null);setForm(EMPTY);setError(null)}
  async function submit(e){e.preventDefault();setBusy(true);setError(null);const errors=[...validateField({key:'album_key',label:'Album Key',required:true},form.album_key),...validateField({key:'title',label:'শিরোনাম',required:true},form.title)];if(errors.length){setError(new Error(errors.join(' | ')));setBusy(false);return}try{const saved=editingId?await updateAlbum(editingId,form):await createAlbum(form);await createAuditLog({actionKey:editingId?'update':'create',module:'albums',recordId:saved.album_id,details:{title:saved.title}});await load();reset()}catch(e2){setError(e2)}finally{setBusy(false)}}
  async function remove(a){if(!window.confirm('এই অ্যালবামটি মুছে ফেলতে চান?'))return;setBusy(true);try{await deleteAlbum(a.album_id);await createAuditLog({actionKey:'delete',module:'albums',recordId:a.album_id,details:{title:a.title}});await load();reset()}catch(e){setError(e)}finally{setBusy(false)}}
  if(status==='loading'||!ready)return <Loading/>;if(error&&!allowed)return <ErrorState description={error.message||'অ্যালবাম ম্যানেজমেন্ট লোড করা যায়নি।'}/>;if(!allowed)return <ErrorState description="আপনার অ্যালবাম পরিচালনার অনুমতি নেই。"/>
  return <AdminLayout user={user} title="Albums Management"><div className="admin-toolbar"><p className="admin-intro">অ্যালবাম তৈরি ও পরিচালনা করুন।</p><Button onClick={reset}>নতুন অ্যালবাম</Button></div><div className="admin-page-grid"><section className="admin-form"><h3>{editingId?'অ্যালবাম সম্পাদনা':'নতুন অ্যালবাম'}</h3><form onSubmit={submit}><Input id="album-key" label="Album Key" value={form.album_key} onChange={e=>change('album_key',e.target.value)} disabled={busy} required/><Input id="album-title" label="শিরোনাম" value={form.title} onChange={e=>change('title',e.target.value)} disabled={busy} required/><Textarea id="album-description" label="বিবরণ" value={form.description} onChange={e=>change('description',e.target.value)} disabled={busy}/><Checkbox id="album-visible" label="সাইটে দৃশ্যমান" checked={form.is_visible} onChange={e=>change('is_visible',e.target.checked)} disabled={busy}/><div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy?'সংরক্ষণ হচ্ছে…':'সংরক্ষণ করুন'}</Button>{editingId?<Button type="button" variant="secondary" onClick={reset}>বাতিল</Button>:null}</div></form>{error?<ErrorState description={error.message||'অ্যালবাম সংরক্ষণ করা যায়নি।'}/>:null}</section><section><h3>অ্যালবাম তালিকা</h3>{!albums.length?<EmptyState description="এখনও কোনো অ্যালবাম তৈরি হয়নি।"/>:<div className="admin-list">{albums.map(a=><article className="admin-list__item" key={a.album_id}><div><h4>{a.title}</h4><p>{a.album_key} · {a.is_visible?'দৃশ্যমান':'গোপন'}</p></div><div className="admin-list__actions"><Button variant="secondary" onClick={()=>edit(a)}>সম্পাদনা</Button><Button variant="secondary" onClick={()=>remove(a)}>মুছুন</Button></div></article>)}</div>}</section></div></AdminLayout>
}
