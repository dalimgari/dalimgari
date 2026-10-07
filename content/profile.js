function bindProfileTabs(root=document){
    const page=root.querySelector?.("[data-page=profile]")||root.closest?.("[data-page=profile]");
    if(!page)return;
    if(page.dataset.profileTabsBound==="true")return;
    const tabs=[...page.querySelectorAll("[data-profile-tab]")];
    const panels=[...page.querySelectorAll("[data-profile-panel]")];
    if(!tabs.length||!panels.length)return;
    const selectTab=(name)=>{
        tabs.forEach(tab=>{
            const active=tab.dataset.profileTab===name;
            tab.classList.toggle("is-active",active);
            tab.setAttribute("aria-selected",String(active));
            tab.setAttribute("tabindex",active?"0":"-1");
        });
        panels.forEach(panel=>{
            const active=panel.dataset.profilePanel===name;
            panel.hidden=!active;
            panel.classList.toggle("is-active",active);
        });
    };
    tabs.forEach(tab=>tab.addEventListener("click",()=>selectTab(tab.dataset.profileTab)));
    tabs.forEach(tab=>tab.addEventListener("keydown",event=>{
        if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
        event.preventDefault();
        const index=tabs.indexOf(tab);
        const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:
            (index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
        tabs[next].focus();
        selectTab(tabs[next].dataset.profileTab);
    }));
    selectTab(tabs.find(tab=>tab.classList.contains("is-active"))?.dataset.profileTab||tabs[0].dataset.profileTab);
    page.dataset.profileTabsBound="true";
}
export async function initProfile(root){
    const page=root.querySelector("[data-page=profile]");
    if(!page)return;
    bindProfileTabs(page);
    const tabs=[...page.querySelectorAll("[data-profile-tab]")];
    const panels=[...page.querySelectorAll("[data-profile-panel]")];
    const selectTab=(name)=>{
        tabs.forEach(tab=>{
            const active=tab.dataset.profileTab===name;
            tab.classList.toggle("is-active",active);
            tab.setAttribute("aria-selected",String(active));
        });
        panels.forEach(panel=>{
            const active=panel.dataset.profilePanel===name;
            panel.hidden=!active;
            panel.classList.toggle("is-active",active);
        });
    };
    tabs.forEach(tab=>tab.addEventListener("click",()=>selectTab(tab.dataset.profileTab)));
    page.querySelector("[data-profile-open-settings]")?.addEventListener("click",()=>selectTab("settings"));

    const access=window.dalimgariAccess;
    const ctx=await access?.getContext?.();
    const owner=!!ctx?.isAuthenticated;
    page.querySelectorAll("[data-requires-owner]").forEach(el=>{el.hidden=!owner;});
    if(!owner)return;

    const user=ctx.user||ctx.session?.user;
    if(user){
        const metadata=user.user_metadata||{};
        page.querySelector("[data-profile-email]")?.replaceChildren(document.createTextNode(user.email||"—"));
        page.querySelector("[data-profile-status]")?.replaceChildren(document.createTextNode(user.email_confirmed_at?"Active":"Pending"));
        const client=window.dalimgariSupabase;
        let profile=null;
        if(client){
            const {data}=await client.from("User").select("email,account_status,bio,Role(name)").eq("user_id",user.id).maybeSingle();
            profile=data;
        }
        const roleLabel=(profile?.Role?.name||"member").toLowerCase()==="admin"?"Admin":"Member";
        page.querySelector("[data-profile-type]")?.replaceChildren(document.createTextNode(roleLabel));
        page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(profile?.bio||metadata.bio||"—"));
        const bioInput=page.querySelector("[data-profile-bio-input]");
        if(bioInput)bioInput.value=profile?.bio||metadata.bio||"";
    }
    const form=page.querySelector("[data-profile-form]");
    form?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=page.querySelector("[data-auth-message]");
        const bio=form.elements.bio.value.trim();
        const client=window.dalimgariSupabase;
        if(!client||!user){message.textContent="Profile service is unavailable.";return;}
        const {error}=await client.auth.updateUser({data:{...(user.user_metadata||{}),bio}});
        message.textContent=error?error.message:"Profile updated.";
        if(!error){
            page.querySelector("[data-profile-bio]")?.replaceChildren(document.createTextNode(bio||"—"));
        }
    });
}
function bootProfileTabs(){
    bindProfileTabs(document);
}
if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",bootProfileTabs,{once:true});
}else{
    bootProfileTabs();
}
