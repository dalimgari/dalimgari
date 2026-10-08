const esc=s=>String(s??"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const PROFILE_PAGES={overview:"./content/profile/overview.html",post:"./content/profile/post.html",photo:"./content/profile/photo.html",video:"./content/profile/video.html",album:"./content/profile/album.html",settings:"./content/profile/settings.html",about:"./content/profile/overview.html",posts:"./content/profile/post.html",photos:"./content/profile/photo.html",videos:"./content/profile/video.html",albums:"./content/profile/album.html",activity:"./content/profile/activity.html"};

function setMessage(box,message,error=false){if(!box)return;box.textContent=message;box.dataset.state=error?"error":"success";}

function initCrud(page,client,user){
 if(!client||!user)return;
 const configs={
  posts:{table:"posts",title:"Post",fields:["content","visibility"],select:"id,content,visibility,created_at,updated_at",build:v=>({content:v.content.trim(),visibility:v.visibility})},
  photo:{table:"Media",title:"Photo",fields:["title","media_url","description"],select:"id,title,description,media_url,created_at,updated_at",build:v=>({title:v.title.trim(),media_url:v.media_url.trim(),description:v.description.trim(),media_type:"image",visibility:"public"})},
  video:{table:"Media",title:"Video",fields:["title","media_url","description"],select:"id,title,description,media_url,created_at,updated_at",build:v=>({title:v.title.trim(),media_url:v.media_url.trim(),description:v.description.trim(),media_type:"video",visibility:"public"})},
  albums:{table:"Album",title:"Album",fields:["name","description","visibility"],select:"id,name,description,visibility,created_at,updated_at",build:v=>({name:v.name.trim(),description:v.description.trim(),visibility:v.visibility})}
 };
 page.querySelectorAll("[data-crud]").forEach(box=>{
  const type=box.dataset.crud,config=configs[type],form=box.querySelector("[data-crud-form]"),list=box.querySelector("[data-crud-list]"),message=box.querySelector("[data-crud-message]"),save=form?.querySelector("[data-action-save]"),cancel=form?.querySelector("[data-action-cancel]");
  if(!config||!form||!list)return;
  const load=async()=>{const {data,error}=await client.from(config.table).select(config.select).eq("user_id",user.id).order("created_at",{ascending:false});if(error){setMessage(message,error.message,true);return;}list.replaceChildren(...(data||[]).map(row=>{const item=document.createElement("article");item.className="profile-crud__item";const title=document.createElement("strong");title.textContent=type==="posts"?row.content.slice(0,100):(row.title||row.name||config.title);const body=document.createElement("p");body.textContent=type==="posts"?row.content:(row.description||"");const actions=document.createElement("div");actions.className="profile-card__footer";const view=document.createElement("button");view.type="button";view.className="button";view.textContent="View";view.addEventListener("click",()=>window.open(type==="posts"?"#":row.media_url||"#","_blank","noopener"));const edit=document.createElement("button");edit.type="button";edit.className="button";edit.textContent="Edit";edit.addEventListener("click",()=>{form.elements.id.value=row.id;config.fields.forEach(k=>{if(form.elements[k])form.elements[k].value=row[k]??""});save.textContent="Save changes";cancel.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"})});const del=document.createElement("button");del.type="button";del.className="button";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this item?"))return;const {error}=await client.from(config.table).delete().eq("id",row.id).eq("user_id",user.id);if(error)setMessage(message,error.message,true);else{setMessage(message,config.title+" deleted.");await load();}});actions.append(view,edit,del);item.append(title,body,actions);return item;}));};
  cancel?.addEventListener("click",()=>{form.reset();form.elements.id.value="";save.textContent="Create "+config.title;cancel.hidden=true;});
  form.addEventListener("submit",async event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form).entries()),payload=config.build(values);const result=values.id?await client.from(config.table).update(payload).eq("id",values.id).eq("user_id",user.id):await client.from(config.table).insert({...payload,user_id:user.id});if(result.error)setMessage(message,result.error.message,true);else{setMessage(message,values.id?config.title+" updated.":config.title+" created.");cancel?.click();await load();}});
  load();
 });
}

async function renderRelationship(page,profileId){
 const actions=page.querySelector("[data-profile-actions]");if(!actions)return;
 const ctx=await window.dalimgariAccess?.getContext?.(),me=ctx?.user?.id;if(!me||me===profileId){actions.hidden=true;return;}
 const blockBtn=actions.querySelector("[data-profile-block]");if(!blockBtn)return;
 const db=window.dalimgariSupabase;
 const state=await db.from("blocks").select("blocked_id").eq("blocker_id",me).eq("blocked_id",profileId).maybeSingle();
 blockBtn.textContent=state.data?"Unblock":"Block";
 blockBtn.onclick=async()=>{const r=state.data?await db.from("blocks").delete().eq("blocker_id",me).eq("blocked_id",profileId):await db.from("blocks").insert({blocker_id:me,blocked_id:profileId});if(!r.error)await renderRelationship(page,profileId);};
}

