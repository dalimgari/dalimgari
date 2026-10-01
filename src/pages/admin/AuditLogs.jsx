import { useEffect, useState } from 'react'
import { useAuth } from '../../context'
import { hasPermission } from '../../services/permissionService'
import { supabase } from '../../lib/supabase'
import { AdminLayout } from '../../components/admin'
import { Loading, ErrorState, EmptyState } from '../../components/ui'

export default function AuditLogs() {
  const { user, status } = useAuth()
  const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false),[logs,setLogs]=useState([]),[error,setError]=useState(null)
  useEffect(()=>{if(status==='loading')return;if(!user){window.location.href='/login';return}Promise.all([hasPermission('audit_view'),supabase.from('audit_logs').select('audit_log_id,action_key,module,record_id,details,created_at,profiles(display_name,email)').order('created_at',{ascending:false}).limit(100)]).then(([permission,result])=>{if(result.error)throw result.error;setAllowed(permission);setLogs(result.data||[]);setReady(true)}).catch(e=>{setError(e);setReady(true)})},[status,user])
  if(status==='loading'||!ready)return <Loading/>;if(error&&!allowed)return <ErrorState description={error.message||'অডিট লগ লোড করা যায়নি।'}/>;if(!allowed)return <ErrorState description="আপনার অডিট লগ দেখার অনুমতি নেই।"/>
  return <AdminLayout user={user} title="Audit Logs"><p className="admin-intro">সাম্প্রতিক প্রশাসনিক কার্যক্রমের রেকর্ড।</p>{!logs.length?<EmptyState description="এখনও কোনো অডিট লগ নেই।"/>:<div className="admin-list">{logs.map(log=><article className="admin-list__item" key={log.audit_log_id}><div><h4>{log.module||'সিস্টেম'} · {log.action_key}</h4><p>{log.profiles?.display_name||log.profiles?.email||'অজানা ব্যবহারকারী'} · {new Date(log.created_at).toLocaleString('bn-BD')}</p><p>{JSON.stringify(log.details)}</p></div></article>)}</div>}</AdminLayout>
}
