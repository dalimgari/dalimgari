import { useEffect, useState } from 'react'
import { getGlobalLabels, updateGlobalLabel } from '../../services/globalLabelService'
import { createAuditLog } from '../../services/auditService'
import { Button, Input, ErrorState } from '../ui'

export default function KeyLabelRename() {
  const [labels, setLabels] = useState({})
  const [key, setKey] = useState('')
  const [eng, setEng] = useState('')
  const [bng, setBng] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  useEffect(() => { getGlobalLabels().then((data) => { setLabels(data); const first = Object.keys(data).sort()[0]; if (first) select(data, first) }).catch(setError) }, [])
  function select(data, nextKey) { const item = data[nextKey]; setKey(nextKey); setEng(item?.eng || ''); setBng(item?.bng && item.bng !== item.eng ? item.bng : '') }
  function handleSelect(event) { select(labels, event.target.value); setStatus('idle'); setError(null) }
  async function save(event) { event.preventDefault(); if (!key || !eng.trim()) { setError(new Error('English label খালি রাখা যাবে না।')); setStatus('error'); return } setStatus('loading'); setError(null); try { const row = await updateGlobalLabel(key, eng, bng); setLabels((current) => ({ ...current, [key]: { eng: row.eng, bng: row.bng || row.eng } })); setBng(row.bng || ''); await createAuditLog({ actionKey: 'update', module: 'global_ui_labels', recordId: key, details: { key } }); setStatus('success') } catch (requestError) { setError(requestError); setStatus('error') } }
  return <section className="admin-form" aria-labelledby="key-label-rename"><h3 id="key-label-rename">Key Label Rename</h3><form onSubmit={save}><label htmlFor="global-label-key">Key</label><select id="global-label-key" value={key} onChange={handleSelect} disabled={status === 'loading'}><option value="">Key নির্বাচন করুন</option>{Object.keys(labels).sort().map((item) => <option key={item} value={item}>{item}</option>)}</select><Input id="global-label-eng" name="global-label-eng" label="English" value={eng} onChange={(e) => setEng(e.target.value)} disabled={status === 'loading'} /><Input id="global-label-bng" name="global-label-bng" label="বাংলা" value={bng} onChange={(e) => setBng(e.target.value)} disabled={status === 'loading'} /><Button type="submit" disabled={status === 'loading' || !key || !eng.trim()}>{status === 'loading' ? 'Saving…' : 'Save'}</Button>{status === 'success' ? <span className="admin-success">লেবেল সংরক্ষণ হয়েছে।</span> : null}{status === 'error' && error ? <ErrorState description={error.message} /> : null}</form></section>
}
