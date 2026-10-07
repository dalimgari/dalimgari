const db=window.dalimgariSupabase;
const defaults={community:{name:"Dalimgari",country:"Bangladesh",region:"",timezone:"Asia/Dhaka",latitude:null,longitude:null,default_language:"en",calendars:["gregorian","bengali"]},widgets:{album_slider:{enabled:true,auto_slide:true,interval_ms:5000,limit:12},date_time:true,location:true,announcements:true,events:true,quick_actions:true,highlights:true}};
let cache=null;
async function read(key){if(!db)return null;const {data,error}=await db.from("platform_options").select("value").eq("key",key).maybeSingle();if(error)throw error;return data?.value||null}
export async function getPlatformContext(force=false){if(cache&&!force)return cache;const [community,widgets]=await Promise.all([read("community_config"),read("home_widgets")]);cache={community:{...defaults.community,...(community||{})},widgets:{...defaults.widgets,...(widgets||{})},device:getDeviceContext()};return cache}
export function getDeviceContext(){const width=window.innerWidth||0;const touch=window.matchMedia?.("(pointer: coarse)").matches||("ontouchstart" in window);return{width,touch,orientation:width>window.innerHeight?"landscape":"portrait",reducedMotion:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches||false,online:navigator.onLine}}
window.addEventListener("online",()=>{if(cache)cache.device=getDeviceContext()});
window.addEventListener("offline",()=>{if(cache)cache.device=getDeviceContext()});
