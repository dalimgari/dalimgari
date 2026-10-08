const db=window.dalimgariSupabase;
async function user(){return (await window.dalimgariAccess?.getContext?.())?.user||null}
export async function getRelationship(userId,targetId){
 if(!db||!userId||!targetId||userId===targetId)return {friend:"self",following:false,blocked:false};
 const [f,fl,b]=await Promise.all([
  db.from("friendships").select("id,status,requester_id,addressee_id").or("and(requester_id.eq."+userId+",addressee_id.eq."+targetId+"),and(requester_id.eq."+targetId+",addressee_id.eq."+userId+")").maybeSingle(),
  db.from("follows").select("follower_id").eq("follower_id",userId).eq("following_id",targetId).maybeSingle(),
  db.from("blocks").select("blocked_id").eq("blocker_id",userId).eq("blocked_id",targetId).maybeSingle()
 ]);
 return {friend:f.data?.status||"none",friendship:f.data||null,following:!!fl.data,blocked:!!b.data};
}
export async function follow(targetId){const u=await user();if(!u)return {error:new Error("Sign in required.")};return db.from("follows").upsert({follower_id:u.id,following_id:targetId},{onConflict:"follower_id,following_id"});}
export async function unfollow(targetId){const u=await user();if(!u)return {error:new Error("Sign in required.")};return db.from("follows").delete().eq("follower_id",u.id).eq("following_id",targetId);}
export async function sendFriendRequest(targetId){
 const u=await user();if(!u)return {error:new Error("Sign in required.")};
 const existing=await db.from("friendships").select("id,status,requester_id,addressee_id").or("and(requester_id.eq."+u.id+",addressee_id.eq."+targetId+"),and(requester_id.eq."+targetId+",addressee_id.eq."+u.id+")").maybeSingle();
 if(existing.error)return existing;
 if(existing.data){
  if(existing.data.status==="pending"&&existing.data.requester_id===u.id)return existing;
  return db.from("friendships").update({requester_id:u.id,addressee_id:targetId,status:"pending",updated_at:new Date().toISOString()}).eq("id",existing.data.id).select().single();
 }
 return db.from("friendships").insert({requester_id:u.id,addressee_id:targetId,status:"pending"}).select().single();
}
export async function respondFriendRequest(friendshipId,status){
 const u=await user();if(!u)return {error:new Error("Sign in required.")};
 if(!["accepted","declined","cancelled"].includes(status))return {error:new Error("Invalid friendship action.")};
 return db.from("friendships").update({status,updated_at:new Date().toISOString()}).eq("id",friendshipId).or("requester_id.eq."+u.id+",addressee_id.eq."+u.id).select().single();
}
export async function unfriend(targetId){
 const u=await user();if(!u)return {error:new Error("Sign in required.")};
 return db.from("friendships").delete().or("and(requester_id.eq."+u.id+",addressee_id.eq."+targetId+"),and(requester_id.eq."+targetId+",addressee_id.eq."+u.id)");
}
export async function block(targetId){const u=await user();if(!u)return {error:new Error("Sign in required.")};return db.from("blocks").upsert({blocker_id:u.id,blocked_id:targetId},{onConflict:"blocker_id,blocked_id"});}
export async function unblock(targetId){const u=await user();if(!u)return {error:new Error("Sign in required.")};return db.from("blocks").delete().eq("blocker_id",u.id).eq("blocked_id",targetId);}
