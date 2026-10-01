import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { listManagedMedia, createMediaRecord, createExternalMediaRecord, updateMediaRecord, deleteMediaRecord, getMediaPublicUrl } from '../../services/mediaService'
import { listManagedAlbums } from '../../services/albumService'
import { createAuditLog } from '../../services/auditService'
import { AdminLayout } from '../../components/admin'
import { Button, Select, Checkbox, Input, Loading, ErrorState, EmptyState } from '../../components/ui'

export default function MediaManagement() {
  const { user, status } = useAuth()
  const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[media,setMedia]=useState([]),[albums,setAlbums]=useState([])
  const [file,setFile]=useState(null),[url,setUrl]=useState(''),[mediaType,setMediaType]=useState('image'),[albumId,setAlbumId]=useState(''),[visible,setVisible]=useState(true),[editingId,setEditingId]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(null)
  async function load(){const [permission,mediaData,albumData]=await Promise.all([hasPermission('media_manage'),listManagedMedia(),listManagedAlbums()]);setAllowed(permission);setMedia(mediaData);setAlbums(albumData);setReady(true)}
  useEffect(()=>{if(status==='loading')return;if(!user){window.location.href=(import.meta.env.BASE_URL||'/')+'login';return}load().catch(e=>{setError(e);setReady(true)})},[status,user])
  function reset(){setFile(null);setUrl('');setMediaType('image');setAlbumId('');setVisible(true);setEditingId(null)}
  function edit(item){setEditingId(item.media_id);setUrl(item.media_url||'');setMediaType(item.media_type==='video'?'video':'image');setAlbumId(item.album_id||'');setVisible(item.is_visible);setFile(null)}
  async function submit(e){e.preventDefault();setBusy(true);setError(null);try{
    let saved
    if(editingId){saved=await updateMediaRecord(editingId,{media_url:url||null,media_type:mediaType,album_id:albumId,is_visible:visible,file_name:media.find(x=>x.media_id===editingId)?.file_name})}
    else if(file){saved=await createMediaRecord({file,albumId:albumId||null,isVisible:visible})}
    else {saved=await createExternalMediaRecord({url,mediaType,fileName:'external-media',albumId:albumId||null,isVisible:visible})}
    await createAuditLog({actionKey:editingId?'update':'create',module:'media',recordId:saved.media_id,details:{media_type:saved.media_type,file_name:saved.file_name}})
    reset();await load()
  }catch(e2){setError(e2)}finally{setBusy(false)}}
  async function remove(item){if(!window.confirm('এই মিডিয়াটি মুছে ফেলতে চান?'))return;setBusy(true);setError(null);try{await deleteMediaRecord(item);await createAuditLog({actionKey:'delete',module:'media',recordId:item.media_id,details:{file_name:item.file_name}});await load()}catch(e){setError(e)}finally{setBusy(false)}}
  if(status==='loading'||!ready)return <Loading/>;if(error&&!allowed)return <ErrorState description={error.message||'মিডিয়া ম্যানেজমেন্ট লোড করা যায়নি।'}/>;if(!allowed)return <ErrorState description="আপনার মিডিয়া পরিচালনার অনুমতি নেই।"/>
  return <AdminLayout user={user} title="Media Management">
    <section className="admin-form"><h3>{editingId?'মিডিয়া সম্পাদনা':'মিডিয়া যোগ করুন'}</h3><form onSubmit={submit}>
      {!editingId?<label className="ui-field"><span className="ui-field__label">ছবি/ভিডিও ফাইল</span><input className="ui-input" type="file" accept="image/*,video/*" onChange={e=>setFile(e.target.files?.[0]||null)} disabled={busy}/></label>:null}
      <Input id="media-url" label="বাহিরের মিডিয়া লিংক (ঐচ্ছিক)" type="url" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy} placeholder="https://..." />
      <Select id="media-type" label="মিডিয়ার ধরন" value={mediaType} onChange={e=>setMediaType(e.target.value)} options={[{value:'image',label:'ছবি'},{value:'video',label:'ভিডিও'}]} disabled={busy}/>
      <Select id="media-album" label="অ্যালবাম" value={albumId} onChange={e=>setAlbumId(e.target.value)} options={[{value:'',label:'কোনো অ্যালবাম নয়'},...albums.map(a=>({value:a.album_id,label:a.title}))]} disabled={busy}/>
      <Checkbox id="media-visible" label="সাইটে দৃশ্যমান" checked={visible} onChange={e=>setVisible(e.target.checked)} disabled={busy}/>
      <div className="admin-form__actions"><Button type="submit" disabled={busy}>{busy?'সংরক্ষণ হচ্ছে…':editingId?'আপডেট করুন':'যোগ করুন'}</Button>{editingId?<Button type="button" variant="secondary" onClick={reset}>বাতিল</Button>:null}</div>
    </form>{error?<ErrorState description={error.message||'মিডিয়া সংরক্ষণ করা যায়নি।'}/>:null}</section>
    <section><h3>মিডিয়া তালিকা</h3>{!media.length?<EmptyState description="এখনও কোনো মিডিয়া নেই।"/>:<div className="media-grid admin-media-grid">{media.map(item=>{const mediaUrl=item.media_url||getMediaPublicUrl(item.storage_path);return <article className="media-card admin-media-card" key={item.media_id}>{mediaUrl&&item.media_type==='video'?<iframe src={mediaUrl.includes('youtube.com/watch?v=')?mediaUrl.replace('watch?v=','embed/'):mediaUrl} title={item.file_name||'ভিডিও'} loading="lazy" allowFullScreen/>:mediaUrl?<img src={mediaUrl} alt={item.file_name||'মিডিয়া'} loading="lazy"/>:null}<p>{item.file_name||'নাম নেই'}</p><div className="admin-list__actions"><Button variant="secondary" onClick={()=>edit(item)} disabled={busy}>সম্পাদনা</Button><Button variant="secondary" onClick={()=>remove(item)} disabled={busy}>মুছুন</Button></div></article>})}</div>}</section>
  </AdminLayout>
}
