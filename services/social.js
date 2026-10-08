const db=window.dalimgariSupabase;
export async function getRelationship(userId,targetId){
  if(!db||!userId||!targetId||userId===targetId)return {friend:"self",following:false};
  const [f,fl,b]=await Promise.all([
    db.from("friendships").select("status,requester_id,addressee_id").or("and(requester_id.eq."+userId+",addressee_id.eq."+targetId+"),and(requester_id.eq."+targetId+",addressee_id.eq."+userId+")").maybeSingle(),
    db.from("follows").select("follower_id").eq("follower_id",userId).eq("following_id",targetId).maybeSingle(),
    db.from("blocks").select("blocked_id").eq("blocker_id",userId).eq("blocked_id",targetId).maybeSingle()
  ]);
  return {friend:f.data?.status||"none",following:!!fl.data,blocked:!!b.data};
}
export async function follow(targetId){const user=(await window.dalimgariAccess?.getContext?.())?.user; if(!user)return {error:new Error("Sign in required.")}; return db.from("follows").insert({follower_id:user.id,following_id:targetId});}
export async function unfollow(targetId){const user=(await window.dalimgariAccess?.getContext?.())?.user; if(!user)return {error:new Error("Sign in required.")}; return db.from("follows").delete().eq("follower_id",user.id).eq("following_id",targetId);}
export async function sendFriendRequest(targetId){const user=(await window.dalimgariAccess?.getContext?.())?.user; if(!user)return {error:new Error("Sign in required.")}; return db.from("friendships").insert({requester_id:user.id,addressee_id:targetId,status:"pending"});}
