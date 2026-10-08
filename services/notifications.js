const db=window.dalimgariSupabase;
async function user(){return (await window.dalimgariAccess?.getContext?.())?.user||null}
export async function getNotifications(limit=20){
 const u=await user();if(!u)return {data:[],count:0,error:null};
 const r=await db.from("notifications").select("id,actor_id,type,entity_type,entity_id,payload,read_at,created_at",{count:"exact"}).eq("user_id",u.id).order("created_at",{ascending:false}).limit(limit);
 if(r.error)return r;
 const ids=[...new Set((r.data||[]).map(x=>x.actor_id).filter(Boolean))];
 const profiles=ids.length?await db.from("public_profiles").select("user_id,display_name,avatar_url").in("user_id",ids):{data:[]};
 const map=new Map((profiles.data||[]).map(x=>[x.user_id,x]));
 (r.data||[]).forEach(x=>x.User=map.get(x.actor_id)||null);
 return r;
}
export async function getUnreadCount(){
 const u=await user();if(!u)return 0;
 const r=await db.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",u.id).is("read_at",null);
 return r.count||0;
}
export async function markNotificationRead(id){
 const u=await user();if(!u)return {error:new Error("Sign in required.")};
 return db.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",u.id);
}
export async function markAllNotificationsRead(){
 const u=await user();if(!u)return {error:new Error("Sign in required.")};
 return db.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",u.id).is("read_at",null);
}