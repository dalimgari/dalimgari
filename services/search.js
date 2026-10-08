const db=window.dalimgariSupabase;
export async function searchAll(query,{limit=8}={}){
 const q=String(query||"").trim(); if(!db||q.length<2)return {users:[],posts:[],media:[],error:null};
 const pattern="%"+q.replace(/[%_]/g,"\\$&")+"%";
 const [users,posts,media]=await Promise.all([
  db.from("public_profiles").select("user_id,display_name,avatar_url,bio").ilike("display_name",pattern).limit(limit),
  db.from("posts").select("id,user_id,content,created_at,visibility").ilike("content",pattern).order("created_at",{ascending:false}).limit(limit),
  db.from("Media").select("id,user_id,title,description,media_type,media_url,created_at").or("title.ilike."+pattern+",description.ilike."+pattern).order("created_at",{ascending:false}).limit(limit)
 ]);
 const error=users.error||posts.error||media.error; if(error)return {users:users.data||[],posts:posts.data||[],media:media.data||[],error};
 const ids=[...new Set((posts.data||[]).map(x=>x.user_id).concat((media.data||[]).map(x=>x.user_id)))];
 const profiles=ids.length?await db.from("public_profiles").select("user_id,display_name,avatar_url").in("user_id",ids):{data:[]};
 const map=new Map((profiles.data||[]).map(x=>[x.user_id,x]));
 (posts.data||[]).forEach(x=>x.User=map.get(x.user_id)||null);(media.data||[]).forEach(x=>x.User=map.get(x.user_id)||null);
 return {users:users.data||[],posts:posts.data||[],media:media.data||[],error:null};
}