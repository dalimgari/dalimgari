const db=window.dalimgariSupabase;

async function currentUser(){
  return (await window.dalimgariAccess?.getContext?.())?.user||null;
}
function requireDb(){return db||{from:()=>({})}}
export async function getFeed({limit=10,offset=0}={}){
  if(!db)return {data:[],error:new Error("Database unavailable.")};
  const from=offset;
  const to=offset+limit-1;
  return db.from("posts").select(`
    id,user_id,content,visibility,created_at,updated_at,
    User:user_id(user_id,email,avatar_url,bio),
    post_media(sort_order,Media:Media!post_media_media_id_fkey(id,title,media_type,media_url,thumbnail_url)),
    post_reactions(user_id,reaction),
    comments(id,user_id,content,created_at,User:user_id(user_id,email,avatar_url)),
    post_shares(user_id)
  `).eq("visibility","public").order("created_at",{ascending:false}).range(from,to);
}
export async function createPost({content,visibility="public",files=[]}={}){
  const user=await currentUser();
  if(!user)return {data:null,error:new Error("Sign in required.")};
  const text=String(content||"").trim();
  if(!text&&!files.length)return {data:null,error:new Error("Write something or attach media.")};
  const post=await db.from("posts").insert({user_id:user.id,content:text||"Shared media",visibility}).select("id").single();
  if(post.error)return post;
  if(files.length){
    const media=await uploadPostMedia(files);
    if(media.error)return {data:post.data,error:media.error};
    if(media.data?.length){
      const links=media.data.map((m,i)=>({post_id:post.data.id,media_id:m.id,sort_order:i}));
      const linked=await db.from("post_media").insert(links);
      if(linked.error)return {data:post.data,error:linked.error};
    }
  }
  return post;
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
  return db.from("comments").select("id,post_id,user_id,content,created_at,User:user_id(user_id,email,avatar_url),post_replies(id,comment_id,user_id,content,created_at,User:user_id(user_id,email,avatar_url))").eq("post_id",postId).order("created_at",{ascending:true});
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
  const user=await currentUser(); if(!user)return {error:new Error("Sign in required.")};
  return db.from("post_shares").upsert({post_id:postId,user_id:user.id},{onConflict:"post_id,user_id"});
}
export async function getPostState(postId){
  const user=await currentUser();
  if(!user)return {saved:false,reaction:null};
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
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=user.id+"/"+crypto.randomUUID()+"-"+safe;
    const up=await db.storage.from("community-media").upload(path,file,{upsert:false,contentType:file.type,cacheControl:"31536000"});
    if(up.error)return {error:up.error};
    const url=db.storage.from("community-media").getPublicUrl(path).data.publicUrl;
    const row=await db.from("Media").insert({user_id:user.id,title:file.name,media_type:file.type.startsWith("video/")?"video":"image",mime_type:file.type,file_size:file.size,media_url:url,visibility:"public"}).select("id,title,media_type,media_url,thumbnail_url").single();
    if(row.error)return {error:row.error};
    media.push(row.data);
  }
  return {data:media};
}
