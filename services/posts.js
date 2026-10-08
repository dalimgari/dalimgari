const db=window.dalimgariSupabase;
export async function getFeed({limit=10,offset=0}={}){
  if(!db)return {data:[],error:new Error("Database unavailable.")};
  return db.from("posts").select("id,user_id,content,visibility,created_at,updated_at").eq("visibility","public").order("created_at",{ascending:false}).range(offset,offset+limit-1);
}
export async function createPost({content,visibility="public"}){
  const user=(await window.dalimgariAccess?.getContext?.())?.user;
  if(!user)return {data:null,error:new Error("Sign in required.")};
  return db.from("posts").insert({user_id:user.id,content:content.trim(),visibility}).select().single();
}
export async function toggleSave(postId,saved){
  const user=(await window.dalimgariAccess?.getContext?.())?.user;
  if(!user)return {error:new Error("Sign in required.")};
  return saved?db.from("saved_posts").delete().eq("post_id",postId).eq("user_id",user.id):db.from("saved_posts").insert({post_id:postId,user_id:user.id});
}
export async function sharePost(postId){
  const user=(await window.dalimgariAccess?.getContext?.())?.user;
  if(!user)return {error:new Error("Sign in required.")};
  return db.from("post_shares").upsert({post_id:postId,user_id:user.id},{onConflict:"post_id,user_id"});
}