async function initProfileContent(page,name,client,user){
 const content=page.querySelector("[data-profile-content]"),target=PROFILE_PAGES[name]||PROFILE_PAGES.overview;if(!content)return;
 const response=await fetch(target);if(!response.ok)throw new Error("Failed to load profile section: "+response.status);
 const template=document.createElement("template");template.innerHTML=await response.text();const source=template.content.querySelector("[data-profile-section]");if(!source)throw new Error("Invalid profile section.");
 content.replaceChildren(...source.childNodes);
 const active=page.querySelector('[data-profile-tab="'+name+'"]');page.querySelectorAll("[data-profile-tab]").forEach(tab=>tab.classList.toggle("is-active",tab===active));
 if(user.__isOwner)initCrud(content,client,user);
 const social=content.querySelector("[data-profile-section='social']");
 if(social){
  const title=social.querySelector("[data-social-title]"),description=social.querySelector("[data-social-description]"),list=social.querySelector("[data-social-list]");
  const labels={friends:["Friends","Accepted community connections."],followers:["Followers","People who follow this profile."],following:["Following","Profiles this account follows."],activity:["Activity","Recent activity for this profile."]};
  const meta=labels[name]||["Social","Community connections."];title.textContent=meta[0];description.textContent=meta[1];
  if(name==="activity"){const r=await client.from("posts").select("id,content,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(10);list.innerHTML=(r.data||[]).map(x=>'<article class="profile-social__item"><strong>Post</strong><p>'+esc(x.content||"")+'</p></article>').join("")||'<div class="empty">No recent activity.</div>';}
  else{const r=await getSocialList(name,user.id);list.replaceChildren(...(r.data||[]).map(profile=>{const item=document.createElement("article");item.className="profile-social__item";const avatar=document.createElement("img");avatar.className="profile-social__avatar";avatar.src=profile.avatar_url||"";avatar.alt="";const info=document.createElement("div");const link=document.createElement("a");link.href="#content/profile.html?user="+encodeURIComponent(profile.user_id);link.textContent=profile.display_name||"Member";link.className="profile-social__name";const actions=document.createElement("div");actions.className="profile-social__actions";const followBtn=document.createElement("button");followBtn.type="button";followBtn.className="button";followBtn.textContent="Follow";followBtn.onclick=async()=>{followBtn.disabled=true;const state=await getRelationshipState(profile.user_id);const result=state.following?await unfollow(profile.user_id):await follow(profile.user_id);if(!result.error)followBtn.textContent=state.following?"Follow":"Following";followBtn.disabled=false;};info.append(link);actions.append(followBtn);item.append(avatar,info,actions);return item;}));}
 }
}

export async function initProfile(root){
 const page=root.querySelector("[data-page=profile]");if(!page)return;
 const access=window.dalimgariAccess,ctx=await access?.getContext?.(),authUser=ctx?.user||ctx?.session?.user;if(!authUser)return;
 const client=window.dalimgariSupabase,params=new URLSearchParams(window.location.hash.split("?")[1]||""),profileId=params.get("user")||authUser.id,isOwner=profileId===authUser.id;
 let profile=null;
 if(client){const r=isOwner?await client.from("User").select("email,display_name,account_status,bio,avatar_url").eq("user_id",profileId).maybeSingle():await client.from("public_profiles").select("user_id,display_name,avatar_url,bio").eq("user_id",profileId).maybeSingle();if(!r.error)profile=r.data||null;}
 if(!profile&&!isOwner){page.querySelector("[data-profile-name]")?.replaceChildren(document.createTextNode("Profile not found"));return;}
 const user={...authUser,id:profileId,email:profile?.email||authUser.email,__isOwner:isOwner,user_metadata:{...authUser.user_metadata,bio:profile?.bio||""}};
 page.querySelector("[data-profile-name]")?.replaceChildren(document.createTextNode(profile?.display_name||"Profile"));
 page.querySelector("[data-profile-type]")?.replaceChildren(document.createTextNode("Member"));
 page.querySelector("[data-profile-message]")?.toggleAttribute("hidden",isOwner);
 page.querySelector("[data-profile-message]")?.addEventListener("click",()=>{window.location.hash="content/messenger.html?user="+encodeURIComponent(profileId);});
 page.querySelectorAll(".is-owner-control").forEach(el=>el.hidden=!isOwner);
 await renderRelationship(page,profileId);
 const load=name=>initProfileContent(page,name,client,user).catch(error=>console.error("Profile section load failed:",error));
 page.querySelectorAll("[data-profile-tab]").forEach(tab=>tab.addEventListener("click",event=>{event.preventDefault();const name=tab.dataset.profileTab;window.location.hash=tab.getAttribute("href");load(name);}));
 const initial=getProfileNameFromHash();load(initial);
}
function getProfileNameFromHash(){const path=window.location.hash.slice(1).split("?")[0];const match=path.match(/^content\/profile\/(overview|post|photo|video|album|settings|about|posts|photos|videos|albums|activity)\.html$/);return match?.[1]||"overview";}
