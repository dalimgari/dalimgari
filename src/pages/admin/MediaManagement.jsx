import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { listManagedMedia, createMediaRecord, deleteMediaRecord, getMediaPublicUrl } from '../../services/mediaService'
import { listManagedAlbums } from '../../services/albumService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Select, Checkbox, Loading, ErrorState, EmptyState } from '../../components/ui'

export default function MediaManagement() {
  const { user, status } = useAuth()
  const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[media,setMedia]=useState([]),[albums,setAlbums]=useState([])
  const [file,setFile]=useState(null),[albumId,setAlbumId]=useState(''),[visible,setVisible]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(null)
  async function load(){const [permission,mediaData,albumData]=await Promise.all([hasPermission('media_manage'),listManagedMedia(),listManagedAlbums()]);setAllowed(permission);setMedia(mediaData);setAlbums(albumData);setReady(true)}
  useEffect(()=>{if(status==='loading')return;if(!user){window.location.href=(import.meta.env.BASE_URL||'/')+'login';return}load().catch(e=>{setError(e);setReady(true)})},[status,user])
  async function upload(e){e.preventDefault();if(!file)return;setBusy(true);setError(null);try{const saved=await createMediaRecord({file,albumId:albumId||null,isVisible:visible});await createAuditLog({actionKey:'create',module:'media',recordId:saved.media_id,details:{file_name:saved.file_name}});setFile(null);e.currentTarget.reset();await load()}catch(e2){setError(e2)}finally{setBusy(false)}}
  async function remove(item){if(!window.confirm('এই মিডিয়াটি মুছে ফেলতে চান?'))return;setBusy(true);setError(null);try{await deleteMediaRecord(item);await createAuditLog({actionKey:'delete',module:'media',recordId:item.media_id,details:{file_name:item.file_name}});await load()}catch(e){setError(e)}finally{setBusy(false)}}
  if(status==='loading'||!ready)return <Loading/>;if(error&&!allowed)return <ErrorState description={error.message||'মিডিয়া ম্যানেজমেন্ট লোড করা যায়নি।'}/>;if(!allowed)return <ErrorState description="আপনার মিডিয়া পরিচালনার অনুমতি নেই।"/>
  return <AdminLayout user={user} title="Media Management">
    <section className="admin-form"><h3>মিডিয়া আপলোড</h3><form onSubmit={upload}>
      <label className="ui-field"><span className="ui-field__label">ছবি/ফাইল</span><input className="ui-input" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} disabled={busy} required/></label>
      <Select id="media-album" label="অ্যালবাম" value={albumId} onChange={e=>setAlbumId(e.target.value)} options={[{value:'',label:'কোনো অ্যালবাম নয়'},...albums.map(a=>({value:a.album_id,label:a.title}))]} disabled={busy}/>
      <Checkbox id="media-visible" label="সাইটে দৃশ্যমান" checked={visible} onChange={e=>setVisible(e.target.checked)} disabled={busy}/>
      <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy?'আপলোড হচ্ছে…':'আপলোড করুন'}</Button></div>
    </form>{error?<ErrorState description={error.message||'মিডিয়া আপলোড করা যায়নি।'}/>:null}</section>
    <section><h3>মিডিয়া তালিকা</h3>{!media.length?<EmptyState description="এখনও কোনো মিডিয়া নেই।"/>:<div className="media-grid admin-media-grid">{media.map(item=>{const url=item.media_url||getMediaPublicUrl(item.storage_path);return <article className="media-card admin-media-card" key={item.media_id}>{url?<img src={url} alt={item.file_name||'মিডিয়া'} loading="lazy"/>:null}<p>{item.file_name||'নাম নেই'}</p><Button variant="secondary" onClick={()=>remove(item)} disabled={busy}>মুছুন</Button></article>})}</div>}</section>
  </AdminLayout>
}
