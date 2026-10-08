const db=window.dalimgariSupabase;
async function me(){return (await window.dalimgariAccess?.getContext?.())?.user||null}
async function profiles(ids){if(!ids.length)return [];const r=await db.from("public_profiles").select("user_id,display_name,avatar_url,bio").in("user_id",ids);return r.data||[]}
export async function getSocialList(type,userId){
 if(!db||!userId)return {data:[],error:null};
 let ids=[];
 if(type==="friends"){const r=await db.from("friendships").select("requester_id,addressee_id").eq("status","accepted").or("requester_id.eq."+userId+",addressee_id.eq."+userId);ids=(r.data||[]).map(x=>x.requester_id===userId?x.addressee_id:x.requester_id)}
 if(type==="followers"){const r=await db.from("follows").select("follower_id").eq("following_id",userId);ids=(r.data||[]).map(x=>x.follower_id)}
 if(type==="following"){const r=await db.from("follows").select("following_id").eq("follower_id",userId);ids=(r.data||[]).map(x=>x.following_id)}
 return {data:await profiles(ids),error:null}
}
export async function getRelationshipState(targetId){
 const u=await me(); if(!u)return {friend:"none",following:false,blocked:false};
 const [f,fl,b]=await Promise.all([
  db.from("friendships").select("id,status,requester_id,addressee_id").or("and(requester_id.eq."+u.id+",addressee_id.eq."+targetId+"),and(requester_id.eq."+targetId+",addressee_id.eq."+u.id+")").maybeSingle(),
  db.from("follows").select("follower_id").eq("follower_id",u.id).eq("following_id",targetId).maybeSingle(),
  db.from("blocks").select("blocked_id").eq("blocker_id",u.id).eq("blocked_id",targetId).maybeSingle()
 ]); return {friend:f.data?.status||"none",friendship:f.data||null,following:!!fl.data,blocked:!!b.data};
}