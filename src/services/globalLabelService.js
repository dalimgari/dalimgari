import { supabase } from '../lib/supabase'
import { flattenUiSsot, UI_SSOT } from '../config/uiSSOT'
const cache = new Map()
export const GLOBAL_LABEL_DEFAULTS = Object.fromEntries(Object.entries(flattenUiSsot(UI_SSOT)).map(([key, value]) => [key, value.eng]))

export async function getGlobalLabels(){if(!supabase)return{};await Promise.all(Object.entries(GLOBAL_LABEL_DEFAULTS).map(([key,eng])=>ensureGlobalLabel(key,eng).catch(()=>null)));const {data,error}=await supabase.from('global_ui_labels').select('key,eng,bng');if(error)throw error;const labels={};for(const row of data||[]){labels[row.key]={eng:row.eng,bng:row.bng||null};cache.set(row.key,labels[row.key])}return labels}
export async function listGlobalLabels(){if(!supabase)throw new Error('Supabase is not configured');const {data,error}=await supabase.from('global_ui_labels').select('key,eng,bng').order('key',{ascending:true});if(error)throw error;return data||[]}
export function label(key,language='bng',fallback=key){const item=cache.get(key);if(!item)return fallback;return language==='eng'?(item.eng||fallback):(item.bng||fallback)}
export async function ensureGlobalLabel(key,eng){if(!supabase||!key||!eng)return null;const {data,error}=await supabase.rpc('ensure_global_ui_label',{p_key:key,p_eng:eng});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(row)cache.set(key,{eng:row.eng,bng:row.bng||null});return row}
export async function updateGlobalLabel(key,eng,bng){if(!supabase)throw new Error('Supabase is not configured');const english=String(eng??'').trim();const bangla=String(bng??'').trim()||null;if(!english)throw new Error('English label is required');const {data,error}=await supabase.from('global_ui_labels').update({eng:english,bng:bangla}).eq('key',key).select('key,eng,bng').single();if(error)throw error;cache.set(key,{eng:data.eng,bng:data.bng||null});return data}
export function clearGlobalLabelCache(){cache.clear()}
