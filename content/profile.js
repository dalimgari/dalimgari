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
            if(result.error)setMessage(message,result.error.message,true);
            else{setMessage(message,values.id?config.title+" updated.":config.title+" created.");cancel?.click();await load();}
        });
        load();
    });
}
export async function initProfile(root){
    const page=root.querySelector("[data-page=profile]");
    if(!page)return;
    const access=window.dalimgariAccess;
    const ctx=await access?.getContext?.();
    const user=ctx?.user||ctx?.session?.user;
    if(!user)return;
    const metadata=user.user_metadata||{};
    page.querySelector("[data-profile-name]")?.replaceChildren(document.createTextNode(metadata.full_name||metadata.name||user.email?.split("@")[0]||"Profile"));
    page.querySelector("[data-profile-email]")?.replaceChildren(document.createTextNode(user.email||"—"));
    page.querySelector("[data-profile-status]")?.replaceChildren(document.createTextNode(user.email_confirmed_at?"Active":"Pending"));
    const client=window.dalimgariSupabase;
    let profile=ctx?.profile||null;
    if(!profile&&client){
        const {data}=await client.from("User").select("email,account_status,bio,Role(name)").eq("user_id",user.id).maybeSingle();
        profile=data;
    }
    const roleName=String(profile?.role_name||profile?.role||profile?.Role?.name||"member").toLowerCase();
    const roleLabel=roleName==="admin"?"Admin":"Member";
    page.querySelectorAll("[data-profile-type]").forEach(el=>el.replaceChildren(document.createTextNode(roleLabel)));
    page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(profile?.bio||metadata.bio||"—"));
    const bioInput=page.querySelector("[data-profile-bio-input]");
    if(bioInput)bioInput.value=profile?.bio||metadata.bio||"";
    initCrud(page,client,user);
    const form=page.querySelector("[data-profile-form]");
    form?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=page.querySelector("[data-auth-message]");
        const bio=form.elements.bio.value.trim();
        if(!client||!user){setMessage(message,"Profile service is unavailable.",true);return;}
        const {error}=await client.auth.updateUser({data:{...(user.user_metadata||{}),bio}});
        setMessage(message,error?error.message:"Profile updated.",!!error);
        if(!error)page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(bio||"—"));
    });
}