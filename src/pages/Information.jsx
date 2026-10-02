import { useEffect, useState } from 'react'
import { Layout } from '../components/layout'
import { Loading, EmptyState, ErrorState } from '../components/ui'
import { getWebsiteInformation } from '../services/websiteService'

const FIELDS = [['village_name','গ্রামের নাম'],['slogan','স্লোগান'],['division','বিভাগ'],['district','জেলা'],['upazila_name','উপজেলা'],['union_name','ইউনিয়ন'],['postal_code','পোস্ট কোড'],['population','জনসংখ্যা'],['established_date','প্রতিষ্ঠার তারিখ'],['map_location','মানচিত্রের অবস্থান']]

export default function InformationPage() {
  const [info,setInfo]=useState(null),[status,setStatus]=useState('loading'),[error,setError]=useState(null)
  useEffect(()=>{getWebsiteInformation().then(data=>{setInfo(data);setStatus('ready')}).catch(e=>{setError(e);setStatus('error')})},[])
  return <Layout navigationItems={[{label:'হোম',href:'/'},{label:'তথ্য',href:'/information'},{label:'পোস্ট',href:'/posts'},{label:'অ্যালবাম',href:'/albums'}]}><section className="home-section"><div className="site-container"><h1>সাধারণ তথ্য</h1>{status==='loading'?<Loading/>:null}{status==='error'?<ErrorState description={error?.message||'তথ্য লোড করা যায়নি।'}/>:null}{status==='ready'&&!info?<EmptyState description="তথ্য পাওয়া যায়নি।"/>:null}{info?<dl className="info-grid">{FIELDS.filter(([key])=>info[key]!==null&&info[key]!==undefined&&info[key]!=='').map(([key,label])=><div className="info-card" key={key}><dt>{label}</dt><dd>{String(info[key])}</dd></div>)}</dl>:null}</div></section></Layout>
}
