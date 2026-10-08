const PROFILE_PAGES={
    overview:"./content/profile/overview.html",
    post:"./content/profile/post.html",
    photo:"./content/profile/photo.html",
    video:"./content/profile/video.html",
    album:"./content/profile/album.html",
    settings:"./content/profile/settings.html"
};
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
        const load=async()=>{
            const {data,error}=await client.from(config.table).select(config.select).eq("user_id",user.id).order("created_at",{ascending:false});
            if(error){setMessage(message,error.message,true);return;}
            list.replaceChildren(...(data||[]).map(row=>{
                const item=document.createElement("article");item.className="profile-crud__item";
                const title=document.createElement("strong");title.textContent=type==="posts"?row.content.slice(0,100):(row.title||row.name||config.title);
                const body=document.createElement("p");body.textContent=type==="posts"?row.content:(row.description||"");
                const actions=document.createElement("div");actions.className="profile-card__footer";
                const view=document.createElement("button");view.type="button";view.className="button";view.textContent="View";view.addEventListener("click",()=>window.open(type==="posts"?"#":row.media_url||"#","_blank","noopener"));
                const edit=document.createElement("button");edit.type="button";edit.className="button";edit.textContent="Edit";edit.addEventListener("click",()=>{form.elements.id.value=row.id;config.fields.forEach(k=>{if(form.elements[k])form.elements[k].value=row[k]??""});save.textContent="Save changes";cancel.hidden=false;form.scrollIntoView({behavior:"smooth",block:"start"})});
                const del=document.createElement("button");del.type="button";del.className="button";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm("Delete this item?"))return;const {error}=await client.from(config.table).delete().eq("id",row.id).eq("user_id",user.id);if(error)setMessage(message,error.message,true);else{setMessage(message,config.title+" deleted.");await load();}});
                actions.append(view,edit,del);item.append(title,body,actions);return item;
            }));
        };
        cancel?.addEventListener("click",()=>{form.reset();form.elements.id.value="";save.textContent="Create "+config.title;cancel.hidden=true;});
        form.addEventListener("submit",async event=>{
            event.preventDefault();
            const values=Object.fromEntries(new FormData(form).entries()),payload=config.build(values);
            const result=values.id?await client.from(config.table).update(payload).eq("id",values.id).eq("user_id",user.id):await client.from(config.table).insert({...payload,user_id:user.id});
            if(result.error)setMessage(message,result.error.message,true);else{setMessage(message,values.id?config.title+" updated.":config.title+" created.");cancel?.click();await load();}
        });
        load();
    });
}
async function initProfileContent(page,name,client,user){
    const content=page.querySelector("[data-profile-content]"),target=PROFILE_PAGES[name]||PROFILE_PAGES.overview;
    if(!content)return;
    const response=await fetch(target);
    if(!response.ok)throw new Error("Failed to load profile section: "+response.status);
    const html=await response.text();
    const template=document.createElement("template");template.innerHTML=html;
    const source=template.content.querySelector("[data-profile-section]");
    if(!source)throw new Error("Invalid profile section.");
    content.replaceChildren(...source.childNodes);
    await window.dalimgariProfileInitializeComponents?.(content);
    const active=page.querySelector('[data-profile-tab="' + name + '"]');
    page.querySelectorAll("[data-profile-tab]").forEach(tab=>tab.classList.toggle("is-active",tab===active));
    initCrud(content,client,user);
    const bioInput=content.querySelector("[data-profile-bio-input]");
    if(bioInput)bioInput.value=user.user_metadata?.bio||"";
    const form=content.querySelector("[data-profile-form]");
    form?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=content.querySelector("[data-auth-message]"),bio=form.elements.bio.value.trim();
        if(!client||!user){setMessage(message,"Profile service is unavailable.",true);return;}
        const {error}=await client.auth.updateUser({data:{...(user.user_metadata||{}),bio}});
        setMessage(message,error?error.message:"Profile updated.",!!error);
    });
}
export async function initProfile(root){
    const page=root.querySelector("[data-page=profile]");if(!page)return;
    const access=window.dalimgariAccess,ctx=await access?.getContext?.(),user=ctx?.user||ctx?.session?.user;
    if(!user)return;
    const metadata=user.user_metadata||{},client=window.dalimgariSupabase;
    page.querySelector("[data-profile-name]")?.replaceChildren(document.createTextNode(metadata.full_name||metadata.name||user.email?.split("@")[0]||"Profile"));
    page.querySelector("[data-profile-type]")?.replaceChildren(document.createTextNode(String(ctx?.role||"member").toLowerCase()==="admin"?"Admin":"Member"));
    const load=name=>initProfileContent(page,name,client,user).catch(error=>console.error("Profile section load failed:",error));
    page.querySelectorAll("[data-profile-tab]").forEach(tab=>tab.addEventListener("click",event=>{
        event.preventDefault();
        const name=tab.dataset.profileTab;
        if(window.location.hash!==tab.getAttribute("href"))history.pushState({profileTab:name},"",tab.getAttribute("href"));
        load(name);
    }));
    window.addEventListener("popstate",()=>load(getProfileNameFromHash()));
    const initial=getProfileNameFromHash();
    load(initial);
}
function getProfileNameFromHash(){const path=window.location.hash.slice(1);const match=path.match(/^content\/profile\/(overview|post|photo|video|album|settings)\.html$/);return match?.[1]||"overview";}
