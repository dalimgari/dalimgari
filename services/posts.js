const db=window.dalimgariSupabase;

async function currentUser(){
  return (await window.dalimgariAccess?.getContext?.())?.user||null;
}
export async function getFeed({limit=10,offset=0}={}){
  if(!db)return {data:[],error:new Error("Database unavailable.")};
  const user=await currentUser();
  const relIds=new Set(user?[user.id]:[]);
  if(user){
    const [friends,follows]=await Promise.all([
      db.from("friendships").select("requester_id,addressee_id").eq("status","accepted").or("requester_id.eq."+user.id+",addressee_id.eq."+user.id),
      db.from("follows").select("following_id").eq("follower_id",user.id)
    ]);
    (friends.data||[]).forEach(x=>relIds.add(x.requester_id===user.id?x.addressee_id:x.requester_id));
    (follows.data||[]).forEach(x=>relIds.add(x.following_id));
  }
  const to=offset+limit-1;
  const result=await db.from("posts").select(`
    id,user_id,content,visibility,created_at,updated_at,
    User:user_id(user_id,email,display_name,avatar_url,bio),
    post_media(sort_order,Media:Media!post_media_media_id_fkey(id,title,media_type,media_url,thumbnail_url)),
    post_reactions(user_id,reaction),
    comments(id,user_id,content,created_at,User:user_id(user_id,email,display_name,avatar_url)),
    post_shares(user_id)
  `).order("created_at",{ascending:false}).range(offset,to);
  if(result.error)return result;
  const data=(result.data||[]).map(post=>{
    const score=relIds.has(post.user_id)?2:0;
    return {...post,_feedScore:score};
  }).sort((a,b)=>b._feedScore-a._feedScore||new Date(b.created_at)-new Date(a.created_at));
  return {...result,data};
}
export async function createPost({content,visibility="public",files=[]}={}){
  const user=await currentUser(); if(!user)return {data:null,error:new Error("Sign in required.")};
  const text=String(content||"").trim(); if(!text&&!files.length)return {data:null,error:new Error("Write something or attach media.")};
  const post=await db.from("posts").insert({user_id:user.id,content:text||"Shared media",visibility}).select("id").single();
  if(post.error)return post;
  if(files.length){
    const media=await uploadPostMedia(files);
    if(media.error)return {data:post.data,error:media.error};
    if(media.data?.length){
      const linked=await db.from("post_media").insert(media.data.map((m,i)=>({post_id:post.data.id,media_id:m.id,sort_order:i})));
      if(linked.error)return {data:post.data,error:linked.error};
    }
  }
  return post;
}
export async function updatePost(postId,{content,visibility}={}){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  const patch={}; if(content!==undefined)patch.content=String(content).trim(); if(visibility)patch.visibility=visibility;
  if(!patch.content&&!visibility)return {error:new Error("Nothing to update.")};
  return db.from("posts").update(patch).eq("id",postId).eq("user_id",user.id).select("id,content,visibility,updated_at").single();
}
export async function deletePost(postId){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  return db.from("posts").delete().eq("id",postId).eq("user_id",user.id);
}
export async function reactToPost(postId,reaction="like"){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  const existing=await db.from("post_reactions").select("reaction").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
  if(existing.error)return existing;
  if(existing.data?.reaction===reaction)return db.from("post_reactions").delete().eq("post_id",postId).eq("user_id",user.id);
  if(existing.data)return db.from("post_reactions").update({reaction}).eq("post_id",postId).eq("user_id",user.id);
  return db.from("post_reactions").insert({post_id:postId,user_id:user.id,reaction});
}
export async function getComments(postId){
  if(!db)return {data:[],error:new Error("Database unavailable.")};
  return db.from("comments").select("id,post_id,user_id,content,created_at,User:user_id(user_id,email,display_name,avatar_url),post_replies(id,comment_id,user_id,content,created_at,User:user_id(user_id,email,display_name,avatar_url))").eq("post_id",postId).order("created_at",{ascending:true});
}
export async function addComment(postId,content){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  const text=String(content||"").trim(); if(!text)return {error:new Error("Comment cannot be empty.")};
  return db.from("comments").insert({post_id:postId,user_id:user.id,content:text}).select().single();
}
export async function addReply(commentId,content){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  const text=String(content||"").trim(); if(!text)return {error:new Error("Reply cannot be empty.")};
  return db.from("post_replies").insert({comment_id:commentId,user_id:user.id,content:text}).select().single();
}
export async function toggleSave(postId,saved){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  return saved?db.from("saved_posts").delete().eq("post_id",postId).eq("user_id",user.id):db.from("saved_posts").insert({post_id:postId,user_id:user.id});
}
export async function sharePost(postId){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required."),created:false};
  const existing=await db.from("post_shares").select("id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
  if(existing.error)return {error:existing.error,created:false};
  if(existing.data)return {data:existing.data,created:false};
  const created=await db.from("post_shares").insert({post_id:postId,user_id:user.id}).select("id").single();
  return {...created,created:!created.error};
}
export async function getPostState(postId){
  const user=await currentUser(); if(!user)return {saved:false,reaction:null};
  const [saved,reaction]=await Promise.all([
    db.from("saved_posts").select("post_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle(),
    db.from("post_reactions").select("reaction").eq("post_id",postId).eq("user_id",user.id).maybeSingle()
  ]);
  return {saved:!!saved.data,reaction:reaction.data?.reaction||null};
}
async function uploadPostMedia(files){
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  const media=[];
  for(const file of files){
    if(!/^(image|video)\//.test(file.type))continue;
    if(file.size>50*1024*1024)return {error:new Error("Each media file must be 50 MB or smaller.")};
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=user.id+"/"+crypto.randomUUID()+"-"+safe;
    const up=await db.storage.from("community-media").upload(path,file,{upsert:false,contentType:file.type,cacheControl:"31536000"});
    if(up.error)return {error:up.error};
    const url=db.storage.from("community-media").getPublicUrl(path).data.publicUrl;
    const row=await db.from("Media").insert({user_id:user.id,title:file.name,media_type:file.type.startsWith("video/")?"video":"image",mime_type:file.type,file_size:file.size,media_url:url,visibility:"public"}).select("id,title,media_type,media_url,thumbnail_url").single();
    if(row.error)return {error:row.error}; media.push(row.data);
  }
  return {data:media};
}