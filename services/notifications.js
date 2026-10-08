const db=window.dalimgariSupabase;
async function user(){return (await window.dalimgariAccess?.getContext?.())?.user||null}
export async function getNotifications(limit=20){
  const u=await user();if(!u)return {data:[],count:0,error:null};
  return db.from("notifications").select("id,type,entity_type,entity_id,payload,read_at,created_at,User:actor_id(user_id,email,display_name,avatar_url)",{count:"exact"}).eq("user_id",u.id).order("created_at",{ascending:false}).limit(limit);
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